"""Generate the 2D schematics for Shepherd-1 as SVG (standard library only).

  1. systems.svg     : subsystem block diagram with power, thermal, optical
                       and data paths and the budget tables
  2. engagement.svg  : engagement geometry (loiter below, fire head-on,
                       working range, keep-out rules)

Reads docs/shepherd-1/shepherd-1-spec.json and docs/shepherd-1/sizing.json.
Run from the repository root:

    python3 scripts/shepherd/build_schematics.py

Outputs to public/shepherd/.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC = json.loads((ROOT / "docs/shepherd-1/shepherd-1-spec.json").read_text())
SIZING = json.loads((ROOT / "docs/shepherd-1/sizing.json").read_text())
OUT = ROOT / "public/shepherd"

INK = "#e9eef5"
MUTED = "#8f9aa8"
BG = "#07090d"
PANEL = "#0f141b"
LINE = "#2a333f"
POWER = "#f5c04a"
HEAT = "#ff7a59"
OPTIC = "#8fd3ff"
DATA = "#7bf0c0"
UV = "#c7a0ff"
FONT = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
SERIF = "Georgia, 'Times New Roman', serif"


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


class SVG:
    def __init__(self, w: int, h: int):
        self.w, self.h = w, h
        self.parts: list[str] = []

    def add(self, s: str) -> None:
        self.parts.append(s)

    def rect(self, x, y, w, h, fill=PANEL, stroke=LINE, sw=1, rx=4, extra=""):
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')

    def text(self, x, y, s, size=12, fill=INK, anchor="start", weight=400, font=FONT, extra=""):
        self.add(f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {extra}>{esc(s)}</text>')

    def line(self, x1, y1, x2, y2, stroke=LINE, sw=1.2, dash=None, marker=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        m = f' marker-end="url(#{marker})"' if marker else ""
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{d}{m}/>')

    def path(self, d, stroke=LINE, sw=1.2, fill="none", dash=None, marker=None, opacity=1.0):
        dd = f' stroke-dasharray="{dash}"' if dash else ""
        m = f' marker-end="url(#{marker})"' if marker else ""
        self.add(f'<path d="{d}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}" opacity="{opacity}"{dd}{m}/>')

    def circle(self, cx, cy, r, fill="none", stroke=LINE, sw=1):
        self.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def render(self) -> str:
        defs = "".join(
            f'<marker id="arrow-{name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{col}"/></marker>'
            for name, col in (("power", POWER), ("heat", HEAT), ("optic", OPTIC), ("data", DATA), ("uv", UV), ("ink", INK), ("muted", MUTED))
        )
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}">'
            f"<defs>{defs}</defs>"
            f'<rect width="{self.w}" height="{self.h}" fill="{BG}"/>' + "".join(self.parts) + "</svg>"
        )


# ----------------------------------------------------------------------------
# 1. Systems block diagram
# ----------------------------------------------------------------------------
def block(svg: SVG, x, y, w, h, title, lines, accent):
    svg.rect(x, y, w, h, fill=PANEL, stroke=accent, sw=1.2, rx=6)
    svg.rect(x, y, 4, h, fill=accent, stroke="none", rx=2)
    svg.text(x + 14, y + 20, title, size=13, weight=700, fill=INK)
    for i, ln in enumerate(lines):
        svg.text(x + 14, y + 40 + i * 15, ln, size=10.5, fill=MUTED)


def systems_svg() -> str:
    W, H = 1760, 1040
    s = SVG(W, H)
    L = SPEC["laser"]
    P = SPEC["power"]
    T = SPEC["thermal"]
    PR = SPEC["propulsion"]
    # Title
    s.text(40, 48, "SHEPHERD-1", size=30, weight=400, font=SERIF, fill=INK)
    s.text(40, 72, "Laser-ablation debris-remediation pathfinder: systems schematic", size=13, fill=MUTED)
    s.text(W - 40, 48, SPEC["version"], size=11, fill=MUTED, anchor="end")
    s.text(W - 40, 66, "Proposed design. First-order budgets; no hardware exists.", size=11, fill=MUTED, anchor="end")
    # Legend
    lx = 40
    for i, (name, col) in enumerate((("electrical power", POWER), ("waste heat", HEAT), ("1030 nm infrared", OPTIC), ("343 nm ultraviolet", UV), ("data / control", DATA))):
        x = lx + i * 190
        s.line(x, 96, x + 28, 96, stroke=col, sw=3)
        s.text(x + 36, 100, name, size=10.5, fill=MUTED)

    # Column 1: power
    block(s, 40, 130, 330, 108, "Roll-out solar arrays", [
        "Two roll-out blanket wings (Redwire ROSA class)", "2 x 1.1 x 5.0 m, 11 m2, fixed sun-facing",
        f"{P['array_bol_w']} W BOL / {P['array_eol_w']} W EOL", "ROSA Diamond class, flown on DART"], POWER)
    block(s, 40, 262, 330, 108, "Power conditioning & storage", [
        "100 V regulated bus, PCDU", P["battery"], "Supercapacitor pulse bank: 20 kg, ~50 kJ",
        "~450 J per 1 ms pump pulse, ~0.4 MW peak"], POWER)
    block(s, 40, 394, 330, 124, "Propulsion", [
        "2 x 600 W Xe Hall thrusters (prime + redundant)", f"{PR['thrust_mn']} mN, Isp {PR['isp_s']} s, 2-axis thrust-vector platform",
        "24 kg Xe in 25 L COPV; 8.8 kg disposal reserve locked", f"Delta-v budget {PR['dv_budget_ms']['total']} m/s incl. 273 m/s disposal",
        "Plume cone +X; nothing sensitive ahead of exit plane"], POWER)
    block(s, 40, 542, 330, 124, "Attitude control", [
        "4 x 4 N m s reaction wheels (pyramid), isolated bench", "2 star trackers, FOG IMU, fine sun sensors",
        "3 x 30 A m2 magnetorquers (desaturation)", "Dual GNSS: 1 PPS to laser timing & crosslink",
        "Bus pointing 0.002 deg (35 urad) 1 sigma"], "#f5d76e")
    block(s, 40, 690, 330, 124, "Communications", [
        "SDA-compatible optical crosslink: 2.5 Gbps, 6,500 km", "S-band CCSDS TT&C, zenith + nadir patches",
        "X-band downlink 140 Mbps: imagery + firing log", "L-band GEO relay: anytime command / abort",
        "Firing log published per target"], "#ff6f91")
    block(s, 40, 838, 330, 92, "Avionics", [
        "Redundant flight computer", "Payload processor: track + fire control",
        "Independent laser safety interlock unit"], "#9aa5b1")

    # Column 2: laser chain
    block(s, 410, 130, 410, 150, "Laser: Yb:YAG oscillator + multi-slab amplifier", [
        "1030 nm, 45 J per pulse, 10 Hz, 1 ns", "Diode-pumped (976 nm QCW stacks on cold plates)",
        f"Electrical in: {L['electrical_input_w']} W while firing", "No pulse compressor (ns regime)",
        "Nearest lab analogue: HiLASE Bivoj / DiPOLE100", "Pressurised O2-bearing enclosure (ATLID heritage)",
        "Zeolite molecular-adsorber panels (ICESat-2 heritage)"], OPTIC)
    block(s, 410, 304, 410, 100, "Third-harmonic generator", [
        "LBO, 1030 -> 343 nm, ~50 % conversion", f"{L['pulse_energy_j']} J UV per pulse, {L['rep_rate_hz']} Hz, {L['uv_average_power_w']} W average",
        "Beam cleanup, energy monitor, shutter", "Bivoj THG: 50-55 J @ 10 Hz @ 343 nm demonstrated"], UV)
    block(s, 410, 428, 410, 110, "Coude path & fast steering mirror", [
        "Beam rises through hollow azimuth axis,", "folds through hollow elevation trunnion",
        "55 mm space-qualified FSM: +/-5 mrad, >800 Hz", "Closed on target return light (centroid)",
        "Holds 1.4 urad half-spot at 10 km"], UV)
    block(s, 410, 562, 410, 124, "Beam director", [
        "0.45 m SiC primary (Mersen Boostec class, ~5 kg)", "Cassegrain afocal expander, HfO2/SiO2 UV coatings",
        "2-axis yoke gimbal in aft cradle: az +/-100, el -25/+70 deg", "Inertial reference unit on tube (LCRD heritage)",
        "Contamination door, O2 bleed at exposed optics (ALADIN)"], OPTIC)
    block(s, 410, 710, 410, 124, "Tracking & ranging", [
        "15 cm acquisition telescope, 1.5 deg, V~15 (SBV class)", "Narrow-field tracker through main aperture (dichroic)",
        "LWIR camera on gimbal for eclipse tracking", "Ranging: 1-5 J pulses + photon-counting receiver",
        "Catalogue + angles-only navigation from 100s of km"], DATA)
    block(s, 410, 858, 410, 72, "Fire-control interlocks", [
        "Track confirmed; protected objects > 0.1 deg off axis beyond target;", "Laser Clearinghouse window open; limb > 100 km below line of sight"], DATA)

    # Column 3: thermal + target
    block(s, 860, 130, 380, 124, "Thermal control", [
        f"Rejects {T['rejected_w']} W at ~300 K", "Mechanically pumped loop from laser cold plates",
        "2 deployable radiators 2.0 x 0.85 m, two-sided: 6.8 m2", "Body OSR radiator on anti-sun face: 0.9 m2",
        f"Net {T['net_rejection_w_m2']} W/m2; louvers on electronics radiator"], HEAT)
    block(s, 860, 278, 380, 124, "Target & effect", [
        "Catalogued 1-50 kg fragments, 700-900 km", "Head-on from 5-12 km ahead; 2.8 cm spot at 10 km",
        f"Energy on target {SPEC['performance']['power_on_target_w']} W (0.7 pointing x 0.7 surface)",
        "Coupling 50 uN s/J assumed (25-100 bracket)", "10 kg fragment: 164 m/s in ~9 days at 45 % duty"], UV)
    block(s, 860, 426, 380, 150, "Orbit & operations", [
        "Dawn-dusk SSO, 750 km, 98.4 deg", "Loiters 50 km below the 800 km target band:",
        "  failed shepherd decays first;", "  J2 drift 7.9 deg/yr walks between target planes free",
        "Fire only on targets approaching from ahead", "  so recoil lowers perigee (never raises)",
        "Disposal: EP spiral to 300 km, 43 days; FCC 5-yr rule"], MUTED)

    # Mass budget table
    mb = SPEC["mass_budget_kg"]
    x0, y0 = 860, 600
    s.rect(x0, y0, 380, 330, fill=PANEL, stroke=LINE)
    s.text(x0 + 14, y0 + 22, "Mass budget (kg)", size=13, weight=700)
    yy = y0 + 44
    for k, v in mb.items():
        bold = k in ("dry total", "wet total")
        s.text(x0 + 14, yy, k, size=10.5, fill=INK if bold else MUTED, weight=700 if bold else 400)
        s.text(x0 + 366, yy, f"{v}", size=10.5, fill=INK if bold else MUTED, anchor="end", weight=700 if bold else 400)
        if k in ("dry subtotal", "dry total"):
            s.line(x0 + 14, yy + 5, x0 + 366, yy + 5, stroke=LINE)
        yy += 19

    # Power budget table and envelope
    x1, y1 = 1280, 130
    s.rect(x1, y1, 440, 210, fill=PANEL, stroke=LINE)
    s.text(x1 + 14, y1 + 22, "Power while firing (W)", size=13, weight=700)
    yy = y1 + 44
    for k, v in P["loads_w"].items():
        bold = k.startswith("total")
        s.text(x1 + 14, yy, k, size=10.5, fill=INK if bold else MUTED, weight=700 if bold else 400)
        s.text(x1 + 426, yy, f"{v}", size=10.5, fill=INK if bold else MUTED, anchor="end", weight=700 if bold else 400)
        yy += 19
    s.text(x1 + 14, yy + 6, f"Array EOL {P['array_eol_w']} W; thruster not run while firing", size=10, fill=MUTED)

    x2, y2 = 1280, 364
    s.rect(x2, y2, 440, 212, fill=PANEL, stroke=LINE)
    s.text(x2 + 14, y2 + 22, "Launch & envelope", size=13, weight=700)
    for i, ln in enumerate((
        "24-inch ESPA Grande port, Lightband-class separation",
        "Stowed 1.17 x 1.12 x 0.99 m (Moog Grande envelope)",
        "Port qualified to 700 kg; wet mass 486 kg",
        "SpaceX rideshare XL plate: 300 kg included, more purchasable",
        "Deployed: 11.3 m along nadir-zenith, 5.0 m across radiators",
        "Wings roll out along +/-Z; radiators hinge off anti-sun face",
        "NEA / Frangibolt HDRMs on wings, radiators, gimbal, door",
        "Dissimilar metals + MoS2 at every separable contact",
    )):
        s.text(x2 + 14, y2 + 44 + i * 19, ln, size=10.5, fill=MUTED)

    x3, y3 = 1280, 600
    s.rect(x3, y3, 440, 330, fill=PANEL, stroke=LINE)
    s.text(x3 + 14, y3 + 22, "Heritage gap (honest)", size=13, weight=700)
    for i, ln in enumerate((
        "Highest avg optical power flown: ~25 W (CATS, ISS)",
        "Highest UV flown: ~3.5 W (Aeolus ALADIN, 355 nm)",
        "Highest pulse energy flown: ~0.2 J (CALIPSO)",
        "Shepherd-1: 20 J, 200 W UV -> ~100x / ~60x beyond",
        "Ground: Bivoj THG 50-55 J @ 10 Hz @ 343 nm (ns)",
        "Laser is the critical-path development item.",
        "",
        "Everything else is flown-class hardware:",
        "ESPA-Grande bus core, ROSA arrays, 600 W Hall",
        "thrusters, SDA crosslink terminal, SBV-class",
        "telescope, LCRD-class gimbal, space FSMs,",
        "ATLID-style O2 enclosure, deployable LHP",
        "radiators, NEA release devices.",
        "",
        "Pathfinder exists to measure impulse per joule",
        "on real tumbling debris and UV optics ageing.",
    )):
        s.text(x3 + 14, y3 + 44 + i * 17.5, ln, size=10.5, fill=INK if i in (5, 14, 15) else MUTED)

    # Flow arrows
    # power: arrays -> PCDU -> laser, propulsion, adcs, comms, avionics
    s.line(190, 238, 190, 262, stroke=POWER, sw=2.5, marker="arrow-power")
    s.path("M370 316 C 390 316, 390 205, 410 205", stroke=POWER, sw=2.5, marker="arrow-power")
    s.line(190, 370, 190, 394, stroke=POWER, sw=2, marker="arrow-power")
    s.line(190, 518, 190, 542, stroke=POWER, sw=2, marker="arrow-power")
    s.line(190, 666, 190, 690, stroke=POWER, sw=2, marker="arrow-power")
    s.line(190, 814, 190, 838, stroke=POWER, sw=2, marker="arrow-power")
    # optical chain
    s.line(615, 280, 615, 304, stroke=OPTIC, sw=3, marker="arrow-optic")
    s.line(615, 404, 615, 428, stroke=UV, sw=3, marker="arrow-uv")
    s.line(615, 538, 615, 562, stroke=UV, sw=3, marker="arrow-uv")
    # beam to target
    s.path("M820 624 C 840 624, 840 340, 860 340", stroke=UV, sw=3, marker="arrow-uv")
    # heat
    s.path("M820 170 C 840 170, 840 192, 860 192", stroke=HEAT, sw=3, marker="arrow-heat")
    s.path("M820 480 C 845 480, 845 226, 860 226", stroke=HEAT, sw=1.6, dash="4 3", marker="arrow-heat")
    # data: tracking -> FSM, interlocks -> laser, comms <-> avionics
    s.path("M700 710 C 700 700, 835 700, 835 500 C 835 490, 830 490, 820 490", stroke=DATA, sw=1.6, marker="arrow-data")
    s.path("M410 894 C 392 894, 392 250, 410 250", stroke=DATA, sw=1.6, dash="4 3", marker="arrow-data")
    s.path("M370 752 C 390 752, 390 884, 410 884", stroke=DATA, sw=1.6, marker="arrow-data")
    s.path("M370 870 C 390 870, 390 770, 410 770", stroke=DATA, sw=1.6, marker="arrow-data")
    # footer
    s.text(40, H - 18, "Population Mars / OrbitFleet. Sources, vendor candidates and verification status: docs/shepherd-1/README.md", size=10, fill=MUTED)
    return s.render()


# ----------------------------------------------------------------------------
# 2. Engagement geometry
# ----------------------------------------------------------------------------
def engagement_svg() -> str:
    W, H = 1600, 900
    s = SVG(W, H)
    s.text(40, 48, "SHEPHERD-1 ENGAGEMENT GEOMETRY", size=26, font=SERIF)
    s.text(40, 72, "Co-orbital shepherd mode: fly ahead and below, fire head-on, lower the target's perigee", size=13, fill=MUTED)
    s.text(W - 40, 48, "Not to scale. Earth radius 6,378 km; orbits 750 / 800 km", size=11, fill=MUTED, anchor="end")

    # Earth arc and two orbits (left panel)
    cx, cy = 560, 1700
    R_e = 1150
    s.path(f"M {cx - 900} {cy - math.sqrt(R_e**2 - 900**2)} A {R_e} {R_e} 0 0 1 {cx + 900} {cy - math.sqrt(R_e**2 - 900**2)}", stroke="#2c5f8a", sw=2, fill="#0b1a28")
    s.text(cx, cy - R_e + 60, "EARTH", size=12, fill="#4a7ba6", anchor="middle")
    for r, col, label in ((R_e + 300, "#3c4b5c", "target band 800 km (derelict fragments)"), (R_e + 250, "#3c6b5c", "shepherd orbit 750 km (loiters 50 km below)")):
        half = 880
        y0 = cy - math.sqrt(r**2 - half**2)
        s.path(f"M {cx - half} {y0} A {r} {r} 0 0 1 {cx + half} {y0}", stroke=col, sw=1.4, dash="6 5")
    s.text(cx - 860, cy - (R_e + 300) + 18, "800 km", size=10, fill=MUTED)
    s.text(cx - 860, cy - (R_e + 250) + 18, "750 km", size=10, fill=MUTED)

    # Shepherd and target positions on their arcs (target behind, i.e. to the right because motion is to the left)
    def pos(r, ang_deg):
        a = math.radians(ang_deg)
        return cx + r * math.sin(a), cy - r * math.cos(a)

    tx, ty = pos(R_e + 300, 9.0)
    sx, sy = pos(R_e + 250, -3.0)
    # velocity arrows (motion to the left / -x)
    s.line(tx - 10, ty - 24, tx - 90, ty - 36, stroke=INK, sw=1.6, marker="arrow-ink")
    s.text(tx - 100, ty - 44, "v  7.45 km/s", size=10.5, fill=INK, anchor="end")
    s.line(sx - 10, sy - 24, sx - 90, sy - 36, stroke=INK, sw=1.6, marker="arrow-ink")
    # target fragment
    s.circle(tx, ty, 9, fill="#8d8f93", stroke="#c9ccd1", sw=1)
    s.text(tx, ty + 30, "target: 10 kg catalogued fragment", size=11, fill=INK, anchor="middle")
    # shepherd icon
    s.rect(sx - 10, sy - 7, 20, 14, fill="#1b2330", stroke="#c9a24a", sw=1.2, rx=2)
    s.line(sx - 10, sy - 26, sx - 10, sy + 26, stroke="#2f5fa8", sw=5)
    s.line(sx + 10, sy - 26, sx + 10, sy + 26, stroke="#2f5fa8", sw=5)
    s.text(sx - 24, sy + 44, "Shepherd-1", size=11, fill=INK, anchor="end")
    # beam
    s.line(sx + 12, sy - 2, tx - 10, ty - 1, stroke=UV, sw=3, marker="arrow-uv")
    s.text((sx + tx) / 2 - 20, (sy + ty) / 2 - 14, "343 nm beam, 5-12 km, head-on", size=11, fill=UV, anchor="middle")
    # recoil
    s.line(tx + 12, ty - 4, tx + 80, ty - 16, stroke=HEAT, sw=2, marker="arrow-heat")
    s.text(tx + 90, ty - 30, "recoil against velocity", size=10.5, fill=HEAT)
    s.text(tx + 90, ty - 16, "ablation jet leaves the target at km/s;", size=10, fill=MUTED)
    s.text(tx + 90, ty - 3, "a head-on push lowers perigee ~4x more", size=10, fill=MUTED)
    s.text(tx + 90, ty + 10, "per m/s than a radial push", size=10, fill=MUTED)
    # lowered orbit sketch
    s.path(f"M {tx} {ty} Q {tx - 420} {ty + 120} {cx - 560} {cy - math.sqrt((R_e + 140)**2 - 560**2)}", stroke=HEAT, sw=1.2, dash="3 4")
    s.text(cx - 540, cy - math.sqrt((R_e + 140)**2 - 560**2) + 16, "after 164 m/s: perigee 200 km, re-entry within weeks", size=10, fill=HEAT)
    # 50 km below annotation
    bx_ = sx - 200
    s.line(bx_, sy + 2, bx_, sy - 48, stroke=MUTED, sw=1, dash="2 3")
    s.line(bx_ - 6, sy + 2, bx_ + 6, sy + 2, stroke=MUTED, sw=1)
    s.line(bx_ - 6, sy - 48, bx_ + 6, sy - 48, stroke=MUTED, sw=1)
    s.text(bx_ - 12, sy - 30, "50 km lower:", size=10, fill=MUTED, anchor="end")
    s.text(bx_ - 12, sy - 17, "a failed shepherd decays first;", size=10, fill=MUTED, anchor="end")
    s.text(bx_ - 12, sy - 4, "J2 drifts planes 7.9 deg/yr for free", size=10, fill=MUTED, anchor="end")

    # Right panel: rules and the pulse plan
    x0, y0 = 1120, 110
    s.rect(x0, y0, 440, 300, fill=PANEL, stroke=LINE)
    s.text(x0 + 14, y0 + 24, "Firing rules (from the article and OrbitFleet)", size=13, weight=700)
    rules = [
        "1  Fire only on targets approaching from ahead:",
        "   beam within 60 deg of the target's anti-velocity.",
        "2  Never fire from behind: that raises the orbit.",
        "3  Protected satellites > 0.1 deg off the beam axis",
        "   beyond the target (OrbitFleet conjunction rule).",
        "4  Line of sight > 100 km above the Earth limb.",
        "5  Laser sunlit (no pack draw in eclipse).",
        "6  Laser Clearinghouse predictive-avoidance window.",
        "7  Fine tracker lock confirmed; interlock unit",
        "   independent of the flight computer.",
        "8  Every shot logged and published per target.",
        "9  Loiter below targets; disposal reserve locked.",
    ]
    for i, r in enumerate(rules):
        s.text(x0 + 14, y0 + 48 + i * 20, r, size=11, fill=INK if r[:1].isdigit() else MUTED)

    # Pulse plan table
    x1, y1 = 1120, 440
    s.rect(x1, y1, 440, 250, fill=PANEL, stroke=LINE)
    s.text(x1 + 14, y1 + 24, "Pulse plan vs range (20 J max, 10 Hz, 1 ns, 0.45 m aperture)", size=12, weight=700)
    cols = ("range km", "spot cm", "pulse J", "fluence / opt")
    xs = (x1 + 14, x1 + 130, x1 + 240, x1 + 340)
    for c, x in zip(cols, xs):
        s.text(x, y1 + 50, c, size=10.5, fill=MUTED)
    s.line(x1 + 14, y1 + 56, x1 + 426, y1 + 56, stroke=LINE)
    for i, p in enumerate(SIZING["pulse_plans"][:9]):
        y = y1 + 76 + i * 19
        s.text(xs[0], y, f"{p['range_km']:.0f}", size=11)
        s.text(xs[1], y, f"{p['spot_cm']:.1f}", size=11)
        s.text(xs[2], y, f"{p['pulse_j']:.1f}", size=11)
        frac = p["fluence_fraction"]
        s.text(xs[3], y, f"{frac:.2f}" + ("  working range" if frac >= 0.85 else "  below optimum"), size=11, fill=INK if frac >= 0.85 else MUTED)

    # Time-to-deorbit table
    x2, y2 = 1120, 720
    s.rect(x2, y2, 440, 150, fill=PANEL, stroke=LINE)
    s.text(x2 + 14, y2 + 24, "Firing time to 200 km perigee from 800 km (98 W on target)", size=12, weight=700)
    for i, t in enumerate(SIZING["targets"][:5]):
        y = y2 + 50 + i * 19
        s.text(x2 + 14, y, t["target"], size=11)
        s.text(x2 + 426, y, f"{t['firing_days_at_45pct_duty']:.1f} d  (25 uN s/J: {t['firing_days_at_25uNs_per_J']:.0f} d)", size=10.5, fill=MUTED, anchor="end")

    # Spot vs range diagram (bottom left)
    bx, by = 40, 700
    s.rect(bx, by, 1040, 170, fill=PANEL, stroke=LINE)
    s.text(bx + 14, by + 24, "Diffraction-limited spot (2.44 M2 lambda R / D) and optimum-fluence pulse energy", size=12, weight=700)
    ax0, ax1 = bx + 60, bx + 1000
    ay = by + 130
    s.line(ax0, ay, ax1, ay, stroke=LINE)
    for km in (0, 5, 10, 15, 20, 25, 30):
        x = ax0 + (ax1 - ax0) * km / 30
        s.line(x, ay, x, ay + 5, stroke=LINE)
        s.text(x, ay + 18, f"{km} km", size=10, fill=MUTED, anchor="middle")
    # beam envelope: cone from aperture (0.45 m) to spot
    for km, frac in ((5, 1.0), (10, 1.0), (12, 0.85), (20, 0.3), (30, 0.14)):
        x = ax0 + (ax1 - ax0) * km / 30
        spot = 2.44 * 1.5 * 343e-9 * km * 1000 / 0.45 * 100  # cm
        s.line(x, ay - 6, x, ay - 6 - spot * 2.2, stroke=UV if frac >= 0.85 else MUTED, sw=4)
        s.text(x, ay - 14 - spot * 2.2, f"{spot:.1f} cm", size=10, fill=UV if frac >= 0.85 else MUTED, anchor="middle")
    s.text(ax0, by + 50, "working range 5-12 km: 20 J reaches optimum fluence (26.9 kJ/m2 at 1 ns)", size=10.5, fill=UV)
    s.text(ax0, by + 66, "beyond 12 km the 20 J cap leaves fluence below optimum and coupling falls; production unit (700 J, 1 m) works 60-300 km", size=10.5, fill=MUTED)
    return s.render()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "shepherd-1-systems.svg").write_text(systems_svg())
    (OUT / "shepherd-1-engagement.svg").write_text(engagement_svg())
    print("wrote", OUT / "shepherd-1-systems.svg", OUT / "shepherd-1-engagement.svg")


if __name__ == "__main__":
    main()
