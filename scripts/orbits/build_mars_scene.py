"""Build a bounded historical Mars scene. Run with requirements-build.txt.

Published spacecraft states are preserved, never repropagated by our model.
Proposed states use a Mars-equatorial inertial basis frozen at the epoch.
"""

import csv
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import spiceypy as spice

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / "sources"
OUTPUT = ROOT / "public/data/orbits/mars-scene.json"
EPOCH = "2025-01-01T00:00:00Z"
DURATION = 21600
STEP = 30
# Low-order illustrative oblateness, from NAIF Gravity.tpc (1999); not a
# modern high-degree Mars gravity solution. Do not load its obsolete GM.
J2 = 1.964e-3
S = np.array([[1.0, 0.0, 0.0], [0.0, 0.0, 1.0], [0.0, -1.0, 0.0]])


def load_constants():
    spice.kclear()
    for filename in ["naif0012.tls.pc", "pck00011.tpc", "gm_de440.tpc"]:
        spice.furnsh(str(CACHE / filename))
    return float(spice.bodvrd("MARS", "GM", 1)[1][0]), spice.bodvrd("MARS", "RADII", 3)[
        1
    ]


def reference(name):
    payload = json.loads((CACHE / f"{name}-20250101.json").read_text())
    result = payload["result"]
    for expected in [
        "Reference frame : ICRF",
        "KM-S",
        "GEOMETRIC cartesian states",
        "Center body name: Mars (499)",
    ]:
        if expected not in result:
            raise ValueError(
                f"{name}: unexpected source frame, center, units or correction: {expected}"
            )
    rows = list(
        csv.reader(result.split("$$SOE")[1].split("$$EOE")[0].strip().splitlines())
    )
    states = np.array([[float(value) for value in row[2:8]] for row in rows])
    times = np.array([(float(row[0]) - float(rows[0][0])) * 86400 for row in rows])
    assert len(states) == 721 and np.isfinite(states).all()
    assert np.max(np.abs(times - np.arange(721) * STEP)) < 0.001
    assert (
        "2025-Jan-01 00:00:00" in rows[0][1] and "2025-Jan-01 06:00:00" in rows[-1][1]
    )
    return states, payload


def acceleration(position, mu, radius, j2=J2):
    r2 = np.dot(position, position)
    r = math.sqrt(r2)
    z2 = position[2] ** 2 / r2
    return (
        -mu / r** 3 * position
        + 1.5
        * j2
        * mu
        * radius** 2
        / r** 5
        * position
        * np.array([5 * z2 - 1, 5 * z2 - 1, 5 * z2 - 3])
    )


def derivative(state, mu, radius, j2):
    return np.concatenate((state[3:], acceleration(state[:3], mu, radius, j2)))


def propagate(initial, mu, radius, dt=10, j2=J2):
    assert STEP % dt == 0
    state = initial.copy()
    states = [state.copy()]
    for tick in range(1, DURATION // dt + 1):
        k1 = derivative(state, mu, radius, j2)
        k2 = derivative(state + dt / 2 * k1, mu, radius, j2)
        k3 = derivative(state + dt / 2 * k2, mu, radius, j2)
        k4 = derivative(state + dt * k3, mu, radius, j2)
        state += dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        if tick * dt % STEP == 0:
            states.append(state.copy())
    return np.array(states)


def circular_state(altitude, inclination, node, phase, mu, radius):
    inc, raan, u = np.radians([inclination, node, phase])
    p = np.array([math.cos(raan), math.sin(raan), 0])
    q = np.array(
        [-math.sin(raan) * math.cos(inc), math.cos(raan) * math.cos(inc), math.sin(inc)]
    )
    r = radius + altitude
    return np.concatenate(
        (
            r * (math.cos(u) * p + math.sin(u) * q),
            math.sqrt(mu / r) * (-math.sin(u) * p + math.cos(u) * q),
        )
    )


def build():
    mu, radii = load_constants()
    et = spice.str2et(EPOCH.rstrip("Z"))
    epoch_basis = spice.pxform("IAU_MARS", "J2000", et)
    sun_states, _ = reference("sun")
    samples = []
    for index, seconds in enumerate(range(0, DURATION + 1, STEP)):
        rotation = spice.pxform("IAU_MARS", "J2000", et + seconds)
        quaternion = spice.m2q(np.ascontiguousarray(S @ rotation @ S.T))
        samples.append(
            {
                "timeSeconds": seconds,
                "renderBodyQuaternion": [
                    *quaternion[1:].tolist(),
                    float(quaternion[0]),
                ],
                "sunDirection": (
                    sun_states[index, :3] / np.linalg.norm(sun_states[index, :3])
                ).tolist(),
            }
        )
    objects = []
    sources = []
    for key, name in [
        ("mro", "Mars Reconnaissance Orbiter"),
        ("odyssey", "Mars Odyssey"),
        ("mars-express", "Mars Express"),
        ("tgo", "Trace Gas Orbiter"),
    ]:
        states, payload = reference(key)
        objects.append(
            {
                "id": key,
                "name": name,
                "kind": "reference",
                "classification": "published_reference",
                "color": "#edcc8a",
                "positionsKm": states[:, :3].tolist(),
                "velocitiesKmS": states[:, 3:].tolist(),
            }
        )
        sources.append(
            {
                "label": f"{name} · JPL Horizons historical vectors",
                "url": payload["requestUrl"],
            }
        )
    for index in range(9):
        relay = index < 6
        number = index + 1 if relay else index - 5
        altitude, inc, node, phase = (
            (2000, 60, (index // 3) * 90, (index % 3) * 120)
            if relay
            else (450, 92, (index - 6) * 120, (index - 6) * 120 + 35)
        )
        initial = circular_state(altitude, inc, node, phase, mu, radii[0])
        states = propagate(initial, mu, radii[0])
        positions = states[:, :3] @ epoch_basis.T
        velocities = states[:, 3:] @ epoch_basis.T
        objects.append(
            {
                "id": f"proposed-{'relay' if relay else 'imager'}-{number}",
                "name": f"Proposed {'relay' if relay else 'imager'} {number}",
                "kind": "relay" if relay else "imager",
                "classification": "hypothetical",
                "color": "#67d7df" if relay else "#c697ef",
                "positionsKm": positions.tolist(),
                "velocitiesKmS": velocities.tolist(),
                "initialElements": {
                    "altitudeAboveEquatorialRadiusKm": altitude,
                    "inclinationDeg": inc,
                    "raanInEpochEquatorialBasisDeg": node,
                    "phaseDeg": phase,
                },
            }
        )
    scene = {
        "epochUtc": EPOCH,
        "body": {
            "name": "Mars",
            "radiusKm": float(radii[0]),
            "polarRadiusKm": float(radii[2]),
            "muKm3S2": mu,
            "j2": J2,
            "textureUrl": "/mars-data/5672_mars_6k_color.jpg",
            "texturePrimeMeridianU": 0,
            "atmosphereColor": "#dc936c",
        },
        "frame": {
            "name": "MARS_CENTERED_ICRF",
            "description": "Geometric ICRF vectors centered on Mars; UTC epoch; IAU Mars surface orientation.",
            "axisMapping": "[x,z,-y]",
        },
        "durationSeconds": DURATION,
        "stepSeconds": STEP,
        "sunDirection": samples[0]["sunDirection"],
        "samples": samples,
        "objects": objects,
        "metadata": {
            "title": "Mars · four historical orbiters and nine proposed spacecraft",
            "historicalPeriod": "1 January 2025 · 00:00–06:00 UTC",
            "speedMultiplier": 60,
            "sources": sources
            + [
                {
                    "label": "NAIF planetary constants and IAU orientation",
                    "url": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/",
                }
            ],
            "fidelity": "Four historical JPL Horizons trajectories; six proposed relays initially at 2,000 km and three imagers at 450 km. Proposed orbits use Mars gravity plus a low-order J2 term. No drag, radiation faults, link capacity, maneuver or collision-safety predictions. Markers are enlarged; surface maps are illustrative.",
            "proposedModel": "RK4 10 s; Mars point mass + approximate J2=0.001964 (NAIF Gravity.tpc); equator frozen at epoch; no higher harmonics, third bodies, drag or solar radiation pressure. Concept layout, not an optimized or safety-cleared deployment.",
        },
    }
    OUTPUT.write_text(json.dumps(scene, separators=(",", ":"), allow_nan=False) + "\n")
    manifest = {
        "epochUtc": EPOCH,
        "spiceypy": spice.__version__,
        "inputSha256": {
            f.name: hashlib.sha256(f.read_bytes()).hexdigest()
            for f in sorted(CACHE.iterdir())
            if f.is_file()
        },
        "outputSha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "constants": {
            "marsPlanetMuKm3S2": mu,
            "radiiKm": radii.tolist(),
            "approximateJ2": J2,
        },
    }
    (ROOT / "public/data/orbits/mars-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    print(
        f"Built {len(objects)} objects, {len(samples)} samples, {OUTPUT.stat().st_size:,} bytes"
    )


if __name__ == "__main__":
    build()
