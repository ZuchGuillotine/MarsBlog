"""Hero stills, exploded view, stowed view and a turntable for Shepherd-1.

Builds the model with ``build_shepherd_model.py`` inside an orbital environment
(Earth limb below, star field, Sun from the -Y side as in the dawn-dusk orbit,
Earthshine fill) and renders with Cycles on the CPU.

Usage (from the repository root):
  python3 scripts/shepherd/render_shepherd.py stills      # hero stills + exploded + stowed
  python3 scripts/shepherd/render_shepherd.py turntable   # frames + MP4 (ffmpeg)
  python3 scripts/shepherd/render_shepherd.py all
Options: --res 2560x1440 --samples 256 --frames 160 --quick
"""
from __future__ import annotations

import argparse
import math
import subprocess
import sys
import time
from pathlib import Path

import bpy
from mathutils import Euler, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_shepherd_model as B  # noqa: E402

OUT = B.PUBLIC / "renders"
FRAMES = Path("/tmp/shepherd-turntable")

TARGET = Vector((-9.0, 0.6, 0.9))


# ----------------------------------------------------------------------------
# Environment
# ----------------------------------------------------------------------------
def add_world() -> None:
    scn = bpy.context.scene
    world = bpy.data.worlds.new("Space")
    scn.world = world
    world.use_nodes = True
    nt = world.node_tree
    nodes, links = nt.nodes, nt.links
    bg = nodes["Background"]
    coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1, 1, 1)
    vor = nodes.new("ShaderNodeTexVoronoi")
    vor.voronoi_dimensions = "3D"
    vor.feature = "F1"
    vor.inputs["Scale"].default_value = 260.0
    vor.inputs["Randomness"].default_value = 1.0
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = 0.055
    ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    # vary star brightness with a noise
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 40.0
    mul = nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul2 = nodes.new("ShaderNodeMath")
    mul2.operation = "MULTIPLY"
    mul2.inputs[1].default_value = 1.6
    links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], vor.inputs["Vector"])
    links.new(vor.outputs["Distance"], ramp.inputs["Fac"])
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    links.new(ramp.outputs["Color"], mul.inputs[0])
    links.new(noise.outputs["Fac"], mul.inputs[1])
    links.new(mul.outputs["Value"], mul2.inputs[0])
    # add a very faint base so space is not pure black
    add = nodes.new("ShaderNodeMath")
    add.operation = "ADD"
    add.inputs[1].default_value = 0.0025
    links.new(mul2.outputs["Value"], add.inputs[0])
    links.new(add.outputs["Value"], bg.inputs["Strength"])
    bg.inputs["Color"].default_value = (0.85, 0.9, 1.0, 1)
    # stars should not light the scene noticeably
    if hasattr(world, "cycles_visibility"):
        pass


def add_earth(center=(0.0, 0.0, -84.0), radius=72.0) -> None:
    """A stylised Earth below the spacecraft (we are at 750 km; the limb fills
    the lower part of wide frames). Procedural ocean / land / cloud shading
    and a Fresnel atmosphere shell."""
    scn = bpy.context.scene
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=radius, location=center)
    earth = bpy.context.active_object
    earth.name = "Earth"
    for p in earth.data.polygons:
        p.use_smooth = True
    mat = bpy.data.materials.new("EarthSurface")
    mat.use_nodes = True
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    bsdf = n["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.6
    coord = n.new("ShaderNodeTexCoord")
    land = n.new("ShaderNodeTexNoise")
    land.inputs["Scale"].default_value = 1.7
    land.inputs["Detail"].default_value = 10.0
    land.inputs["Roughness"].default_value = 0.62
    land_ramp = n.new("ShaderNodeValToRGB")
    land_ramp.color_ramp.elements[0].position = 0.47
    land_ramp.color_ramp.elements[0].color = (0.012, 0.045, 0.14, 1)   # ocean
    land_ramp.color_ramp.elements[1].position = 0.56
    land_ramp.color_ramp.elements[1].color = (0.08, 0.10, 0.045, 1)    # land
    clouds = n.new("ShaderNodeTexNoise")
    clouds.inputs["Scale"].default_value = 3.8
    clouds.inputs["Detail"].default_value = 10.0
    clouds.inputs["Roughness"].default_value = 0.7
    clouds.inputs["Distortion"].default_value = 1.2
    cloud_ramp = n.new("ShaderNodeValToRGB")
    cloud_ramp.color_ramp.elements[0].position = 0.52
    cloud_ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    cloud_ramp.color_ramp.elements[1].position = 0.72
    cloud_ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    mix = n.new("ShaderNodeMixRGB")
    mix.blend_type = "MIX"
    mix.inputs["Color2"].default_value = (0.9, 0.92, 0.95, 1)
    l.new(coord.outputs["Object"], land.inputs["Vector"])
    l.new(coord.outputs["Object"], clouds.inputs["Vector"])
    l.new(land.outputs["Fac"], land_ramp.inputs["Fac"])
    l.new(clouds.outputs["Fac"], cloud_ramp.inputs["Fac"])
    l.new(land_ramp.outputs["Color"], mix.inputs["Color1"])
    l.new(cloud_ramp.outputs["Color"], mix.inputs["Fac"])
    l.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
    earth.data.materials.append(mat)
    # Atmosphere shell
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=radius * 1.018, location=center)
    atm = bpy.context.active_object
    atm.name = "Atmosphere"
    for p in atm.data.polygons:
        p.use_smooth = True
    am = bpy.data.materials.new("Atmosphere")
    am.use_nodes = True
    nt = am.node_tree
    n, l = nt.nodes, nt.links
    n.remove(n["Principled BSDF"])
    out = n["Material Output"]
    lw = n.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.25
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.55
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (0.25, 0.55, 1.0, 1)
    em = n.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = 2.2
    tr = n.new("ShaderNodeBsdfTransparent")
    mixs = n.new("ShaderNodeMixShader")
    l.new(lw.outputs["Facing"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], em.inputs["Color"])
    l.new(ramp.outputs["Color"], mixs.inputs["Fac"])
    l.new(tr.outputs["BSDF"], mixs.inputs[1])
    l.new(em.outputs["Emission"], mixs.inputs[2])
    l.new(mixs.outputs["Shader"], out.inputs["Surface"])
    for attr, val in (("blend_method", "BLEND"), ("surface_render_method", "BLENDED")):
        if hasattr(am, attr):
            try:
                setattr(am, attr, val)
            except Exception:
                pass
    atm.data.materials.append(am)
    atm.visible_shadow = False
    earth.visible_shadow = False


def override_beam_material() -> None:
    """Replace the Principled beam material (kept simple for glTF export) with an
    explicit transparent + emission mix that fades along the beam."""
    mat = bpy.data.materials.get("beam")
    if mat is None:
        return
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    for node in list(n):
        n.remove(node)
    out = n.new("ShaderNodeOutputMaterial")
    em = n.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (0.62, 0.38, 1.0, 1)
    em.inputs["Strength"].default_value = 0.9
    tr = n.new("ShaderNodeBsdfTransparent")
    mix = n.new("ShaderNodeMixShader")
    # fade: brighter near the aperture, fainter toward the target, plus a soft edge
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.010, 0.010, 0.010, 1)
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (0.040, 0.040, 0.040, 1)
    l.new(coord.outputs["Generated"], sep.inputs["Vector"])
    l.new(sep.outputs["Z"], ramp.inputs["Fac"])  # cone axis is local Z before rotation
    l.new(ramp.outputs["Color"], mix.inputs["Fac"])
    l.new(tr.outputs["BSDF"], mix.inputs[1])
    l.new(em.outputs["Emission"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])
    plume = bpy.data.materials.get("plume")
    if plume is not None:
        bsdf = plume.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None:
            bsdf.inputs["Emission Strength"].default_value = 25.0


def add_lights(sun_dir=(0.32, 1.0, -0.42), sun_energy=5.5) -> None:
    scn = bpy.context.scene
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = sun_energy
    sun.angle = math.radians(0.53)
    sun.color = (1.0, 0.97, 0.92)
    so = bpy.data.objects.new("Sun", sun)
    scn.collection.objects.link(so)
    so.rotation_euler = Vector(sun_dir).normalized().to_track_quat("-Z", "Y").to_euler()
    # Earthshine: broad bluish fill from below
    fill = bpy.data.lights.new("Earthshine", "AREA")
    fill.energy = 2600
    fill.size = 40
    fill.color = (0.45, 0.62, 1.0)
    fo = bpy.data.objects.new("Earthshine", fill)
    scn.collection.objects.link(fo)
    fo.location = (0, 0, -11)
    # very weak rim from the anti-sun side so shadowed geometry reads
    rim = bpy.data.lights.new("Rim", "AREA")
    rim.energy = 500
    rim.size = 12
    rim.color = (0.7, 0.8, 1.0)
    ro = bpy.data.objects.new("Rim", rim)
    scn.collection.objects.link(ro)
    ro.location = (-3, 9, 4)
    ro.rotation_euler = (Vector((-0.3, 0.6, 0.1)) - Vector(ro.location)).to_track_quat("-Z", "Y").to_euler()


def setup_render(res, samples) -> None:
    scn = bpy.context.scene
    scn.render.engine = "CYCLES"
    scn.cycles.samples = samples
    scn.cycles.use_denoising = True
    scn.cycles.denoiser = "OPENIMAGEDENOISE"
    scn.cycles.max_bounces = 6
    scn.cycles.transparent_max_bounces = 12
    scn.render.resolution_x, scn.render.resolution_y = res
    scn.render.resolution_percentage = 100
    scn.render.image_settings.file_format = "PNG"
    scn.render.image_settings.color_depth = "8"
    scn.render.film_transparent = False
    try:
        scn.view_settings.view_transform = "AgX"
        scn.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    scn.view_settings.exposure = 0.15
    scn.render.use_persistent_data = True


def camera(loc, look_at, lens=40, name="Cam"):
    scn = bpy.context.scene
    cam = bpy.data.cameras.new(name)
    cam.lens = lens
    cam.clip_end = 2000
    cam.sensor_width = 36
    co = bpy.data.objects.new(name, cam)
    scn.collection.objects.link(co)
    co.location = loc
    co.rotation_euler = (Vector(look_at) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    scn.camera = co
    return co


def render(path: Path) -> float:
    t0 = time.time()
    bpy.context.scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    return time.time() - t0


def explode(factor: float) -> None:
    for e in B.ROOTS.values():
        vec = Vector(tuple(e["explode"]))
        e.location = vec * factor


# ----------------------------------------------------------------------------
# Shots
# ----------------------------------------------------------------------------
HERO_SHOTS = {
    # name: (camera location, look-at, lens)
    "hero-aft-quarter": ((-3.3, -3.9, 1.15), (-0.45, 0.1, 0.25), 40),
    "hero-aft-high": ((-3.6, -3.1, 2.1), (-0.45, 0.05, 0.22), 38),
    "hero-beam-and-target": ((-8.6, -2.2, 1.9), (-2.0, 0.25, 0.45), 48),
    "hero-ram-quarter": ((3.4, -2.6, 1.4), (0.25, 0.05, 0.05), 40),
    "hero-anti-sun": ((-2.6, 4.2, 1.9), (-0.2, 0.9, 0.05), 40),
    "hero-wide": ((-9.5, -12.5, 4.5), (-0.2, 0.0, -0.3), 50),
    "hero-telescope-close": ((-1.9, -1.1, 0.95), (-0.5, 0.0, 0.28), 55),
}


def render_stills(res, samples, quick: bool) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    B.build(stowed=False, overlay=True, target=tuple(TARGET))
    add_world()
    add_earth()
    add_lights()
    override_beam_material()
    setup_render(res, samples)
    log = []
    for name, (loc, look, lens) in HERO_SHOTS.items():
        camera(loc, look, lens, name)
        dt = render(OUT / f"{name}.png")
        log.append((name, dt))
        print(f"[stills] {name}: {dt:.0f} s", flush=True)
        if quick:
            break
    # Exploded view: hide overlay, spread subsystems
    for o in bpy.data.objects:
        if o.get("overlay"):
            o.hide_render = True
    explode(1.0)
    camera((-5.2, -5.0, 3.4), (-0.1, 0.1, -0.05), 42, "exploded")
    dt = render(OUT / "exploded.png")
    print(f"[stills] exploded: {dt:.0f} s", flush=True)
    explode(0.0)
    # Stowed configuration
    B.build(stowed=True, overlay=False)
    add_world()
    add_earth()
    add_lights()
    setup_render(res, samples)
    camera((-2.4, -2.1, 1.3), (-0.1, 0.0, -0.05), 45, "stowed")
    dt = render(OUT / "stowed.png")
    print(f"[stills] stowed: {dt:.0f} s", flush=True)


def render_turntable(res, samples, frames: int, fps: int = 24) -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    B.build(stowed=False, overlay=True, target=tuple(TARGET))
    add_world()
    add_earth()
    add_lights()
    setup_render(res, samples)
    override_beam_material()
    look = Vector((-0.35, 0.15, 0.15))
    radius, height = 4.6, 1.55
    cam = camera((radius, 0, height), look, 40, "turntable")
    for i in range(frames):
        a = 2 * math.pi * i / frames + math.radians(215)
        loc = Vector((radius * math.cos(a), radius * math.sin(a), height + 0.35 * math.sin(a * 2)))
        cam.location = loc
        cam.rotation_euler = (look - loc).to_track_quat("-Z", "Y").to_euler()
        # subtle gimbal breathing so the mechanism reads as live
        az = bpy.data.objects.get("gimbal_az")
        if az is not None:
            az.rotation_euler.z += math.radians(0.0)
        dt = render(FRAMES / f"frame_{i:04d}.png")
        print(f"[turntable] frame {i + 1}/{frames}: {dt:.0f} s", flush=True)
    mp4 = OUT / "shepherd-1-turntable.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-framerate", str(fps), "-i", str(FRAMES / "frame_%04d.png"),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "slow",
        "-movflags", "+faststart", str(mp4),
    ], check=True)
    print(f"[turntable] wrote {mp4}", flush=True)


def main(argv=None) -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["stills", "turntable", "all"])
    ap.add_argument("--res", default="2560x1440")
    ap.add_argument("--samples", type=int, default=256)
    ap.add_argument("--frames", type=int, default=160)
    ap.add_argument("--tt-res", default="1920x1080")
    ap.add_argument("--tt-samples", type=int, default=48)
    ap.add_argument("--quick", action="store_true")
    a = ap.parse_args(argv)
    res = tuple(int(v) for v in a.res.split("x"))
    tres = tuple(int(v) for v in a.tt_res.split("x"))
    if a.mode in ("stills", "all"):
        render_stills(res, a.samples, a.quick)
    if a.mode in ("turntable", "all"):
        render_turntable(tres, a.tt_samples, a.frames)


if __name__ == "__main__":
    main(sys.argv[1:] if "--" not in sys.argv else sys.argv[sys.argv.index("--") + 1 :])
