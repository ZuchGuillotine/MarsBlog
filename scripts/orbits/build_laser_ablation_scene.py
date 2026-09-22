"""Build the laser-ablation campaign scene: three proposed ablation satellites
working a fictional debris field.

Deterministic, dependency-free (standard library only). Run from the repository
root with ``python3 scripts/orbits/build_laser_ablation_scene.py``.

The debris field reproduces the seven fictional bodies of OrbitFleet's debris
outgassing replay (same initial osculating orbits, masses and colours, same
J2 gravity and RK4 integration) and adds three small fragments so that the
sweeper's single-pass behaviour can be shown. Three laser-ablation satellites
follow the design in "The Case for Attack Satellites": a 3.3 kW, 343 nm pulsed
ultraviolet laser behind a 1 m beam director, engaging only approaching targets
from ahead so that recoil lowers perigee, with two shepherds flying in-plane
ahead of tonne-class derelicts and one near-polar sweeper.

Everything here is a configured engineering scenario at a fictional epoch. It
is not tracking data, not a validated ablation model and not a flight design.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public/data/orbits/laser-ablation-scene.json"
MANIFEST = OUTPUT.with_name("laser-ablation-manifest.json")

# ----------------------------------------------------------------------------
# Constants (identical gravity model to OrbitFleet outgassing.py)
# ----------------------------------------------------------------------------
MU = 398_600.4418  # km^3/s^2
RADIUS = 6_378.137  # km
J2 = 1.08262668e-3
G0 = 9.80665  # m/s^2
DURATION = 21_600  # s, six hours
CADENCE = 30  # s between exported samples
STEP = 1.0  # s, RK4 step (control decisions are frozen across a step)
REENTRY_PERIGEE_KM = 200.0  # article: re-entry follows within weeks below this
Vector = list[float]


# ----------------------------------------------------------------------------
# Laser and spacecraft design (article sections 6-8)
# ----------------------------------------------------------------------------
LASER_DESIGN = {
    "wavelengthM": 343e-9,  # frequency-tripled ytterbium
    "pulseDurationS": 100e-12,
    "apertureM": 1.0,  # silicon-carbide beam director
    "beamQualityM2": 1.5,
    "averagePowerW": 3_300.0,  # ultraviolet output (20 kW electrical in)
    "maxPulseEnergyJ": 700.0,
    "minRepRateHz": 1.0,
    "maxRepRateHz": 30.0,
    # Phipps optimum fluence ~ 8.5e8 * sqrt(tau) J/m^2 -> 8.5 kJ/m^2 at 100 ps.
    "optimumFluenceJM2": 8_500.0,
    "ablationThresholdFraction": 0.25,  # of optimum fluence; no ablation below
    "couplingNsPerJ": 50e-6,  # middle case; article shows 25 and 100 too
    "couplingSensitivity": [25e-6, 50e-6, 100e-6],
    "pointingEfficiency": 0.7,  # jitter and beam-profile wings
    "minRangeKm": 60.0,
    "maxRangeKm": 300.0,
    "minHeadOnCosine": 0.5,  # fire only within 60 deg of the anti-velocity
    "limbClearanceKm": 100.0,
    "busMassKg": 2_300.0,
    "thrustN": 0.170,  # argon Hall thruster
    "specificImpulseS": 2_500.0,
    "propellantKg": 150.0,
    "arrayPowerW": 28_000.0,
}
SPOT_FACTOR = (
    2.44 * LASER_DESIGN["beamQualityM2"] * LASER_DESIGN["wavelengthM"] / LASER_DESIGN["apertureM"]
)  # spot diameter per metre of range


def spot_area_m2(range_km: float) -> float:
    diameter = SPOT_FACTOR * range_km * 1_000.0
    return math.pi * (diameter / 2) ** 2


def pulse_plan(range_km: float) -> tuple[float, float, float]:
    """Pulse energy (J), repetition rate (Hz) and fluence (J/m^2) at a range."""
    area = spot_area_m2(range_km)
    energy = min(LASER_DESIGN["maxPulseEnergyJ"], LASER_DESIGN["optimumFluenceJM2"] * area)
    rate = min(LASER_DESIGN["maxRepRateHz"], LASER_DESIGN["averagePowerW"] / energy)
    if rate < LASER_DESIGN["minRepRateHz"]:
        return 0.0, 0.0, 0.0
    return energy, rate, energy / area


def coupling_ns_per_j(fluence_j_m2: float) -> float:
    """Momentum coupling versus fluence: zero below threshold, linear ramp to
    the optimum value at optimum fluence. The controller never exceeds optimum."""
    ratio = fluence_j_m2 / LASER_DESIGN["optimumFluenceJM2"]
    threshold = LASER_DESIGN["ablationThresholdFraction"]
    if ratio <= threshold:
        return 0.0
    return LASER_DESIGN["couplingNsPerJ"] * min(1.0, (ratio - threshold) / (1 - threshold))


# ----------------------------------------------------------------------------
# Vector helpers
# ----------------------------------------------------------------------------
def norm(v: list[float]) -> float:
    return math.sqrt(sum(x * x for x in v))


def unit(v: list[float]) -> Vector:
    n = norm(v)
    if n <= 0 or not math.isfinite(n):
        raise ValueError("zero vector")
    return [x / n for x in v]


def dot(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=True))


def cross(a: list[float], b: list[float]) -> Vector:
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]


def add(a: list[float], b: list[float], k: float = 1.0) -> Vector:
    return [x + k * y for x, y in zip(a, b, strict=True)]


def scale(a: list[float], k: float) -> Vector:
    return [x * k for x in a]


def rotate(v: list[float], axis: list[float], angle: float) -> Vector:
    d = unit(axis)
    c, s = math.cos(angle), math.sin(angle)
    axv = cross(d, v)
    proj = dot(d, v) * (1 - c)
    return [v[i] * c + axv[i] * s + d[i] * proj for i in range(3)]


# ----------------------------------------------------------------------------
# Dynamics
# ----------------------------------------------------------------------------
def gravity(r: list[float]) -> Vector:
    radius = norm(r)
    z2 = (r[2] / radius) ** 2
    factor = 1.5 * J2 * MU * RADIUS**2 / radius**5
    return [
        -MU * x / radius**3 + factor * x * (5 * z2 - (3 if i == 2 else 1))
        for i, x in enumerate(r)
    ]


def potential(r: list[float]) -> float:
    radius = norm(r)
    return -MU / radius * (1 - J2 * (RADIUS / radius) ** 2 * (3 * (r[2] / radius) ** 2 - 1) / 2)


def rk4(state: list[float], h: float, extra: list[float] | None = None) -> Vector:
    """One RK4 step of the J2 two-body problem plus a constant extra acceleration
    (km/s^2) held fixed across the step."""
    extra = extra or [0.0, 0.0, 0.0]

    def derivative(y: list[float]) -> Vector:
        a = gravity(y[:3])
        return y[3:] + [a[i] + extra[i] for i in range(3)]

    k1 = derivative(state)
    k2 = derivative([x + h * k / 2 for x, k in zip(state, k1, strict=True)])
    k3 = derivative([x + h * k / 2 for x, k in zip(state, k2, strict=True)])
    k4 = derivative([x + h * k for x, k in zip(state, k3, strict=True)])
    return [state[i] + h * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6 for i in range(6)]


def propagate(state: list[float], duration: float, step: float = STEP) -> Vector:
    """Propagate by ``duration`` seconds (negative allowed) under gravity only."""
    count = max(1, math.ceil(abs(duration) / step))
    h = duration / count
    for _ in range(count):
        state = rk4(state, h)
    return state


def elements(state: list[float]) -> dict[str, float]:
    r, v = state[:3], state[3:]
    radius = norm(r)
    speed = norm(v)
    h = cross(r, v)
    e_vec = [c / MU - r[i] / radius for i, c in enumerate(cross(v, h))]
    e = norm(e_vec)
    energy = speed**2 / 2 - MU / radius
    a = -MU / (2 * energy)
    inclination = math.degrees(math.acos(h[2] / norm(h)))
    return {
        "a": a,
        "e": e,
        "perigee": a * (1 - e) - RADIUS,
        "apogee": a * (1 + e) - RADIUS,
        "altitude": radius - RADIUS,
        "speed": speed,
        "inclination": inclination,
        "energy": energy,
    }


def initial(perigee: float, apogee: float, inclination: float, node: float) -> Vector:
    """Same construction as OrbitFleet: body at perigee, node measured from +X."""
    rp, ra = RADIUS + perigee, RADIUS + apogee
    speed = math.sqrt(MU * (2 / rp - 2 / (rp + ra)))
    r = rotate([rp, 0.0, 0.0], [0.0, 0.0, 1.0], math.radians(node))
    v = rotate([0.0, speed, 0.0], [1.0, 0.0, 0.0], math.radians(inclination))
    v = rotate(v, [0.0, 0.0, 1.0], math.radians(node))
    return [*r, *v]


def sunlit(r: list[float], sun: list[float]) -> bool:
    along = dot(r, sun)
    if along >= 0:
        return True
    lateral = norm(add(r, sun, -along))
    return lateral > RADIUS


def limb_clearance_km(a: list[float], b: list[float]) -> float:
    """Minimum altitude of the segment a-b above the reference sphere."""
    ab = add(b, a, -1.0)
    length2 = dot(ab, ab)
    t = 0.0 if length2 == 0 else max(0.0, min(1.0, -dot(a, ab) / length2))
    return norm(add(a, ab, t)) - RADIUS


def apogee_burn_dv_ms(a: float, e: float, target_perigee_km: float) -> float:
    """Retrograde impulse at apogee that lowers perigee to the target altitude."""
    ra = a * (1 + e)
    rp_target = RADIUS + target_perigee_km
    if a * (1 - e) <= rp_target:
        return 0.0
    v_now = math.sqrt(MU * (2 / ra - 1 / a))
    v_new = math.sqrt(MU * (2 / ra - 2 / (ra + rp_target)))
    return (v_now - v_new) * 1_000.0


# ----------------------------------------------------------------------------
# Atmospheric decay tail (indicative only; the six-hour model has no drag)
# ----------------------------------------------------------------------------
def bessel_i(order: int, z: float) -> float:
    if z > 25:
        # Asymptotic form with the first correction term
        mu4 = 4 * order * order
        return math.exp(z) / math.sqrt(2 * math.pi * z) * (1 - (mu4 - 1) / (8 * z))
    total, term = 0.0, (z / 2) ** order / math.factorial(order)
    k = 0
    while True:
        total += term
        k += 1
        term *= (z / 2) ** 2 / (k * (k + order))
        if term < 1e-15 * max(total, 1e-300):
            return total


def decay_tail_days(a_km: float, e: float, area_m2: float, mass_kg: float) -> float:
    """King-Hele orbit-averaged decay from the given osculating orbit until the
    perigee falls below 120 km. Static exponential atmosphere pinned to
    2.5e-10 kg/m^3 at 200 km with a 37 km scale height; Cd = 2.2."""
    cd, rho_200, scale_height = 2.2, 2.5e-10, 37.0
    delta = cd * area_m2 / mass_kg  # m^2/kg
    mu_m = MU * 1e9
    a, days, dt = a_km * 1_000.0, 0.0, 0.05
    while days < 3_650:
        perigee_km = a * (1 - e) / 1_000.0 - RADIUS
        if perigee_km < 120:
            return days
        rho = rho_200 * math.exp(-(perigee_km - 200.0) / scale_height)
        z = a * e / (scale_height * 1_000.0)
        if z > 700:
            z = 700.0
        ez = math.exp(-z)
        i0, i1, i2 = bessel_i(0, z) * ez, bessel_i(1, z) * ez, bessel_i(2, z) * ez
        da = -delta * rho * math.sqrt(mu_m * a) * (i0 + 2 * e * i1)
        de = -delta * rho * math.sqrt(mu_m / a) * (i1 + e / 2 * (i0 + i2)) if e > 1e-6 else 0.0
        seconds = dt * 86_400.0
        a += da * seconds
        e = max(0.0, e + de * seconds)
        days += dt
    return days


# ----------------------------------------------------------------------------
# Scene authoring
# ----------------------------------------------------------------------------
class Body:
    def __init__(self, **fields: Any) -> None:
        self.__dict__.update(fields)
        self.state: Vector = list(self.initial_state)
        self.extra: Vector = [0.0, 0.0, 0.0]
        self.samples: list[dict[str, Any]] = []
        # debris bookkeeping
        self.dv_ms = 0.0
        self.dv_retro_ms = 0.0
        self.energy_j = 0.0
        self.engaged_by: str | None = None
        # laser bookkeeping
        self.status = "SEARCH"
        self.target: str | None = None
        self.range_km = 0.0
        self.pulse_j = 0.0
        self.rep_hz = 0.0
        self.power_on_target_w = 0.0
        self.emitted_j = 0.0
        self.on_target_j = 0.0
        self.firing_s = 0.0
        self.thrust_sign = 0
        self.propellant_kg = 0.0
        self.dv_self_ms = 0.0
        self.mass_kg = getattr(self, "mass_kg", 0.0)
        self.hold_reason = ""


DEBRIS_FIELD = [
    # OrbitFleet's seven fictional bodies (identical initial orbits and masses)
    ("fragment-1", "Fragment A", 600, 640, 53, 0, "#60d7e5", 100, "fragment", 0.8, 0.7),
    ("fragment-2", "Fragment B", 800, 900, 72, 110, "#e9b46d", 150, "fragment", 1.0, 0.7),
    ("fragment-3", "Fragment C", 1000, 1080, 98, 225, "#ae9cff", 75, "fragment", 0.6, 0.7),
    ("fragment-4", "Fragment D", 550, 760, 28, 65, "#78dea7", 40, "fragment", 0.4, 0.7),
    ("fragment-5", "Fragment E", 700, 1200, 45, 155, "#f18caa", 250, "fragment", 1.4, 0.7),
    ("fragment-6", "Derelict spacecraft", 900, 1500, 82, 290, "#c4d978", 600, "spacecraft", 6.0, 0.6),
    ("fragment-7", "Spent rocket stage", 650, 1800, 64.8, 330, "#ff9c65", 2000, "rocket_stage", 12.0, 0.8),
]
# Added centimetre-class fragments for the sweeper (mass kg, projected area m^2)
SMALL_FRAGMENTS = {
    "fragment-8": ("Fragment F (insulation flake)", "#9ff0c8", 0.010, 0.010, 0.7),
    "fragment-9": ("Fragment G (bracket)", "#f5d47a", 1.2, 0.03, 0.7),
    "fragment-10": ("Fragment H (fastener)", "#ffb3a7", 0.005, 0.001, 0.7),
}
SWEEPER_ENCOUNTERS = [
    # (fragment id, time s, inclination deg, miss km, speed factor, shallow crossing from behind?)
    ("fragment-8", 4_800.0, 53.0, 45.0, 1.0035, False),
    ("fragment-9", 8_400.0, 72.0, 40.0, 0.998, False),
    ("fragment-10", 12_600.0, None, 150.0, 1.0, True),
]


def heading_velocity(position: list[float], inclination_deg: float, descending: bool, speed: float) -> Vector:
    """Velocity of a prograde orbit through ``position`` with the given
    inclination, chosen ascending or descending."""
    r_hat = unit(position)
    lat = math.asin(r_hat[2])
    east = unit(cross([0.0, 0.0, 1.0], r_hat))
    north = cross(r_hat, east)
    ratio = math.cos(math.radians(inclination_deg)) / math.cos(lat)
    ratio = max(-1.0, min(1.0, ratio))
    azimuth = math.asin(ratio)
    if descending:
        azimuth = math.pi - azimuth
    return add(scale(east, speed * math.sin(azimuth)), scale(north, speed * math.cos(azimuth)))


def design_sweeper(target_track: list[Vector], encounter_s: float) -> Vector:
    """Place the sweeper so that Fragment A approaches it head-on at the given
    time, then back-propagate to t = 0."""
    idx = int(encounter_s / STEP)
    r_a, v_a = target_track[idx][:3], target_track[idx][3:]
    r_hat = unit(r_a)
    normal_a = unit(cross(r_a, v_a))
    # Sweeper sits 45 km cross-track from the fragment's plane at the encounter
    # and 30 km above it, on a 98 deg orbit heading so that velocities oppose.
    position = add(add(r_a, normal_a, 45.0), r_hat, 30.0)
    best: Vector | None = None
    for descending in (False, True):
        candidate = heading_velocity(position, 98.0, descending, 1.0)
        if best is None or dot(candidate, unit(v_a)) < dot(best, unit(v_a)):
            best = candidate
    assert best is not None
    speed = math.sqrt(MU / norm(position)) * 1.004  # slightly above circular
    state = [*position, *scale(best, speed)]
    return propagate(state, -encounter_s)


def opposing_heading(position: list[float], inclination: float, against: list[float]) -> bool:
    """Choose ascending or descending so the fragment's velocity opposes ``against``."""
    ascending = heading_velocity(position, inclination, False, 1.0)
    descending = heading_velocity(position, inclination, True, 1.0)
    return dot(descending, against) < dot(ascending, against)


def design_fragment(
    sweeper_track: list[Vector],
    encounter_s: float,
    inclination: float | None,
    miss_km: float,
    speed_factor: float,
    shallow_from_behind: bool,
) -> Vector:
    idx = int(encounter_s / STEP)
    r_s, v_s = sweeper_track[idx][:3], sweeper_track[idx][3:]
    if shallow_from_behind:
        # Fragment above the sweeper on a slower orbit whose heading differs by
        # only 25 degrees: the sweeper overtakes it from behind and below, so
        # the beam could not oppose its velocity. The controller must refuse.
        position = add(r_s, unit(r_s), miss_km)
        up = unit(position)
        east = unit(cross([0.0, 0.0, 1.0], up))
        north = cross(up, east)
        horizontal = unit(add(scale(east, dot(v_s, east)), scale(north, dot(v_s, north))))
        horizontal = rotate(horizontal, up, math.radians(25.0))
        velocity = scale(horizontal, math.sqrt(MU / norm(position)) * speed_factor)
        state = [*position, *velocity]
        return propagate(state, -encounter_s)
    assert inclination is not None
    # Fragment velocity: prograde orbit at the requested inclination through a
    # point offset from the sweeper along that orbit's normal by the miss
    # distance, ascending or descending so that the velocities oppose.
    descending = opposing_heading(r_s, inclination, v_s)
    velocity_dir = heading_velocity(r_s, inclination, descending, 1.0)
    normal = unit(cross(r_s, velocity_dir))
    position = add(r_s, normal, miss_km)
    velocity = scale(
        heading_velocity(position, inclination, descending, 1.0),
        math.sqrt(MU / norm(position)) * speed_factor,
    )
    state = [*position, *velocity]
    return propagate(state, -encounter_s)


def build() -> dict[str, Any]:
    debris: list[Body] = []
    for id_, name, perigee, apogee, inc, node, color, mass, kind, area, eta_dir in DEBRIS_FIELD:
        debris.append(
            Body(
                id=id_,
                name=name,
                role="debris",
                kind=kind,
                color=color,
                mass_kg=float(mass),
                area_m2=area,
                recoil_efficiency=eta_dir,
                initial_orbit={"perigeeKm": perigee, "apogeeKm": apogee, "inclinationDeg": inc, "nodeDeg": node},
                initial_state=initial(perigee, apogee, inc, node),
                origin="OrbitFleet debris replay body",
            )
        )
    by_id = {b.id: b for b in debris}

    # Gravity-only tracks for design and as matched baselines.
    def track(state: Vector) -> list[Vector]:
        out = [list(state)]
        for _ in range(int(DURATION / STEP)):
            state = rk4(state, STEP)
            out.append(state)
        return out

    fragment_a_track = track(by_id["fragment-1"].initial_state)
    sweeper_state = design_sweeper(fragment_a_track, 2_400.0)
    sweeper_track = track(sweeper_state)
    for frag_id, t_enc, inc, miss, factor, shallow in SWEEPER_ENCOUNTERS:
        name, color, mass, area, eta_dir = SMALL_FRAGMENTS[frag_id]
        state = design_fragment(sweeper_track, t_enc, inc, miss, factor, shallow)
        el = elements(state)
        debris.append(
            Body(
                id=frag_id,
                name=name,
                role="debris",
                kind="small_fragment",
                color=color,
                mass_kg=mass,
                area_m2=area,
                recoil_efficiency=eta_dir,
                initial_orbit={
                    "perigeeKm": round(el["perigee"], 1),
                    "apogeeKm": round(el["apogee"], 1),
                    "inclinationDeg": round(el["inclination"], 1),
                    "nodeDeg": None,
                },
                initial_state=state,
                origin="Added centimetre-class fragment (sweeper demonstration)",
            )
        )
    by_id = {b.id: b for b in debris}

    def ahead_of(target: Body, offset_km: float) -> Vector:
        speed = norm(target.initial_state[3:])
        return propagate(list(target.initial_state), offset_km / speed)

    lasers = [
        Body(
            id="las-1",
            name="LAS-1 Shepherd",
            role="laser",
            kind="laser_shepherd",
            mode="shepherd",
            color="#d9b3ff",
            family="82° family",
            assigned_target="fragment-6",
            initial_state=ahead_of(by_id["fragment-6"], 160.0),
            initial_orbit=dict(by_id["fragment-6"].initial_orbit),
            mass_kg=LASER_DESIGN["busMassKg"],
            origin="Proposed shepherd, co-planar 160 km ahead of the derelict",
        ),
        Body(
            id="las-2",
            name="LAS-2 Shepherd",
            role="laser",
            kind="laser_shepherd",
            mode="shepherd",
            color="#ffd6a3",
            family="65° family",
            assigned_target="fragment-7",
            initial_state=ahead_of(by_id["fragment-7"], 180.0),
            initial_orbit=dict(by_id["fragment-7"].initial_orbit),
            mass_kg=LASER_DESIGN["busMassKg"],
            origin="Proposed shepherd, co-planar 180 km ahead of the spent stage",
        ),
        Body(
            id="las-3",
            name="LAS-3 Sweeper",
            role="laser",
            kind="laser_sweeper",
            mode="sweeper",
            color="#b8f5ff",
            family="98° near-polar",
            assigned_target=None,
            initial_state=sweeper_state,
            initial_orbit=None,
            mass_kg=LASER_DESIGN["busMassKg"],
            origin="Proposed sweeper; near-polar, dawn-dusk plane",
        ),
    ]
    sweeper_el = elements(sweeper_state)
    lasers[2].initial_orbit = {
        "perigeeKm": round(sweeper_el["perigee"], 1),
        "apogeeKm": round(sweeper_el["apogee"], 1),
        "inclinationDeg": round(sweeper_el["inclination"], 1),
        "nodeDeg": None,
    }
    # Dawn-dusk plane: sun 90 deg from the sweeper's node, in the equator-ish.
    h_s = unit(cross(sweeper_state[:3], sweeper_state[3:]))
    node_dir = unit(cross([0.0, 0.0, 1.0], h_s))
    sun = unit(add(rotate(node_dir, [0.0, 0.0, 1.0], math.pi / 2), [0.0, 0.0, -0.09]))
    if dot(sun, h_s) < 0:
        sun = unit(add(rotate(node_dir, [0.0, 0.0, 1.0], -math.pi / 2), [0.0, 0.0, -0.09]))

    bodies = debris + lasers
    baselines = {b.id: track(b.initial_state) for b in debris}

    engagements: list[dict[str, Any]] = []
    timeline: list[dict[str, Any]] = []
    open_segments: dict[str, dict[str, Any] | None] = {laser.id: None for laser in lasers}
    windows: dict[str, dict[str, Any]] = {}
    thrust_since: dict[str, float | None] = {laser.id: None for laser in lasers}
    last_status: dict[str, str] = {laser.id: "" for laser in lasers}

    def log(t: float, kind: str, laser: Body, message: str, target: str | None = None) -> None:
        timeline.append({"t": t, "type": kind, "laser": laser.id, "target": target, "message": message})

    def record_sample(t: float) -> None:
        for b in bodies:
            el = elements(b.state)
            entry: dict[str, Any] = {
                "t": t,
                "p": b.state[:3],
                "v": b.state[3:],
                "perigee": el["perigee"],
                "apogee": el["apogee"],
                "sunlit": sunlit(b.state[:3], sun),
            }
            if b.role == "debris":
                base = elements(baselines[b.id][int(t / STEP)])
                entry.update(
                    {
                        "dPerigee": el["perigee"] - base["perigee"],
                        "dApogee": el["apogee"] - base["apogee"],
                        "dvMs": b.dv_ms,
                        "dvRetroMs": b.dv_retro_ms,
                        "energyJ": b.energy_j,
                        "engagedBy": b.engaged_by,
                    }
                )
            else:
                entry.update(
                    {
                        "status": b.status,
                        "target": b.target,
                        "rangeKm": b.range_km,
                        "pulseJ": b.pulse_j,
                        "repHz": b.rep_hz,
                        "powerOnTargetW": b.power_on_target_w,
                        "thrust": b.thrust_sign,
                        "propellantKg": b.propellant_kg,
                        "dvSelfMs": b.dv_self_ms,
                        "firingS": b.firing_s,
                        "onTargetJ": b.on_target_j,
                        "hold": b.hold_reason,
                    }
                )
            b.samples.append(entry)

    def close_segment(laser: Body, t: float) -> None:
        seg = open_segments[laser.id]
        if not seg:
            return
        target = by_id[seg["target"]]
        el = elements(target.state)
        base = elements(baselines[target.id][int(t / STEP)])
        seg["end"] = t
        seg["durationS"] = t - seg["start"]
        seg["dvMs"] = target.dv_ms - seg["dv0"]
        seg["dvRetroMs"] = target.dv_retro_ms - seg["dvRetro0"]
        seg["energyOnTargetJ"] = target.energy_j - seg["energy0"]
        seg["impulseNs"] = seg["dvMs"] * target.mass_kg
        seg["meanRangeKm"] = seg["rangeSum"] / max(1, seg["count"])
        seg["meanHeadOnCos"] = seg["cosSum"] / max(1, seg["count"])
        seg["meanPowerOnTargetW"] = seg["energyOnTargetJ"] / max(1e-9, seg["durationS"])
        seg["perigeeAfterKm"] = el["perigee"]
        seg["apogeeAfterKm"] = el["apogee"]
        seg["dPerigeeVsBaselineKm"] = el["perigee"] - base["perigee"]
        seg["dApogeeVsBaselineKm"] = el["apogee"] - base["apogee"]
        for key in ("rangeSum", "cosSum", "count", "dv0", "dvRetro0", "energy0"):
            seg.pop(key)
        engagements.append(seg)
        open_segments[laser.id] = None
        log(t, "FIRE_END", laser, f"Ceased fire on {target.name}: {seg['dvMs']:.3f} m/s delivered", target.id)

    def evaluate(laser: Body, target: Body) -> tuple[bool, str, dict[str, float]]:
        d = add(target.state[:3], laser.state[:3], -1.0)
        rng = norm(d)
        info: dict[str, float] = {"range": rng}
        if rng > LASER_DESIGN["maxRangeKm"]:
            return False, "RANGE_FAR", info
        d_hat = unit(d)
        v_t_hat = unit(target.state[3:])
        head_on = -dot(d_hat, v_t_hat)
        closing = dot(d, add(target.state[3:], laser.state[3:], -1.0)) / rng
        info.update({"headOn": head_on, "closing": closing})
        if rng < LASER_DESIGN["minRangeKm"]:
            return False, "RANGE_CLOSE", info
        if head_on < LASER_DESIGN["minHeadOnCosine"]:
            return False, "GEOMETRY", info
        if laser.mode == "sweeper" and closing >= 0:
            return False, "RECEDING", info
        if not sunlit(laser.state[:3], sun):
            return False, "ECLIPSE", info
        if limb_clearance_km(laser.state[:3], target.state[:3]) < LASER_DESIGN["limbClearanceKm"]:
            return False, "LIMB", info
        el = elements(target.state)
        if laser.mode == "shepherd" and el["e"] > 0.01 and norm(target.state[:3]) < el["a"]:
            return False, "APOGEE_HALF", info
        return True, "FIRE", info

    HOLD_TEXT = {
        "RANGE_FAR": "target beyond 300 km",
        "RANGE_CLOSE": "target inside 60 km minimum range",
        "GEOMETRY": "beam more than 60° from the target's anti-velocity; recoil would raise the orbit or shift its plane",
        "RECEDING": "target receding; firing would raise its orbit",
        "ECLIPSE": "laser in eclipse; firing suspended",
        "LIMB": "line of sight too close to the atmosphere",
        "APOGEE_HALF": "waiting for apogee half of target orbit",
        "SEARCH": "no target within 300 km",
    }

    steps = int(DURATION / STEP)
    for i in range(steps + 1):
        t = i * STEP
        if i == steps:
            # Final sample: no further control decision or integration.
            record_sample(t)
            for laser in lasers:
                close_segment(laser, t)
            break
        for b in debris:
            b.extra = [0.0, 0.0, 0.0]
            b.engaged_by = None
        for laser in lasers:
            laser.extra = [0.0, 0.0, 0.0]
            laser.power_on_target_w = laser.pulse_j = laser.rep_hz = 0.0
            candidates = [by_id[laser.assigned_target]] if laser.assigned_target else debris
            chosen: tuple[Body, dict[str, float]] | None = None
            reason = "SEARCH"
            for target in candidates:
                ok, why, info = evaluate(laser, target)
                if info["range"] <= LASER_DESIGN["maxRangeKm"] and laser.mode == "sweeper":
                    window = windows.setdefault(f"{laser.id}:{target.id}", {"open": None, "fired": False, "reasons": {}, "minRange": 1e9})
                    if window["open"] is None:
                        window["open"] = t
                        window["fired"] = False
                        window["reasons"] = {}
                        window["minRange"] = info["range"]
                    window["minRange"] = min(window["minRange"], info["range"])
                    if not ok:
                        window["reasons"][why] = window["reasons"].get(why, 0) + 1
                if ok and (chosen is None or info["range"] < chosen[1]["range"]):
                    chosen = (target, info)
                elif chosen is None and why != "RANGE_FAR":
                    reason = why
            # Close sweeper opportunity windows that have ended
            if laser.mode == "sweeper":
                for target in debris:
                    key = f"{laser.id}:{target.id}"
                    window = windows.get(key)
                    if not window or window["open"] is None:
                        continue
                    d = norm(add(target.state[:3], laser.state[:3], -1.0))
                    if d > LASER_DESIGN["maxRangeKm"] or i == steps:
                        if not window["fired"]:
                            dominant = max(window["reasons"], key=window["reasons"].get) if window["reasons"] else "RANGE_FAR"
                            engagements.append(
                                {
                                    "id": f"E{len(engagements) + 1:02d}",
                                    "laser": laser.id,
                                    "target": target.id,
                                    "mode": laser.mode,
                                    "start": window["open"],
                                    "end": t,
                                    "durationS": t - window["open"],
                                    "outcome": "ABORTED",
                                    "reason": dominant,
                                    "reasonText": HOLD_TEXT.get(dominant, dominant),
                                    "minRangeKm": window["minRange"],
                                    "dvMs": 0.0,
                                    "dvRetroMs": 0.0,
                                    "energyOnTargetJ": 0.0,
                                    "impulseNs": 0.0,
                                }
                            )
                            log(window["open"], "ABORT", laser, f"Opportunity on {target.name} refused: {HOLD_TEXT.get(dominant, dominant)}", target.id)
                        window["open"] = None
            if chosen:
                target, info = chosen
                rng = info["range"]
                energy, rate, fluence = pulse_plan(rng)
                coupling = coupling_ns_per_j(fluence) * target.recoil_efficiency
                fraction = LASER_DESIGN["pointingEfficiency"] * min(1.0, target.area_m2 / spot_area_m2(rng))
                power_out = energy * rate
                power_on = power_out * fraction
                force_n = coupling * power_on  # N
                d_hat = unit(add(target.state[:3], laser.state[:3], -1.0))
                accel = force_n / target.mass_kg / 1_000.0  # km/s^2
                target.extra = scale(d_hat, accel)
                target.engaged_by = laser.id
                dv_step = force_n / target.mass_kg * STEP
                target.dv_ms += dv_step
                target.dv_retro_ms += dv_step * info["headOn"]
                target.energy_j += power_on * STEP
                laser.status = "FIRING"
                laser.hold_reason = ""
                laser.target = target.id
                laser.range_km = rng
                laser.pulse_j = energy
                laser.rep_hz = rate
                laser.power_on_target_w = power_on
                laser.emitted_j += power_out * STEP
                laser.on_target_j += power_on * STEP
                laser.firing_s += STEP
                if laser.mode == "sweeper":
                    windows[f"{laser.id}:{target.id}"]["fired"] = True
                seg = open_segments[laser.id]
                if seg and seg["target"] != target.id:
                    close_segment(laser, t)
                    seg = None
                if seg is None:
                    seg = {
                        "id": f"E{len(engagements) + 1:02d}",
                        "laser": laser.id,
                        "target": target.id,
                        "mode": laser.mode,
                        "start": t,
                        "dv0": target.dv_ms - dv_step,
                        "dvRetro0": target.dv_retro_ms - dv_step * info["headOn"],
                        "energy0": target.energy_j - power_on * STEP,
                        "rangeSum": 0.0,
                        "cosSum": 0.0,
                        "count": 0,
                        "detail": [],
                        "detailStepS": 1,
                    }
                    open_segments[laser.id] = seg
                    log(t, "FIRE_START", laser, f"Firing on {target.name} at {rng:.0f} km, {energy:.0f} J × {rate:.1f} Hz", target.id)
                seg["rangeSum"] += rng
                seg["cosSum"] += info["headOn"]
                seg["count"] += 1
                seg["detail"].append([t, rng, info["headOn"], energy, rate, power_on, target.dv_ms])
            else:
                laser.status = "HOLD" if reason != "SEARCH" else "SEARCH"
                laser.hold_reason = reason
                laser.range_km = 0.0
                if laser.assigned_target:
                    laser.target = laser.assigned_target
                    laser.range_km = norm(add(by_id[laser.assigned_target].state[:3], laser.state[:3], -1.0))
                else:
                    laser.target = None
                if open_segments[laser.id] is not None:
                    close_segment(laser, t)
            status_key = laser.status + ":" + laser.hold_reason
            if status_key != last_status[laser.id] and laser.status != "FIRING":
                log(t, laser.status, laser, HOLD_TEXT.get(laser.hold_reason, laser.hold_reason), laser.target)
            last_status[laser.id] = status_key

            # Shepherd formation keeping: match the along-track delta-v given to
            # the target so orbital periods stay equal; keep the gap open.
            if laser.mode == "shepherd" and laser.assigned_target:
                target = by_id[laser.assigned_target]
                deficit = target.dv_retro_ms - laser.dv_self_ms
                separation = add(target.state[:3], laser.state[:3], -1.0)
                gap = norm(separation)
                gap_rate = dot(separation, add(target.state[3:], laser.state[3:], -1.0)) / gap
                if laser.thrust_sign == 0:
                    # Latch on at 0.05 m/s of unmatched delta-v, or when the gap
                    # closes below 110 km / opens beyond 250 km.
                    if deficit > 0.05 or (gap < 110.0 and gap_rate < 0):
                        laser.thrust_sign = -1
                    elif deficit < -0.05 or (gap > 250.0 and gap_rate > 0):
                        laser.thrust_sign = 1
                elif laser.thrust_sign < 0 and deficit <= 0 and not (gap < 110.0 and gap_rate < 0):
                    laser.thrust_sign = 0
                elif laser.thrust_sign > 0 and deficit >= 0 and not (gap > 250.0 and gap_rate > 0):
                    laser.thrust_sign = 0
                if laser.thrust_sign:
                    accel_ms2 = LASER_DESIGN["thrustN"] / laser.mass_kg
                    laser.extra = scale(unit(laser.state[3:]), laser.thrust_sign * accel_ms2 / 1_000.0)
                    laser.dv_self_ms += -laser.thrust_sign * accel_ms2 * STEP
                    burned = LASER_DESIGN["thrustN"] / (LASER_DESIGN["specificImpulseS"] * G0) * STEP
                    laser.propellant_kg += burned
                    laser.mass_kg -= burned
                    if thrust_since[laser.id] is None:
                        thrust_since[laser.id] = t
                        log(t, "THRUST_START", laser, f"Hall thruster {'retrograde' if laser.thrust_sign < 0 else 'prograde'} to hold formation", target.id)
                elif thrust_since[laser.id] is not None:
                    log(t, "THRUST_END", laser, "Formation matched; thruster off", target.id)
                    thrust_since[laser.id] = None

        if i % int(CADENCE / STEP) == 0:
            record_sample(t)
        for b in bodies:
            b.state = rk4(b.state, STEP, b.extra)

    # Thin engagement detail for long shepherd segments.
    for seg in engagements:
        detail = seg.get("detail")
        if detail and len(detail) > 400:
            stride = math.ceil(len(detail) / 400)
            seg["detail"] = detail[::stride] + ([detail[-1]] if (len(detail) - 1) % stride else [])
            seg["detailStepS"] = stride
    engagements.sort(key=lambda s: s["start"])
    for index, seg in enumerate(engagements):
        seg["id"] = f"E{index + 1:02d}"
    timeline.sort(key=lambda e: e["t"])

    # Outcome classification and projections
    def projection(target: Body) -> dict[str, Any]:
        el = elements(target.state)
        dv_req = apogee_burn_dv_ms(el["a"], el["e"], REENTRY_PERIGEE_KM)
        segs = [s for s in engagements if s["target"] == target.id and s["outcome"] != "ABORTED"]
        firing_s = sum(s["durationS"] for s in segs)
        dv_retro = target.dv_retro_ms
        result: dict[str, Any] = {
            "perigeeNowKm": el["perigee"],
            "apogeeNowKm": el["apogee"],
            "dvRequiredMs": dv_req,
            "dvDeliveredMs": target.dv_ms,
            "dvRetroDeliveredMs": dv_retro,
            "energyOnTargetJ": target.energy_j,
            "firingS": firing_s,
            "passes": len(segs),
            "decayTailDays": decay_tail_days(
                (RADIUS + REENTRY_PERIGEE_KM + RADIUS + max(el["apogee"], REENTRY_PERIGEE_KM + 20)) / 2,
                max(0.0, (el["apogee"] - REENTRY_PERIGEE_KM) / (2 * RADIUS + el["apogee"] + REENTRY_PERIGEE_KM)),
                target.area_m2,
                target.mass_kg,
            ),
        }
        if el["perigee"] <= REENTRY_PERIGEE_KM:
            result.update({"status": "REENTRY_COURSE", "projectedDays": {"25": 0.0, "50": 0.0, "100": 0.0}})
            return result
        if not segs or dv_retro <= 0:
            result.update({"status": "NOT_ENGAGED", "projectedDays": None})
            return result
        shepherd = any(s["mode"] == "shepherd" for s in segs)
        if shepherd:
            rate_ms_per_h = dv_retro / (firing_s / 3_600.0)
            duty = firing_s / DURATION
            hours = dv_req / rate_ms_per_h
            days = hours / max(duty, 1e-6) / 24.0
            result.update(
                {
                    "model": "shepherd",
                    "dvRateMsPerFiringHour": rate_ms_per_h,
                    "dutyCycle": duty,
                    "firingHoursRequired": hours,
                }
            )
        else:
            per_pass = dv_retro / len(segs)
            passes = math.ceil(dv_req / per_pass)
            circumference = 2 * math.pi * el["a"]
            opportunities_per_day = 2 * (86_400.0 / (2 * math.pi * math.sqrt(el["a"] ** 3 / MU))) * (2 * LASER_DESIGN["maxRangeKm"] / circumference)
            days = passes / opportunities_per_day
            result.update(
                {
                    "model": "sweeper",
                    "dvPerPassMs": per_pass,
                    "passesRequired": passes,
                    "opportunitiesPerDay": opportunities_per_day,
                }
            )
        result["projectedDays"] = {"25": days * 2, "50": days, "100": days / 2}
        result["status"] = "PROGRESS" if days <= 365 else "MARGINAL"
        return result

    for seg in engagements:
        if seg.get("outcome") == "ABORTED":
            continue
        dv_still_needed = apogee_burn_dv_ms(
            (seg["perigeeAfterKm"] + seg["apogeeAfterKm"] + 2 * RADIUS) / 2,
            (seg["apogeeAfterKm"] - seg["perigeeAfterKm"])
            / (seg["apogeeAfterKm"] + seg["perigeeAfterKm"] + 2 * RADIUS),
            REENTRY_PERIGEE_KM,
        )
        fraction = seg["dvRetroMs"] / (seg["dvRetroMs"] + dv_still_needed)
        seg["dvFractionOfRequired"] = fraction
        if seg["perigeeAfterKm"] <= REENTRY_PERIGEE_KM:
            seg["outcome"] = "SUCCESS"
            seg["reasonText"] = "Perigee at or below 200 km: re-entry course"
        elif seg["mode"] == "shepherd":
            laser = next(l for l in lasers if l.id == seg["laser"])
            rate = seg["dvRetroMs"] / max(seg["durationS"], 1.0) * 3_600.0  # m/s per firing hour
            duty = laser.firing_s / DURATION
            days = dv_still_needed / max(rate * duty, 1e-9) / 24.0
            seg["projectedDaysAtRate"] = days
            seg["dvRateMsPerFiringHour"] = rate
            if days <= 180:
                seg["outcome"] = "EFFECTIVE"
                seg["reasonText"] = f"{rate:.2f} m/s per firing hour; campaign projects to {days:.0f} days at this duty"
            else:
                seg["outcome"] = "PARTIAL"
                seg["reasonText"] = f"{rate:.2f} m/s per firing hour; campaign projects beyond 180 days"
        elif fraction >= 0.02:
            seg["outcome"] = "EFFECTIVE"
            seg["reasonText"] = f"Delivered {fraction * 100:.1f}% of the retrograde Δv needed for a 200 km perigee"
        elif fraction >= 0.001:
            seg["outcome"] = "PARTIAL"
            seg["reasonText"] = f"Delivered {fraction * 100:.2f}% of the retrograde Δv needed for a 200 km perigee"
        else:
            seg["outcome"] = "INEFFECTIVE"
            seg["reasonText"] = "Target too massive for a single sweeper pass; reassign to a shepherd"

    projections = {b.id: projection(b) for b in debris}

    def compact(body: Body) -> dict[str, Any]:
        base: dict[str, Any] = {
            "id": body.id,
            "name": body.name,
            "role": body.role,
            "kind": body.kind,
            "color": body.color,
            "massKg": body.__dict__.get("mass_kg") if body.role == "debris" else LASER_DESIGN["busMassKg"],
            "initialOrbit": body.initial_orbit,
            "origin": body.origin,
        }
        if body.role == "debris":
            base.update(
                {
                    "areaM2": body.area_m2,
                    "recoilEfficiency": body.recoil_efficiency,
                    "samples": [[s["t"], *s["p"], *s["v"], s["perigee"], s["apogee"]] for s in body.samples],
                    "campaign": [[s["t"], s["dPerigee"], s["dApogee"], s["dvMs"], s["dvRetroMs"], s["energyJ"], s["engagedBy"] or ""] for s in body.samples],
                    "baseline": [
                        [t, *baselines[body.id][int(t / STEP)][:3], elements(baselines[body.id][int(t / STEP)])["perigee"], elements(baselines[body.id][int(t / STEP)])["apogee"]]
                        for t in range(0, DURATION + 1, CADENCE)
                    ],
                    "projection": projections[body.id],
                }
            )
        else:
            base.update(
                {
                    "mode": body.mode,
                    "family": body.family,
                    "assignedTarget": body.assigned_target,
                    "samples": [[s["t"], *s["p"], *s["v"], s["perigee"], s["apogee"]] for s in body.samples],
                    "laser": [
                        [s["t"], s["status"], s["target"] or "", s["rangeKm"], s["pulseJ"], s["repHz"], s["powerOnTargetW"], s["thrust"], s["propellantKg"], s["dvSelfMs"], s["firingS"], s["onTargetJ"], 1 if s["sunlit"] else 0, s["hold"]]
                        for s in body.samples
                    ],
                    "totals": {
                        "firingS": body.firing_s,
                        "emittedJ": body.emitted_j,
                        "onTargetJ": body.on_target_j,
                        "propellantKg": body.propellant_kg,
                        "dvSelfMs": body.dv_self_ms,
                        "finalMassKg": body.mass_kg,
                    },
                }
            )
        return base

    scene: dict[str, Any] = {
        "schemaVersion": "laser-ablation-1",
        "title": "Laser ablation campaign — three proposed satellites against a fictional debris field",
        "epochLabel": "Configured epoch; no calendar date is claimed",
        "frame": {
            "name": "CONFIGURED_EARTH_EQUATORIAL_INERTIAL",
            "description": "Earth equator in XY, north pole +Z; no real ephemeris",
            "axisMapping": "[x,z,-y]",
        },
        "body": {"name": "Earth", "radiusKm": RADIUS, "muKm3S2": MU, "j2": J2, "textureUrl": "/data/orbits/earth-blue-marble.png", "rotationRateRadS": 7.2921150e-5},
        "sunDirection": sun,
        "durationSeconds": DURATION,
        "stepSeconds": CADENCE,
        "integratorStepSeconds": STEP,
        "reentryPerigeeKm": REENTRY_PERIGEE_KM,
        "laserDesign": LASER_DESIGN,
        "holdText": HOLD_TEXT,
        "objects": [compact(b) for b in bodies],
        "engagements": engagements,
        "timeline": timeline,
        "limits": [
            "Fictional debris field: OrbitFleet's seven authored bodies plus three added centimetre-class fragments placed so the sweeper meets them. No catalogue object is represented.",
            "Ablation coupling is a fixed 50 µN·s/J at optimum fluence (25 and 100 shown as sensitivity), ramping linearly to zero at 25% of optimum fluence. Real coupling depends on material, pulse, plasma shielding and surface state.",
            "Beam spot follows 2.44·M²·λ·R/D with M² = 1.5; energy on target is the pointing efficiency (0.7) times the fraction of the spot covered by the target's projected area. Recoil is applied along the beam scaled by a per-body surface-normal efficiency.",
            "The controller fires only within 60–300 km, only when the beam opposes the target velocity within 60°, only on approaching targets (sweeper), only while the laser is sunlit, and only on the apogee half of eccentric target orbits (shepherd).",
            "Shepherd formation keeping uses a 170 mN argon Hall thruster to match the along-track Δv given to the target. Prescribed control law, not an optimised guidance solution.",
            "Gravity: point mass plus J2. RK4 at 1 s with control decisions frozen per step. No drag, solar pressure, third bodies, attitude dynamics, mass loss, thermal limits, tracking error or sensor model.",
            "Projected timelines extrapolate the six-hour firing statistics linearly to the retrograde Δv needed for a 200 km perigee (apogee-impulse formula). Sweeper projections use a random-phase encounter model of two orbit crossings per sweeper orbit.",
            "The atmospheric decay tail after reaching a 200 km perigee is a King-Hele estimate with a static exponential atmosphere (2.5e-10 kg/m³ at 200 km, 37 km scale height, Cd 2.2). Solar activity changes it several-fold.",
            "Positions and Earth share one linear scale in the 3D view; markers and beams are enlarged for visibility.",
        ],
        "sources": [
            {"label": "The Case for Attack Satellites (design basis)", "url": "/blog/the-case-for-attack-satellites/"},
            {"label": "OrbitFleet debris dynamics lab (debris field origin)", "url": "https://orbitfleet.populationmars.com/debris"},
            {"label": "Phipps et al., laser-ablation momentum coupling review (Applied Physics Reviews 2010)", "url": "https://doi.org/10.1063/1.3496493"},
            {"label": "King-Hele, Satellite Orbits in an Atmosphere (decay-rate expressions)", "url": "https://ntrs.nasa.gov/citations/19880008220"},
        ],
    }
    return scene


def rounded(value: Any, digits: int = 4, key: str | None = None) -> Any:
    """Round floats for export. State samples keep 0.1 m positions and
    0.1 mm/s velocities so energy and apsides can be recomputed downstream."""
    if isinstance(value, float):
        return round(value, digits)
    if isinstance(value, list):
        if key == "samples":
            return [
                [round(x, 7) if 4 <= index <= 6 else rounded(x, digits) for index, x in enumerate(row)]
                for row in value
            ]
        return [rounded(x, digits) for x in value]
    if isinstance(value, dict):
        return {k: rounded(x, digits, k) for k, x in value.items()}
    return value


if __name__ == "__main__":
    scene = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(rounded(scene), separators=(",", ":"), allow_nan=False))
    manifest = {
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "generator": "scripts/orbits/build_laser_ablation_scene.py",
        "generatorSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "model": "laser-ablation-1",
        "objects": len(scene["objects"]),
        "engagements": len(scene["engagements"]),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {OUTPUT.stat().st_size:,} bytes; {len(scene['engagements'])} engagements; sha256 {manifest['sha256']}")
    for seg in scene["engagements"]:
        print(
            f"  {seg['id']} {seg['laser']} -> {seg['target']} {seg['start']:>7.0f}-{seg['end']:>7.0f} s "
            f"{seg['outcome']:<12} dv={seg.get('dvMs', 0):.3f} m/s  {seg.get('reasonText', '')}"
        )
    for obj in scene["objects"]:
        if obj["role"] == "debris":
            p = obj["projection"]
            days = p.get("projectedDays")
            print(f"  {obj['id']:<12} {obj['name']:<32} perigee {p['perigeeNowKm']:.1f} km  dv {p['dvRetroDeliveredMs']:.3f}/{p['dvRequiredMs']:.1f} m/s  {p['status']}  days@50={days['50'] if days else '—'}")
