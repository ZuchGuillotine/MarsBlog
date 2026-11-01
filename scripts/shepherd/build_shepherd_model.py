"""Parametric 3D model of Shepherd-1, the laser-ablation debris-remediation
pathfinder, built with Blender's Python module (``pip install bpy``).

Every component is placed from the dimensions in
``docs/shepherd-1/shepherd-1-spec.json`` and the sizing in
``scripts/shepherd/size_shepherd1.py``. Objects carry custom properties
(``subsystem``, ``label``, ``part``) that survive glTF export as node extras,
so the web viewer can highlight, label and explode subsystems. Gimbal axes are
exported as named empties (``gimbal_az``, ``gimbal_el``) for animation.

Body frame (metres, Blender Z-up):
  +X ram (velocity), -X aft: beam director boresight (nominal)
  -Y sun side (dawn-dusk orbit), +Y anti-sun: radiators
  +Z zenith, -Z nadir: separation ring

Usage (from the repository root):
  python3 scripts/shepherd/build_shepherd_model.py                # GLB + preview
  python3 scripts/shepherd/build_shepherd_model.py --no-preview
  python3 scripts/shepherd/build_shepherd_model.py --stowed       # launch configuration

Imported by ``render_shepherd.py`` for the hero renders and turntable.
"""
from __future__ import annotations

import argparse
import json
import math
import random
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "docs/shepherd-1/shepherd-1-spec.json"
PUBLIC = ROOT / "public/shepherd"
TEX_DIR = PUBLIC / "textures"
GLB_PATH = PUBLIC / "shepherd-1.glb"

SPEC = json.loads(SPEC_PATH.read_text())
SUBSYSTEMS = {s["id"]: s for s in SPEC["subsystems"]}

# ----------------------------------------------------------------------------
# Principal dimensions (m)
# ----------------------------------------------------------------------------
BX, BY, BZ = 1.00, 0.95, 0.85          # bus body
HX, HY, HZ = BX / 2, BY / 2, BZ / 2
CRADLE_X = -0.12                       # cradle back wall (x from -HX to here, z > 0)
GIMBAL_X = -0.36                       # azimuth axis position
EL_Z = 0.26                            # elevation axis height above cradle floor (z = 0)
TUBE_R, TUBE_L = 0.225, 0.42           # 0.45 m aperture telescope
RING_R = 0.305                         # 24-inch separation ring
WING_W, WING_L = 1.10, 5.00            # roll-out blanket wings
RAD_L, RAD_H = 2.00, 0.85              # deployable radiator panels

# ----------------------------------------------------------------------------
# Materials
# ----------------------------------------------------------------------------
MATS: dict[str, bpy.types.Material] = {}


def _hex(c: str) -> tuple[float, float, float, float]:
    c = c.lstrip("#")
    r, g, b = (int(c[i : i + 2], 16) / 255 for i in (0, 2, 4))
    # sRGB -> linear
    lin = [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in (r, g, b)]
    return (lin[0], lin[1], lin[2], 1.0)


def material(name: str, color, metallic=0.0, roughness=0.5, emission=None,
             emission_strength=0.0, alpha=1.0, texture: Path | None = None,
             bump: float = 0.0, coat: float = 0.0) -> bpy.types.Material:
    if name in MATS:
        return MATS[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes["Principled BSDF"]
    rgba = _hex(color) if isinstance(color, str) else color
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if coat and "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    if emission is not None:
        em = _hex(emission) if isinstance(emission, str) else emission
        bsdf.inputs["Emission Color"].default_value = em
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        for attr, val in (("blend_method", "BLEND"), ("surface_render_method", "BLENDED")):
            if hasattr(mat, attr):
                try:
                    setattr(mat, attr, val)
                except Exception:
                    pass
    if texture is not None and texture.exists():
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(texture))
        tex.location = (-400, 300)
        links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if bump > 0:
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 28.0
        noise.inputs["Detail"].default_value = 8.0
        noise.inputs["Roughness"].default_value = 0.75
        if "Distortion" in noise.inputs:
            noise.inputs["Distortion"].default_value = 0.6
        bnode = nodes.new("ShaderNodeBump")
        bnode.inputs["Strength"].default_value = bump
        bnode.inputs["Distance"].default_value = 0.002
        links.new(noise.outputs["Fac"], bnode.inputs["Height"])
        links.new(bnode.outputs["Normal"], bsdf.inputs["Normal"])
    MATS[name] = mat
    return mat


def make_solar_texture(path: Path) -> None:
    """Generate a triple-junction cell blanket texture (dark blue cells, silver
    gridlines and busbars) for the roll-out wings."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:  # pragma: no cover
        return
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    w, h = 1024, 4096  # 1.1 m x 5.0 m  -> ~ 930 px/m
    img = Image.new("RGB", (w, h), (12, 18, 40))
    d = ImageDraw.Draw(img)
    cell_w, cell_h, gap = 74, 37, 4  # 8 x 4 cm cells, 4 mm gaps
    rnd = random.Random(7)
    y = 24
    while y + cell_h < h - 24:
        x = 24
        while x + cell_w < w - 24:
            shade = rnd.randint(-6, 6)
            d.rectangle([x, y, x + cell_w, y + cell_h], fill=(18 + shade, 30 + shade, 72 + shade))
            # three busbars
            for k in (0.25, 0.5, 0.75):
                bx = x + int(cell_w * k)
                d.line([bx, y + 2, bx, y + cell_h - 2], fill=(170, 175, 185), width=1)
            x += cell_w + gap
        y += cell_h + gap
    # hinge/fold lines every 1.0 m
    for k in range(1, 5):
        yy = int(h * k / 5)
        d.rectangle([0, yy - 3, w, yy + 3], fill=(40, 42, 48))
    img.save(path)


def make_osr_texture(path: Path) -> None:
    """Optical solar reflector tile pattern for radiators (4 x 4 cm tiles)."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:  # pragma: no cover
        return
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    w, h = 2048, 1024
    img = Image.new("RGB", (w, h), (205, 212, 222))
    d = ImageDraw.Draw(img)
    tile = 40
    rnd = random.Random(3)
    for y in range(0, h, tile):
        for x in range(0, w, tile):
            s = rnd.randint(-8, 8)
            d.rectangle([x + 1, y + 1, x + tile - 2, y + tile - 2], fill=(222 + s, 228 + s, 236 + s))
    img.save(path)


def init_materials() -> None:
    make_solar_texture(TEX_DIR / "solar_blanket.png")
    make_osr_texture(TEX_DIR / "osr_tiles.png")
    material("mli_gold", "#e3b45c", metallic=1.0, roughness=0.22, bump=1.1)
    material("mli_black", "#26231f", metallic=0.7, roughness=0.42, bump=0.9)
    material("cfrp", "#17181b", metallic=0.15, roughness=0.42, coat=0.3)
    material("aluminium", "#b9bcc2", metallic=1.0, roughness=0.35)
    material("aluminium_dark", "#3a3d43", metallic=0.9, roughness=0.45)
    material("titanium", "#8d8a84", metallic=1.0, roughness=0.42)
    material("white_paint", "#e6e8ea", metallic=0.0, roughness=0.55)
    material("osr", "#dfe5ec", metallic=0.55, roughness=0.12, texture=TEX_DIR / "osr_tiles.png")
    material("mirror_sic", "#f4f5f7", metallic=1.0, roughness=0.02)
    material("mirror_back_sic", "#6f7378", metallic=0.3, roughness=0.6)
    material("solar_cells", "#101a3a", metallic=0.5, roughness=0.22, texture=TEX_DIR / "solar_blanket.png")
    material("solar_back", "#2c2a2a", metallic=0.1, roughness=0.8)
    material("copper", "#c17a4a", metallic=1.0, roughness=0.4)
    material("ceramic", "#f1eee6", metallic=0.0, roughness=0.7)
    material("kapton_amber", "#b86a1c", metallic=0.4, roughness=0.3)
    material("glass_dark", "#0b0d12", metallic=0.3, roughness=0.05, coat=1.0)
    material("steel", "#9a9da3", metallic=1.0, roughness=0.3)
    material("beam", (0.55, 0.3, 1.0, 1.0), emission=(0.62, 0.35, 1.0, 1.0), emission_strength=1.2, alpha=0.045)
    material("plume", (1.0, 0.8, 0.9, 1.0), emission=(1.0, 0.75, 0.95, 1.0), emission_strength=40.0, alpha=0.9)
    material("debris", "#8d8f93", metallic=0.9, roughness=0.6)


# ----------------------------------------------------------------------------
# Scene helpers
# ----------------------------------------------------------------------------
ROOTS: dict[str, bpy.types.Object] = {}
STOWED_FLAG = [False]


def reset_scene() -> None:
    MATS.clear()
    ROOTS.clear()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.unit_settings.system = "METRIC"
    scn.unit_settings.scale_length = 1.0


def tag(obj: bpy.types.Object, subsystem: str, label: str, part: str | None = None) -> None:
    obj["subsystem"] = subsystem
    obj["label"] = label
    obj["part"] = part or obj.name
    obj.name = f"{subsystem}:{part or label}"


def set_parent(obj: bpy.types.Object, parent: bpy.types.Object) -> None:
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()


def subsystem_root(sid: str) -> bpy.types.Object:
    if sid in ROOTS:
        return ROOTS[sid]
    empty = bpy.data.objects.new(f"sub_{sid}", None)
    empty.empty_display_size = 0.1
    bpy.context.scene.collection.objects.link(empty)
    meta = SUBSYSTEMS[sid]
    empty["subsystem"] = sid
    empty["label"] = meta["label"]
    empty["explode"] = meta["explode"]
    empty["color"] = meta["color"]
    empty["summary"] = meta["summary"]
    empty["vendors"] = meta["vendors"]
    ROOTS[sid] = empty
    return empty


def finish(obj: bpy.types.Object, mat: str, sid: str, label: str, part: str | None = None,
           parent: bpy.types.Object | None = None, smooth: bool = False, bevel: float = 0.0) -> bpy.types.Object:
    obj.data.materials.append(MATS[mat])
    if smooth:
        for p in obj.data.polygons:
            p.use_smooth = True
        es = obj.modifiers.new("EdgeSplit", "EDGE_SPLIT")
        es.split_angle = math.radians(32)
    if bevel > 0:
        bv = obj.modifiers.new("Bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 3
        bv.limit_method = "ANGLE"
    tag(obj, sid, label, part)
    set_parent(obj, parent or subsystem_root(sid))
    return obj


def box(size, loc, mat, sid, label, part=None, rot=(0, 0, 0), parent=None, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.scale = (size[0], size[1], size[2])
    bpy.ops.object.transform_apply(scale=True)
    return finish(obj, mat, sid, label, part, parent, bevel=bevel)


def cylinder(radius, depth, loc, mat, sid, label, part=None, axis="Z", rot_extra=(0, 0, 0),
             parent=None, verts=64, smooth=True, bevel=0.0):
    rot = {"Z": (0, 0, 0), "X": (0, math.pi / 2, 0), "Y": (math.pi / 2, 0, 0)}[axis]
    rot = tuple(a + b for a, b in zip(rot, rot_extra))
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.active_object
    return finish(obj, mat, sid, label, part, parent, smooth=smooth, bevel=bevel)


def tube(r_out, r_in, depth, loc, mat, sid, label, part=None, axis="Z", parent=None, verts=64):
    """Hollow cylinder (ring extrusion)."""
    rot = {"Z": (0, 0, 0), "X": (0, math.pi / 2, 0), "Y": (math.pi / 2, 0, 0)}[axis]
    bpy.ops.mesh.primitive_circle_add(vertices=verts, radius=r_out, location=loc, rotation=rot, fill_type="NOTHING")
    obj = bpy.context.active_object
    import bmesh

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    # inner ring
    inner = [bm.verts.new((v.co.x * r_in / r_out, v.co.y * r_in / r_out, 0.0)) for v in list(bm.verts)]
    outer = list(bm.verts)[: len(inner)]
    n = len(inner)
    faces = []
    for i in range(n):
        a, b = outer[i], outer[(i + 1) % n]
        c, d = inner[(i + 1) % n], inner[i]
        faces.append(bm.faces.new((a, b, c, d)))
    bm.to_mesh(obj.data)
    bm.free()
    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = depth
    solid.offset = 0.0
    return finish(obj, mat, sid, label, part, parent, smooth=True)


def sphere(radius, loc, mat, sid, label, part=None, parent=None, segments=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=segments // 2, radius=radius, location=loc)
    obj = bpy.context.active_object
    return finish(obj, mat, sid, label, part, parent, smooth=True)


def empty(name, loc, parent=None):
    """Pivot empty. Create it unrotated, parent the children, then rotate it
    with ``rotate_pivot`` so the children turn about the pivot (a parent
    inverse computed from a rotated parent would cancel the rotation)."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.05
    bpy.context.scene.collection.objects.link(e)
    e.location = loc
    if parent is not None:
        set_parent(e, parent)
    return e


def rotate_pivot(e, rot=(0, 0, 0)) -> None:
    e.rotation_euler = Euler(rot)
    bpy.context.view_layer.update()


# ----------------------------------------------------------------------------
# Subsystems
# ----------------------------------------------------------------------------
def build_bus(stowed: bool) -> None:
    sid = "bus"
    # Lower deck (full footprint) and upper-forward block, leaving the aft cradle.
    box((BX, BY, HZ), (0, 0, -HZ / 2), "cfrp", sid, "Primary structure", "lower deck", bevel=0.012)
    ux = HX - CRADLE_X
    box((ux, BY, HZ), (CRADLE_X + ux / 2, 0, HZ / 2), "cfrp", sid, "Primary structure", "upper deck", bevel=0.012)
    # MLI blankets: sun face (-Y) and ram face (+X), amber Kapton edge tape look
    box((BX - 0.04, 0.012, HZ - 0.03), (0, -HY - 0.006, -HZ / 2), "mli_gold", sid, "MLI blanket", "sun-face MLI lower")
    box((ux - 0.04, 0.012, HZ - 0.03), (CRADLE_X + ux / 2, -HY - 0.006, HZ / 2), "mli_gold", sid, "MLI blanket", "sun-face MLI upper")
    box((0.012, BY - 0.04, BZ - 0.04), (HX + 0.006, 0, 0), "mli_gold", sid, "MLI blanket", "ram-face MLI")
    # Cradle floor and back wall are honeycomb with black MLI
    box((HX + CRADLE_X - 0.02, BY - 0.04, 0.012), ((-HX + CRADLE_X) / 2, 0, 0.006), "mli_black", sid, "MLI blanket", "cradle floor MLI")
    box((0.012, BY - 0.04, HZ - 0.03), (CRADLE_X + 0.006, 0, HZ / 2), "mli_black", sid, "MLI blanket", "cradle wall MLI")
    # Aft face below cradle: black MLI
    box((0.012, BY - 0.04, HZ - 0.03), (-HX - 0.006, 0, -HZ / 2), "mli_black", sid, "MLI blanket", "aft-face MLI")
    # Anti-sun face: body radiator with OSR tiles (upper and lower strips around hinges)
    box((BX - 0.08, 0.01, BZ - 0.06), (0, HY + 0.005, 0), "osr", sid, "Body radiator (OSR)", "body radiator")
    # Nadir face: OSR patch inside the ring plus MLI outside
    box((BX - 0.04, BY - 0.04, 0.01), (0, 0, -HZ - 0.005), "mli_black", sid, "MLI blanket", "nadir MLI")
    # Zenith face MLI (upper deck only)
    box((ux - 0.04, BY - 0.04, 0.01), (CRADLE_X + ux / 2, 0, HZ + 0.005), "mli_black", sid, "MLI blanket", "zenith MLI")
    # Separation ring (24 in) and clamp band
    tube(RING_R, RING_R - 0.025, 0.06, (0, 0, -HZ - 0.03), "aluminium", sid, "Separation ring (24-inch Lightband class)", "separation ring")
    tube(RING_R + 0.012, RING_R - 0.012, 0.012, (0, 0, -HZ - 0.062), "steel", sid, "Separation ring (24-inch Lightband class)", "clamp ring")
    # MMOD stuffed-Whipple bumper panels on the ram face (above and below the thruster platform)
    for z, part in ((0.27, "ram bumper upper"), (-0.27, "ram bumper lower")):
        box((0.008, BY - 0.10, 0.26), (HX + 0.05, 0, z), "aluminium_dark", sid, "MMOD Whipple bumper", part)
        for y in (-0.33, 0.33):
            cylinder(0.012, 0.045, (HX + 0.025, y, z), "aluminium", sid, "MMOD Whipple bumper", f"{part} standoff {y:+.1f}", axis="X", verts=16)
    # Frame edges (machined aluminium longerons) for visual structure
    for y in (-HY, HY):
        for z in (-HZ, 0.0):
            box((BX, 0.02, 0.02), (0, y, z), "aluminium_dark", sid, "Primary structure", f"longeron y{y:+.2f} z{z:+.2f}")
    box((0.02, BY, 0.02), (CRADLE_X, 0, HZ), "aluminium_dark", sid, "Primary structure", "cradle top edge")
    for y in (-HY, HY):
        box((0.02, 0.02, HZ), (CRADLE_X, y, HZ / 2), "aluminium_dark", sid, "Primary structure", f"cradle post y{y:+.2f}")
    # Grounding / umbilical connector plate on nadir face
    box((0.12, 0.08, 0.02), (-0.33, -0.3, -HZ - 0.01), "aluminium", sid, "Umbilical & test connectors", "umbilical plate")


def build_beam_director(stowed: bool, target: Vector | None):
    sid = "beam_director"
    root = subsystem_root(sid)
    # Azimuth base on the cradle floor
    cylinder(0.15, 0.05, (GIMBAL_X, 0, 0.025), "aluminium_dark", sid, "Gimbal azimuth bearing", "azimuth base", parent=root)
    cylinder(0.11, 0.03, (GIMBAL_X, 0, 0.065), "steel", sid, "Gimbal azimuth bearing", "azimuth bearing race", parent=root)
    # Coude riser from the laser bench through the hollow azimuth axis
    cylinder(0.035, 0.34, (GIMBAL_X, 0, -0.14), "aluminium", sid, "Coude beam tube", "coude riser", parent=root)
    # HDRM for the gimbal (launch lock) on the cradle floor
    cylinder(0.03, 0.06, (GIMBAL_X - 0.22, 0.0, 0.03), "steel", sid, "Gimbal launch lock (NEA class)", "gimbal HDRM", parent=root, verts=24)

    # Pointing: compute azimuth / elevation so the boresight (-X nominal) hits the target
    az = el = 0.0
    if stowed:
        el = math.radians(80.0)
    elif target is not None:
        d = (target - Vector((GIMBAL_X, 0, EL_Z))).normalized()
        az = -math.atan2(d.y, -d.x)         # rotation about +Z; -X boresight swings toward +Y for negative angles
        el = math.asin(max(-1, min(1, d.z)))  # positive toward +Z
    az_empty = empty("gimbal_az", (GIMBAL_X, 0, 0.08), parent=root)
    az_empty["subsystem"] = sid
    az_empty["label"] = "Gimbal azimuth axis"
    # Azimuth drum and yoke arms (children of az)
    cylinder(0.12, 0.06, (GIMBAL_X, 0, 0.11), "aluminium_dark", sid, "Gimbal azimuth drum", "azimuth drum", parent=az_empty)
    for y in (-0.31, 0.31):
        box((0.16, 0.05, EL_Z - 0.08), (GIMBAL_X, y, 0.14 + (EL_Z - 0.08) / 2), "aluminium_dark", sid, "Gimbal yoke", f"yoke arm y{y:+.2f}", parent=az_empty, bevel=0.008)
        box((0.30, 0.05, 0.05), (GIMBAL_X, y, 0.165), "aluminium_dark", sid, "Gimbal yoke", f"yoke foot y{y:+.2f}", parent=az_empty)
    box((0.16, 0.62, 0.04), (GIMBAL_X, 0, 0.16), "aluminium_dark", sid, "Gimbal yoke", "yoke bridge", parent=az_empty)
    # Elevation drives on the yoke arms
    for y, part in ((-0.355, "elevation drive"), (0.355, "coude fold housing")):
        cylinder(0.06, 0.05, (GIMBAL_X, y, EL_Z), "steel", sid, "Gimbal elevation axis", part, parent=az_empty, axis="Y")
    # Elevation empty
    el_empty = empty("gimbal_el", (GIMBAL_X, 0, EL_Z), parent=az_empty)
    el_empty["subsystem"] = sid
    el_empty["label"] = "Gimbal elevation axis"
    # Trunnions
    for y in (-0.26, 0.26):
        cylinder(0.045, 0.12, (GIMBAL_X, y, EL_Z), "steel", sid, "Gimbal elevation axis", f"trunnion y{y:+.2f}", parent=el_empty, axis="Y")
    # Telescope tube (outer CFRP, inner black baffle), centred on the elevation axis
    tube(TUBE_R, TUBE_R - 0.012, TUBE_L, (GIMBAL_X, 0, EL_Z), "cfrp", sid, "Telescope tube (CFRP)", "telescope tube", parent=el_empty, axis="X")
    # Rear closure plate and primary mirror cell
    cylinder(TUBE_R, 0.012, (GIMBAL_X + TUBE_L / 2 - 0.006, 0, EL_Z), "aluminium_dark", sid, "Primary mirror cell", "rear plate", parent=el_empty, axis="X")
    cylinder(0.215, 0.03, (GIMBAL_X + TUBE_L / 2 - 0.04, 0, EL_Z), "mirror_back_sic", sid, "0.45 m SiC primary mirror", "primary mirror substrate", parent=el_empty, axis="X")
    prim = cylinder(0.214, 0.004, (GIMBAL_X + TUBE_L / 2 - 0.057, 0, EL_Z), "mirror_sic", sid, "0.45 m SiC primary mirror", "primary mirror surface", parent=el_empty, axis="X")
    # Primary central hole (coude feed) represented by a dark disc
    cylinder(0.05, 0.006, (GIMBAL_X + TUBE_L / 2 - 0.06, 0, EL_Z), "glass_dark", sid, "0.45 m SiC primary mirror", "primary central aperture", parent=el_empty, axis="X")
    # Secondary mirror, spider
    sx = GIMBAL_X - TUBE_L / 2 + 0.06
    cylinder(0.05, 0.03, (sx, 0, EL_Z), "aluminium_dark", sid, "Secondary mirror", "secondary housing", parent=el_empty, axis="X")
    cylinder(0.046, 0.004, (sx + 0.017, 0, EL_Z), "mirror_sic", sid, "Secondary mirror", "secondary surface", parent=el_empty, axis="X")
    for ang in (45, 135, 225, 315):
        a = math.radians(ang)
        cy, cz = math.cos(a) * 0.13, math.sin(a) * 0.13
        box((0.02, 0.006, 0.22), (sx, cy, EL_Z + cz), "aluminium_dark", sid, "Secondary mirror", f"spider vane {ang}", parent=el_empty, rot=(a + math.pi / 2, 0, 0))
    # Front baffle / sunshade extension
    tube(TUBE_R + 0.006, TUBE_R - 0.004, 0.14, (GIMBAL_X - TUBE_L / 2 - 0.07, 0, EL_Z), "mli_black", sid, "Stray-light baffle", "front baffle", parent=el_empty, axis="X")
    # Contamination door: disc hinged at the top of the baffle; open 110 deg in deployed configuration
    door_hinge = empty("aperture_door_hinge", (GIMBAL_X - TUBE_L / 2 - 0.14, 0, EL_Z + TUBE_R + 0.01), parent=el_empty)
    cylinder(TUBE_R + 0.01, 0.012, (GIMBAL_X - TUBE_L / 2 - 0.146, 0, EL_Z), "aluminium", sid, "Aperture contamination door", "aperture door", parent=door_hinge, axis="X")
    cylinder(0.02, 0.5, (GIMBAL_X - TUBE_L / 2 - 0.14, 0, EL_Z + TUBE_R + 0.01), "steel", sid, "Aperture contamination door", "door hinge", parent=el_empty, axis="Y", verts=24)
    # Fine steering mirror / relay optics housing behind the primary (coude input)
    box((0.14, 0.16, 0.12), (GIMBAL_X + TUBE_L / 2 + 0.07, 0, EL_Z), "aluminium_dark", sid, "Fast steering mirror & relay optics", "FSM housing", parent=el_empty, bevel=0.006)
    # Narrow-field tracker camera and LWIR camera riding on the tube
    box((0.16, 0.10, 0.09), (GIMBAL_X - 0.02, 0.0, EL_Z + TUBE_R + 0.045), "aluminium_dark", sid, "Fine tracker (shares main aperture)", "tracker electronics", parent=el_empty, bevel=0.005)
    cylinder(0.035, 0.14, (GIMBAL_X - 0.10, -TUBE_R - 0.04, EL_Z), "aluminium_dark", "tracking", "LWIR thermal camera", "LWIR camera", parent=el_empty, axis="X", verts=32)
    cylinder(0.03, 0.006, (GIMBAL_X - 0.172, -TUBE_R - 0.04, EL_Z), "glass_dark", "tracking", "LWIR thermal camera", "LWIR lens", parent=el_empty, axis="X", verts=32)
    # Inertial reference unit (MIRU class) on the tube
    box((0.10, 0.08, 0.06), (GIMBAL_X + 0.1, TUBE_R + 0.045, EL_Z), "aluminium", sid, "Inertial reference unit", "IRU", parent=el_empty)
    # Apply the pointing now that every child is attached
    rotate_pivot(door_hinge, (0, 0 if stowed else math.radians(-110), 0))
    rotate_pivot(el_empty, (0, el, 0))
    rotate_pivot(az_empty, (0, 0, az))
    return az_empty, el_empty, prim


def build_laser() -> None:
    sid = "laser"
    # Optical bench (lower deck), CFRP sandwich with isolators
    box((0.86, 0.80, 0.03), (-0.02, 0, -0.40), "cfrp", sid, "Optical bench (isolated)", "optical bench")
    for x, y in ((-0.40, -0.35), (0.38, -0.35), (-0.40, 0.35), (0.38, 0.35)):
        cylinder(0.025, 0.03, (x, y, -0.415), "steel", sid, "Bench isolators", f"isolator {x:+.1f},{y:+.1f}", verts=24)
    # Pressurised amplifier + THG enclosure (ATLID heritage): rounded box with end domes
    box((0.52, 0.34, 0.20), (0.12, 0, -0.28), "aluminium", sid, "Pressurised laser enclosure (O2 partial pressure)", "amplifier enclosure", bevel=0.03)
    for x in (-0.15, 0.39):
        cylinder(0.08, 0.04, (x, 0, -0.28), "aluminium_dark", sid, "Pressurised laser enclosure (O2 partial pressure)", f"enclosure flange x{x:+.2f}", axis="X")
    # Diode pump stacks on the enclosure sides (cold plates)
    for y in (-0.2, 0.2):
        box((0.44, 0.05, 0.16), (0.12, y, -0.28), "copper", sid, "Diode pump stacks on cold plates", f"pump stack y{y:+.1f}")
        for i in range(6):
            box((0.05, 0.012, 0.14), (-0.06 + i * 0.072, y + (0.033 if y > 0 else -0.033), -0.28), "aluminium", sid, "Diode pump stacks on cold plates", f"fin {y:+.1f} {i}")
    # Oscillator / pre-amplifier
    box((0.26, 0.14, 0.10), (-0.30, -0.26, -0.33), "aluminium_dark", sid, "Master oscillator & pre-amplifier", "oscillator", bevel=0.006)
    # THG stage and beam transport to the coude riser
    box((0.16, 0.12, 0.10), (-0.26, 0.0, -0.33), "aluminium_dark", sid, "Third-harmonic generator (LBO) & beam cleanup", "THG module", bevel=0.006)
    cylinder(0.025, 0.20, (-0.04, 0, -0.33), "aluminium", sid, "Beam transport", "IR beam tube", axis="X", verts=24)
    # Supercapacitor bank (pulse-forming) : frame of cells
    box((0.30, 0.16, 0.16), (-0.30, 0.30, -0.31), "aluminium_dark", sid, "Supercapacitor pulse bank (20 kg)", "supercap frame", bevel=0.005)
    for i in range(4):
        for j in range(2):
            cylinder(0.028, 0.15, (-0.40 + i * 0.066, 0.26 + j * 0.08, -0.31), "steel", sid, "Supercapacitor pulse bank (20 kg)", f"cell {i}{j}", axis="X", verts=24)
    # Laser diode drivers and control unit
    box((0.22, 0.16, 0.12), (0.30, 0.32, -0.32), "aluminium", sid, "Diode drivers & laser controller", "driver unit", bevel=0.005)
    # Oxygen bleed bottle for the exposed UV optics (ALADIN heritage)
    cylinder(0.055, 0.26, (0.38, -0.34, -0.30), "titanium", sid, "Oxygen bleed bottle (ALADIN heritage)", "O2 bottle", axis="X", verts=40)
    sphere(0.055, (0.25, -0.34, -0.30), "titanium", sid, "Oxygen bleed bottle (ALADIN heritage)", "O2 bottle dome A")
    sphere(0.055, (0.51, -0.34, -0.30), "titanium", sid, "Oxygen bleed bottle (ALADIN heritage)", "O2 bottle dome B")


def build_tracking() -> None:
    sid = "tracking"
    # 15 cm acquisition telescope, body-fixed on the aft face, looking aft
    # Recessed through the aft face: 0.30 m tube mostly inside the lower deck, short baffle outside
    xa = -HX + 0.20  # tube centre
    tube(0.09, 0.08, 0.30, (xa, -0.30, -0.20), "cfrp", sid, "15 cm acquisition telescope (SBV / Sapphire class)", "acquisition telescope tube", axis="X")
    cylinder(0.078, 0.004, (xa + 0.12, -0.30, -0.20), "mirror_sic", sid, "15 cm acquisition telescope (SBV / Sapphire class)", "acquisition primary", axis="X")
    cylinder(0.09, 0.02, (xa + 0.16, -0.30, -0.20), "aluminium_dark", sid, "15 cm acquisition telescope (SBV / Sapphire class)", "acquisition rear housing", axis="X")
    box((0.12, 0.14, 0.12), (xa + 0.26, -0.30, -0.20), "aluminium_dark", sid, "Acquisition camera electronics", "acquisition electronics")
    tube(0.095, 0.088, 0.10, (-HX - 0.05, -0.30, -0.20), "mli_black", sid, "15 cm acquisition telescope (SBV / Sapphire class)", "acquisition baffle", axis="X")
    # Laser ranging receiver (photon counting) next to it, window flush with a short hood
    cylinder(0.04, 0.16, (-HX + 0.06, 0.30, -0.22), "aluminium_dark", sid, "Ranging receiver (photon counting, 343 nm)", "ranging receiver", axis="X", verts=32)
    cylinder(0.036, 0.004, (-HX - 0.022, 0.30, -0.22), "glass_dark", sid, "Ranging receiver (photon counting, 343 nm)", "ranging window", axis="X", verts=32)
    tube(0.044, 0.04, 0.06, (-HX - 0.03, 0.30, -0.22), "mli_black", sid, "Ranging receiver (photon counting, 343 nm)", "ranging hood", axis="X", verts=32)
    # Payload processor (GPU) box inside the aft lower deck (shown for exploded view)
    box((0.24, 0.20, 0.10), (-0.33, 0.05, -0.12), "aluminium", sid, "Payload processor (tracking & fire control)", "payload processor", bevel=0.005)


def build_solar_arrays(stowed: bool) -> None:
    sid = "solar_arrays"
    y_can = -HY - 0.085
    for sign, part in ((1, "zenith wing"), (-1, "nadir wing")):
        zc = sign * 0.33
        # roll-out canister on the sun face
        cylinder(0.075, WING_W + 0.06, (0, y_can, zc), "aluminium", sid, "Roll-out array canister", f"{part} canister", axis="X")
        for x in (-WING_W / 2 - 0.02, WING_W / 2 + 0.02):
            cylinder(0.04, 0.04, (x, y_can, zc), "aluminium_dark", sid, "Roll-out array canister", f"{part} end cap {x:+.1f}", axis="X", verts=32)
            # HDRM
            cylinder(0.022, 0.05, (x, y_can + 0.07, zc), "steel", sid, "Array launch lock (NEA class)", f"{part} HDRM {x:+.1f}", axis="Y", verts=20)
        # mounting brackets to the body
        for x in (-0.35, 0.35):
            box((0.06, 0.09, 0.05), (x, -HY - 0.045, zc), "aluminium_dark", sid, "Roll-out array canister", f"{part} bracket {x:+.1f}")
        if stowed:
            # blanket rolled on the mandrel inside the canister envelope
            cylinder(0.10, WING_W, (0, y_can - 0.01, zc), "solar_back", sid, "Roll-out blanket (stowed)", f"{part} roll", axis="X")
            continue
        # deployed blanket and booms
        z0 = zc + sign * 0.085
        zmid = z0 + sign * WING_L / 2
        for x in (-WING_W / 2 - 0.015, WING_W / 2 + 0.015):
            cylinder(0.016, WING_L, (x, y_can - 0.02, zmid), "cfrp", sid, "Composite strain-energy booms", f"{part} boom {x:+.1f}", axis="Z", verts=24)
        blanket = box((WING_W, 0.008, WING_L), (0, y_can - 0.02, zmid), "solar_cells", sid, "Roll-out blanket, 1.1 x 5.0 m", f"{part} blanket")
        # UV-map the blanket so the texture runs along its length
        uv = blanket.data.uv_layers.active or blanket.data.uv_layers.new()
        me = blanket.data
        for poly in me.polygons:
            for li in poly.loop_indices:
                v = me.vertices[me.loops[li].vertex_index].co
                uv.data[li].uv = ((v.x / WING_W) + 0.5, (v.z / WING_L) + 0.5)
        # tip spreader bar
        box((WING_W + 0.08, 0.03, 0.04), (0, y_can - 0.02, z0 + sign * WING_L), "aluminium", sid, "Tip spreader bar", f"{part} tip bar")


def build_radiators(stowed: bool) -> None:
    sid = "radiators"
    for sx, part in ((1, "ram-side radiator"), (-1, "aft-side radiator")):
        xh = sx * (HX + 0.02)
        # hinge line along Z at the anti-sun face edge
        cylinder(0.02, RAD_H + 0.02, (xh, HY + 0.02, 0), "steel", sid, "Radiator hinge & flex lines", f"{part} hinge", axis="Z", verts=24)
        for z in (-0.3, 0.3):
            box((0.05, 0.05, 0.04), (xh, HY + 0.01, z), "aluminium_dark", sid, "Radiator hinge & flex lines", f"{part} hinge bracket {z:+.1f}")
            cylinder(0.022, 0.05, (xh, HY + 0.06, z), "steel", sid, "Radiator launch lock (NEA class)", f"{part} HDRM {z:+.1f}", axis="Y", verts=20)
        if stowed:
            # each panel folds in two 1.0 m leaves and stacks against the anti-sun face
            yoff = HY + (0.035 if sx > 0 else 0.065)
            box((RAD_L / 2 - 0.04, 0.025, RAD_H), (0, yoff, 0), "osr", sid, "Deployable radiator panel 2.0 x 0.85 m (stowed)", f"{part} panel stowed")
            continue
        yc = HY + 0.04 + RAD_L / 2
        panel = box((0.025, RAD_L, RAD_H), (xh, yc, 0), "osr", sid, "Deployable radiator panel 2.0 x 0.85 m", f"{part} panel")
        uv = panel.data.uv_layers.active or panel.data.uv_layers.new()
        me = panel.data
        for poly in me.polygons:
            for li in poly.loop_indices:
                v = me.vertices[me.loops[li].vertex_index].co
                uv.data[li].uv = ((v.y / RAD_L) + 0.5, (v.z / RAD_H) + 0.5)
        # pumped-loop manifold along the hinge edge and serpentine tubes (visible ribs)
        box((0.035, 0.04, RAD_H - 0.05), (xh, HY + 0.06, 0), "aluminium", sid, "Pumped-loop manifold", f"{part} manifold")
        for i in range(7):
            z = -0.36 + i * 0.12
            box((0.032, RAD_L - 0.1, 0.012), (xh, yc, z), "aluminium", sid, "Pumped-loop tubes", f"{part} tube {i}")
        # edge frame
        box((0.03, 0.03, RAD_H), (xh, HY + 0.04 + RAD_L - 0.015, 0), "aluminium_dark", sid, "Radiator edge frame", f"{part} outer frame")
    # Pump package just inside the anti-sun face (shown in the exploded view)
    box((0.26, 0.10, 0.16), (0.30, HY - 0.08, -0.12), "aluminium", sid, "Mechanically pumped loop: pump package", "pump package", bevel=0.005)
    for x in (0.18, 0.42):
        cylinder(0.014, 0.2, (x, HY - 0.03, -0.12), "steel", sid, "Mechanically pumped loop: pump package", f"accumulator {x:+.1f}", axis="Z", verts=20)


def build_propulsion() -> None:
    sid = "propulsion"
    # Thrust-vector platform at the ram face centre (two-axis)
    cylinder(0.07, 0.04, (HX + 0.04, 0, -0.03), "aluminium_dark", sid, "Thrust-vector platform (2-axis)", "platform base", axis="X")
    cylinder(0.05, 0.03, (HX + 0.075, 0, -0.03), "steel", sid, "Thrust-vector platform (2-axis)", "platform gimbal", axis="X")
    box((0.03, 0.40, 0.20), (HX + 0.10, 0, -0.03), "aluminium_dark", sid, "Thrust-vector platform (2-axis)", "thruster plate", bevel=0.006)
    for y, part in ((-0.11, "Hall thruster A (prime)"), (0.11, "Hall thruster B (redundant)")):
        cylinder(0.065, 0.10, (HX + 0.165, y, -0.03), "aluminium_dark", sid, "600 W xenon Hall thruster", part, axis="X")
        tube(0.05, 0.03, 0.04, (HX + 0.215, y, -0.03), "ceramic", sid, "600 W xenon Hall thruster", f"{part} BN channel", axis="X")
        cylinder(0.029, 0.03, (HX + 0.205, y, -0.03), "copper", sid, "600 W xenon Hall thruster", f"{part} centre pole", axis="X", verts=32)
        cylinder(0.012, 0.09, (HX + 0.17, y, 0.05), "steel", sid, "600 W xenon Hall thruster", f"{part} cathode", axis="X", verts=20)
    # Xenon COPV inside the upper deck (shown in exploded view)
    sphere(0.17, (0.26, -0.16, 0.20), "titanium", sid, "Xenon tank, 25 L COPV (24 kg Xe)", "xenon tank")
    box((0.10, 0.10, 0.06), (0.26, -0.16, 0.39), "aluminium_dark", sid, "Xenon tank, 25 L COPV (24 kg Xe)", "tank boss")
    # Flow controller and two PPUs
    box((0.12, 0.10, 0.08), (0.42, -0.36, 0.14), "aluminium", sid, "Xenon flow controller & latch valves", "XFC", bevel=0.004)
    for y, part in ((-0.36, "PPU A"), (-0.24, "PPU B")):
        box((0.22, 0.10, 0.14), (0.30, y, 0.33), "aluminium", sid, "Power processing units (one per thruster)", part, bevel=0.004)


def build_adcs() -> None:
    sid = "adcs"
    # Reaction wheel pyramid inside the upper deck (+Y side)
    for i, ang in enumerate((45, 135, 225, 315)):
        a = math.radians(ang)
        loc = (0.12 + 0.09 * math.cos(a), 0.26 + 0.09 * math.sin(a), 0.18)
        cylinder(0.075, 0.05, loc, "aluminium_dark", sid, "Reaction wheels (4, pyramid, 4 N m s)", f"wheel {i + 1}", rot_extra=(math.radians(35) * math.cos(a), math.radians(35) * math.sin(a), 0))
    # Star trackers with baffles on the zenith / anti-sun edge
    for i, (loc, rot) in enumerate((
        ((0.05, HY - 0.05, HZ + 0.02), (math.radians(-45), 0, 0)),        # looks +Y +Z
        ((CRADLE_X + 0.08, 0.15, HZ + 0.02), (0, math.radians(-45), 0)),   # looks -X +Z
    )):
        cylinder(0.055, 0.17, (loc[0], loc[1], loc[2] + 0.085), "mli_black", sid, "Star tracker (2 heads)", f"star tracker {i + 1} baffle", rot_extra=rot, verts=32)
        box((0.09, 0.09, 0.05), loc, "aluminium_dark", sid, "Star tracker (2 heads)", f"star tracker {i + 1} head")
    # Fibre-optic gyro IMU
    box((0.12, 0.12, 0.09), (0.40, 0.30, 0.10), "aluminium", sid, "Fibre-optic gyro IMU", "IMU", bevel=0.004)
    # Magnetorquer rods
    for i, (loc, axis) in enumerate((((0.1, 0.42, 0.40), "X"), ((0.45, 0.1, 0.40), "Y"), ((0.44, 0.42, 0.20), "Z"))):
        cylinder(0.018, 0.34, loc, "aluminium_dark", sid, "Magnetorquer rods (3)", f"MTQ {axis}", axis=axis, verts=20)
    # Fine sun sensors on the sun face, coarse sensors elsewhere
    for x in (-0.3, 0.3):
        cylinder(0.03, 0.02, (x, -HY - 0.01, 0.0), "aluminium", sid, "Fine sun sensors", f"FSS {x:+.1f}", axis="Y", verts=24)
    # GNSS antennas on the zenith face
    for y in (-0.36, 0.36):
        cylinder(0.055, 0.03, (0.05, y, HZ + 0.015), "white_paint", sid, "Dual GNSS antennas", f"GNSS {y:+.1f}", verts=32)


def build_comms() -> None:
    sid = "comms"
    # Optical crosslink terminal on the zenith face (hemispherical gimbal)
    cylinder(0.09, 0.03, (0.30, 0.22, HZ + 0.015), "aluminium_dark", sid, "Optical crosslink terminal (SDA-compatible, 2.5 Gbps)", "OCT base")
    oct_az = empty("oct_az", (0.30, 0.22, HZ + 0.03), parent=subsystem_root(sid))
    oct_az["subsystem"] = sid
    cylinder(0.065, 0.05, (0.30, 0.22, HZ + 0.055), "aluminium", sid, "Optical crosslink terminal (SDA-compatible, 2.5 Gbps)", "OCT azimuth stage", parent=oct_az)
    for y in (-0.07, 0.07):
        box((0.03, 0.02, 0.09), (0.30, 0.22 + y, HZ + 0.105), "aluminium_dark", sid, "Optical crosslink terminal (SDA-compatible, 2.5 Gbps)", f"OCT fork {y:+.2f}", parent=oct_az)
    oct_el = empty("oct_el", (0.30, 0.22, HZ + 0.12), parent=oct_az)
    oct_el["subsystem"] = sid
    cylinder(0.05, 0.14, (0.30, 0.22, HZ + 0.12), "aluminium_dark", sid, "Optical crosslink terminal (SDA-compatible, 2.5 Gbps)", "OCT telescope", axis="X", parent=oct_el)
    cylinder(0.046, 0.004, (0.30 + 0.07, 0.22, HZ + 0.12), "glass_dark", sid, "Optical crosslink terminal (SDA-compatible, 2.5 Gbps)", "OCT aperture", axis="X", parent=oct_el)
    # deployed: look up-forward toward the next fleet member; stowed: parked flat along +X
    rotate_pivot(oct_el, (0, math.radians(-40) if not STOWED_FLAG[0] else 0, 0))
    rotate_pivot(oct_az, (0, 0, math.radians(25) if not STOWED_FLAG[0] else 0))
    # S-band patches (zenith and nadir), X-band patch array (nadir), L-band relay patch (zenith)
    box((0.10, 0.10, 0.02), (0.42, -0.30, HZ + 0.01), "white_paint", sid, "S-band TT&C patch (zenith)", "S-band zenith")
    box((0.10, 0.10, 0.02), (-0.15, -0.12, -HZ - 0.01), "white_paint", sid, "S-band TT&C patch (nadir)", "S-band nadir")
    box((0.20, 0.20, 0.03), (0.08, 0.10, -HZ - 0.015), "white_paint", sid, "X-band downlink patch array (140 Mbps)", "X-band array")
    box((0.12, 0.12, 0.025), (-0.12, 0.16, -HZ - 0.012), "white_paint", sid, "L-band GEO relay antenna (anytime command)", "L-band relay patch")
    # Radios inside the upper deck
    box((0.16, 0.12, 0.08), (0.42, 0.10, 0.28), "aluminium", sid, "S-band transponder & X-band transmitter", "radio stack", bevel=0.004)
    box((0.16, 0.12, 0.10), (0.42, 0.26, 0.28), "aluminium", sid, "Crosslink terminal electronics", "OCT electronics", bevel=0.004)


def build_avionics() -> None:
    sid = "avionics"
    # Battery, PCDU, flight computer, interlock on the lower deck beside the laser
    box((0.34, 0.16, 0.18), (0.12, 0.33, -0.31), "aluminium", sid, "Lithium-ion battery, 2.5 kWh", "battery", bevel=0.005)
    box((0.22, 0.12, 0.14), (0.02, -0.36, -0.33), "aluminium", sid, "Power conditioning & distribution unit", "PCDU", bevel=0.004)
    box((0.20, 0.12, 0.10), (-0.25, -0.36, -0.14), "aluminium_dark", sid, "Flight computer (redundant)", "OBC", bevel=0.004)
    box((0.16, 0.10, 0.08), (-0.40, -0.10, -0.14), "aluminium_dark", sid, "Laser safety interlock unit", "interlock", bevel=0.004)
    # Harness trunk along the deck
    box((0.80, 0.03, 0.03), (0.0, 0.41, -0.18), "kapton_amber", sid, "Harness trunk", "harness +Y")
    box((0.80, 0.03, 0.03), (0.0, -0.41, -0.18), "kapton_amber", sid, "Harness trunk", "harness -Y")


def build_overlay(target: Vector, el_empty) -> None:
    """Beam and debris target for visualisation only (tagged overlay=1)."""
    sid = "beam_director"
    aperture = Vector((GIMBAL_X - TUBE_L / 2 - 0.15, 0, EL_Z))
    # Beam: cone from aperture to target along the boresight, in the elevation frame
    length = (target - Vector((GIMBAL_X, 0, EL_Z))).length
    # focusing cone: 0.40 m at the aperture converging to the spot at the target
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.02, radius2=0.20, depth=length,
                                    location=(0, 0, 0), rotation=(0, math.pi / 2, 0))
    beam = bpy.context.active_object
    beam.data.materials.append(MATS["beam"])
    for poly in beam.data.polygons:
        poly.use_smooth = True
    tag(beam, sid, "343 nm beam (visualisation)", "beam")
    # place in the elevation frame: boresight is local -X from the pivot
    beam.parent = el_empty
    beam.matrix_parent_inverse = Matrix.Identity(4)
    beam.location = (aperture.x - GIMBAL_X - length / 2, 0, 0)
    beam["overlay"] = 1
    beam.visible_shadow = False
    # Debris target: a crumpled bracket (deformed icosphere)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.18, location=target)
    frag = bpy.context.active_object
    rnd = random.Random(11)
    for v in frag.data.vertices:
        v.co *= 1.0 + rnd.uniform(-0.35, 0.35)
        v.co.y *= 0.45
    frag.data.materials.append(MATS["debris"])
    tag(frag, "tracking", "Debris target (visualisation)", "debris target")
    frag["overlay"] = 1
    set_parent(frag, subsystem_root("tracking"))
    # Ablation plume at the target
    pl = sphere(0.06, target + Vector((0.12, 0, 0)), "plume", "tracking", "Ablation plume (visualisation)", "ablation plume")
    pl["overlay"] = 1


# ----------------------------------------------------------------------------
# Assembly, export
# ----------------------------------------------------------------------------
def build(stowed: bool = False, overlay: bool = True, target=(-9.0, 0.6, 0.9)):
    reset_scene()
    STOWED_FLAG[0] = stowed
    init_materials()
    tgt = Vector(target)
    build_bus(stowed)
    az_e, el_e, _ = build_beam_director(stowed, None if stowed else tgt)
    build_laser()
    build_tracking()
    build_solar_arrays(stowed)
    build_radiators(stowed)
    build_propulsion()
    build_adcs()
    build_comms()
    build_avionics()
    if overlay and not stowed:
        build_overlay(tgt, el_e)
    # Spacecraft root
    root = bpy.data.objects.new("Shepherd-1", None)
    bpy.context.scene.collection.objects.link(root)
    root["name"] = SPEC["name"]
    root["version"] = SPEC["version"]
    root["status"] = SPEC["status"]
    for e in ROOTS.values():
        set_parent(e, root)
    return root, az_e, el_e


def export_glb(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        export_extras=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_image_format="AUTO",
        export_texcoords=True,
        export_normals=True,
    )


def quick_preview(path: Path, res=(1280, 720), samples=48, cam_loc=(-4.6, -5.2, 2.6), look_at=(-0.3, 0, 0.1), lens=40) -> None:
    scn = bpy.context.scene
    scn.render.engine = "CYCLES"
    scn.cycles.samples = samples
    scn.cycles.use_denoising = True
    scn.render.resolution_x, scn.render.resolution_y = res
    scn.render.film_transparent = False
    world = bpy.data.worlds.new("World")
    scn.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.004, 0.005, 0.008, 1)
    bg.inputs["Strength"].default_value = 1.0
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 4.0
    sun.angle = math.radians(0.53)
    so = bpy.data.objects.new("Sun", sun)
    scn.collection.objects.link(so)
    so.rotation_euler = Vector((0.35, 1.0, -0.25)).normalized().to_track_quat("-Z", "Y").to_euler()
    fill = bpy.data.lights.new("EarthFill", "AREA")
    fill.energy = 1500
    fill.size = 20
    fill.color = (0.55, 0.7, 1.0)
    fo = bpy.data.objects.new("EarthFill", fill)
    scn.collection.objects.link(fo)
    fo.location = (0, 0, -14)
    fo.rotation_euler = Euler((0, 0, 0))
    cam = bpy.data.cameras.new("Cam")
    cam.lens = lens
    co = bpy.data.objects.new("Cam", cam)
    scn.collection.objects.link(co)
    co.location = cam_loc
    look = Vector(look_at) - co.location
    co.rotation_euler = look.to_track_quat("-Z", "Y").to_euler()
    scn.camera = co
    scn.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main(argv=None) -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stowed", action="store_true")
    parser.add_argument("--no-preview", action="store_true")
    parser.add_argument("--glb", default=None)
    args = parser.parse_args(argv)
    build(stowed=args.stowed, overlay=not args.stowed)
    glb = Path(args.glb) if args.glb else (GLB_PATH if not args.stowed else GLB_PATH.with_name("shepherd-1-stowed.glb"))
    export_glb(glb)
    print(f"wrote {glb} ({glb.stat().st_size / 1e6:.2f} MB)")
    if not args.no_preview:
        out = PUBLIC / "renders" / ("preview-stowed.png" if args.stowed else "preview.png")
        out.parent.mkdir(parents=True, exist_ok=True)
        quick_preview(out)
        print(f"wrote {out}")


if __name__ == "__main__":
    main(sys.argv[1:] if "--" not in sys.argv else sys.argv[sys.argv.index("--") + 1 :])
