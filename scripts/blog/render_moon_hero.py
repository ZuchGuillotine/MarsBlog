"""Render the "What's the Moon Worth?" hero image.

The Moon is ray-traced with its south pole tilted toward the viewer and Earth in
the distance. Inputs are NASA public-domain data from the CGI Moon Kit
(lroc_color_poles_4k.jpg, ldem_16_uint.tif), which are not committed here, and
public/data/orbits/earth-blue-marble.png.

Usage:
  python3 scripts/blog/render_moon_hero.py lroc_color_poles_4k.jpg ldem_16_uint.tif \
      public/data/orbits/earth-blue-marble.png out.png 2.0e-6

The last argument is the relief scale (about 7x true relief at 2.0e-6).
The published JPEG was saved from out.png at quality 88.
"""
import sys, math
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
color_p, dem_p, earth_p, out_p = sys.argv[1:5]

W, H = 2488, 1384
SS = 2  # supersample
w, h = W * SS, H * SS

tex = np.asarray(Image.open(color_p).convert("RGB"), dtype=np.float32) / 255.0
dem = np.asarray(Image.open(dem_p), dtype=np.float32)
dem = (dem - dem.mean())
earth = np.asarray(Image.open(earth_p).convert("RGB"), dtype=np.float32) / 255.0

def bilinear(img, u, v):
    """u in [0,1) wraps horizontally, v in [0,1] clamps."""
    hh, ww = img.shape[:2]
    x = (u % 1.0) * ww - 0.5
    y = np.clip(v * hh - 0.5, 0, hh - 1)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
    fx = x - x0; fy = y - y0
    x0m = x0 % ww; x1 = (x0 + 1) % ww
    y1 = np.clip(y0 + 1, 0, hh - 1)
    if img.ndim == 3:
        fx = fx[..., None]; fy = fy[..., None]
    a = img[y0, x0m] * (1 - fx) + img[y0, x1] * fx
    b = img[y1, x0m] * (1 - fx) + img[y1, x1] * fx
    return a * (1 - fy) + b * fy

def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])

def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])

def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])

# Camera frame: x right, y up, z toward viewer.
sun = np.array([-0.93, 0.30, 0.10]); sun /= np.linalg.norm(sun)

# Background: deep space with a faint warm/cool gradient, no stars (exposure set for a lit Moon).
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
nx = xx / w; ny = yy / h
img = np.zeros((h, w, 3), np.float32)
img[..., 0] = 0.010 + 0.012 * (1 - nx)
img[..., 1] = 0.012 + 0.010 * (1 - nx)
img[..., 2] = 0.020 + 0.016 * (1 - nx)

def render_body(cx, cy, r, texture, body_rot, dem_map=None, relief=0.0, kind="moon"):
    global img
    px = (xx - cx) / r
    py = -(yy - cy) / r
    rr = px * px + py * py
    mask = rr <= 1.0
    # soft antialias edge handled by supersampling
    X = px[mask]; Y = py[mask]; Z = np.sqrt(np.clip(1 - rr[mask], 0, 1))
    P = np.stack([X, Y, Z], axis=-1)            # camera frame
    B = P @ body_rot                              # body frame (row vectors -> R^T applied)
    # body frame: z = north pole, x = lon 0 (sub-Earth for the Moon)
    lat = np.arcsin(np.clip(B[:, 2], -1, 1))
    lon = np.arctan2(B[:, 1], B[:, 0])
    u = (lon + math.pi) / (2 * math.pi)
    v = (math.pi / 2 - lat) / math.pi
    alb = bilinear(texture, u, v)
    N = P.copy()
    if dem_map is not None and relief > 0:
        hh, ww = dem_map.shape
        du = 1.0 / ww; dv = 1.0 / hh
        h_e = bilinear(dem_map, u + du, v); h_w = bilinear(dem_map, u - du, v)
        h_n = bilinear(dem_map, u, v - dv); h_s = bilinear(dem_map, u, v + dv)
        dh_dlon = (h_e - h_w) / (2 * du * 2 * math.pi)        # per radian
        dh_dlat = (h_n - h_s) / (2 * dv * math.pi)
        coslat = np.clip(np.cos(lat), 0.05, 1)
        # tangent vectors in body frame
        east = np.stack([-np.sin(lon), np.cos(lon), np.zeros_like(lon)], -1)
        north = np.stack([-np.sin(lat) * np.cos(lon), -np.sin(lat) * np.sin(lon), np.cos(lat)], -1)
        nb = B - relief * (dh_dlon / coslat)[:, None] * east - relief * dh_dlat[:, None] * north
        nb /= np.linalg.norm(nb, axis=1, keepdims=True)
        N = nb @ body_rot.T
    mu0 = np.clip(N @ sun, 0, None)
    mu = np.clip(N[:, 2], 1e-3, None)
    mu0_s = np.clip(P @ sun, 0, None)
    if kind == "moon":
        ls = mu0 / (mu0 + mu + 1e-6)
        lam = mu0
        shade = 1.55 * ls * 0.62 + 1.0 * lam * 0.48
        col = alb * shade[:, None]
        col = col * np.array([1.03, 1.0, 0.95])  # very slight warm
    else:
        lam = mu0_s
        shade = lam ** 0.9
        col = alb * shade[:, None] * 1.25
        # atmosphere rim
        rim = (1 - Z) ** 3
        atm = np.array([0.30, 0.55, 1.0]) * (rim * np.clip(mu0_s * 1.4 + 0.15, 0, 1))[:, None] * 0.9
        col = col + atm
    region = img[mask]
    img[mask] = col
    return mask

# Moon: sub-observer latitude -38 deg (south pole tilted toward us), longitude ~ +8.
lat0 = math.radians(-32); lon0 = math.radians(8)
# Build body->camera: start with body z-up, camera looking down body -x? We want the
# sub-observer point (lat0, lon0) on the camera +z axis and body north up-ish.
# camera_from_body = Rx(-(90+lat0)) ... compose explicitly:
def camera_from_body(lat0, lon0, roll):
    # body point at (lat0, lon0) -> camera +z; body north projects to camera +y
    zc = np.array([math.cos(lat0) * math.cos(lon0), math.cos(lat0) * math.sin(lon0), math.sin(lat0)])
    npole = np.array([0, 0, 1.0])
    yc = npole - zc * (npole @ zc); yc /= np.linalg.norm(yc)
    xc = np.cross(yc, zc)
    M = np.stack([xc, yc, zc])  # rows: camera axes in body coords -> body->camera
    return rot_z(roll) @ M
Mbc = camera_from_body(lat0, lon0, math.radians(-14))
Me = camera_from_body(math.radians(18), math.radians(5), math.radians(12))
render_body(0.235 * w, 0.205 * h, 0.072 * h, earth, Me, kind="earth")
# P_cam = Mbc @ B  -> B = Mbc.T @ P_cam ; with row vectors: B = P @ Mbc
moon_mask = render_body(0.69 * w, 0.47 * h, 0.455 * h, tex, Mbc, dem_map=dem, relief=float(sys.argv[5]) if len(sys.argv)>5 else 1.2e-5, kind="moon")

# Subtle glow around Earth only.
out = np.clip(img, 0, 1)
out = out ** (1 / 1.12)
im = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
im = im.resize((W, H), Image.LANCZOS)

glow = Image.new("RGB", (W, H), (0, 0, 0))
import PIL.ImageDraw as D
g = D.Draw(glow)
ex, ey, er = 0.235 * W, 0.205 * H, 0.072 * H
g.ellipse([ex - er * 1.12, ey - er * 1.12, ex + er * 1.12, ey + er * 1.12], fill=(40, 70, 130))
glow = glow.filter(ImageFilter.GaussianBlur(er * 0.35))
im = Image.fromarray(np.clip(np.asarray(im, np.int32) + np.asarray(glow, np.int32) * 0.35, 0, 255).astype(np.uint8))
im.save(out_p, optimize=True)
print("saved", out_p, im.size)
