"""Independent analytic, finite-difference and held-out checks; no network."""

import json
import math

import numpy as np
import spiceypy as spice
from build_mars_scene import (
    J2,
    ROOT,
    S,
    acceleration,
    circular_state,
    load_constants,
    propagate,
    reference,
)

mu, radii = load_constants()
radius = radii[0]
results = {}


# A finite-difference potential gradient independently checks the J2 signs/powers.
def potential(p):
    r = np.linalg.norm(p)
    return -mu / r * (1 - J2 * (radius / r) ** 2 * 0.5 * (3 * (p[2] / r) ** 2 - 1))


p = np.array([3800.0, 2300.0, 1600.0])
grad = np.array(
    [
        (potential(p + np.eye(3)[i] * 0.01) - potential(p - np.eye(3)[i] * 0.01)) / 0.02
        for i in range(3)
    ]
)
results["j2AccelerationGradientErrorKmS2"] = float(
    np.linalg.norm(acceleration(p, mu, radius) + grad)
)
assert results["j2AccelerationGradientErrorKmS2"] < 1e-11

initial = circular_state(450, 92, 20, 35, mu, radius)
coarse = propagate(initial, mu, radius)
fine = propagate(initial, mu, radius, dt=5)
results["j2StepHalvingMaxPositionErrorM"] = float(
    np.max(np.linalg.norm(coarse[:, :3] - fine[:, :3], axis=1)) * 1000
)
assert results["j2StepHalvingMaxPositionErrorM"] < 1
energy = np.array([np.dot(s[3:], s[3:]) / 2 + potential(s[:3]) for s in coarse])
results["j2MaxRelativeEnergyDrift"] = float(
    np.max(np.abs(energy - energy[0])) / abs(energy[0])
)
assert results["j2MaxRelativeEnergyDrift"] < 1e-8

point_mass = propagate(initial, mu, radius, j2=0)
times = np.arange(len(point_mass)) * 30
n = math.sqrt(mu / (radius + 450) ** 3)
analytic = (
    np.cos(times * n)[:, None] * initial[:3]
    + np.sin(times * n)[:, None] * initial[3:] / n
)
results["pointMassAnalyticMaxPositionErrorM"] = float(
    np.max(np.linalg.norm(point_mass[:, :3] - analytic, axis=1)) * 1000
)
assert results["pointMassAnalyticMaxPositionErrorM"] < 1

# Hold out every alternate 30 s NASA state: interpolate across 60 s gaps,
# twice the actual 30 s renderer spacing, and compare to untouched source.
results["historicalHermite60sHeldoutMaxErrorM"] = {}
for name in ["mro", "odyssey", "mars-express", "tgo"]:
    states, _ = reference(name)
    mid = (
        0.5 * states[:-2:2, :3]
        + 7.5 * states[:-2:2, 3:]
        + 0.5 * states[2::2, :3]
        - 7.5 * states[2::2, 3:]
    )
    err = float(np.max(np.linalg.norm(mid - states[1::2, :3], axis=1)) * 1000)
    results["historicalHermite60sHeldoutMaxErrorM"][name] = err
    assert err < 10, (name, err)

scene = json.loads((ROOT / "public/data/orbits/mars-scene.json").read_text())
et = spice.str2et(scene["epochUtc"].rstrip("Z"))
qerrors = []
for sample in scene["samples"]:
    q = sample["renderBodyQuaternion"]
    actual = spice.q2m([q[3], *q[:3]])
    expected = S @ spice.pxform("IAU_MARS", "J2000", et + sample["timeSeconds"]) @ S.T
    assert abs(np.linalg.det(actual) - 1) < 1e-12
    qerrors.append(float(np.max(np.abs(actual - expected))))
results["maxRenderBasisMatrixError"] = max(qerrors)
assert results["maxRenderBasisMatrixError"] < 1e-12

results["altitudeRangesAboveEquatorialRadiusKm"] = {}
for body in ["mars", "earth"]:
    data = json.loads((ROOT / f"public/data/orbits/{body}-scene.json").read_text())
    count = data["durationSeconds"] // data["stepSeconds"] + 1
    assert len(data["samples"]) == count
    assert [s["timeSeconds"] for s in data["samples"]] == list(
        range(0, data["durationSeconds"] + 1, data["stepSeconds"])
    )
    for obj in data["objects"]:
        pos = np.array(obj["positionsKm"])
        vel = np.array(obj["velocitiesKmS"])
        assert pos.shape == vel.shape == (count, 3)
        assert np.isfinite(pos).all() and np.isfinite(vel).all()
        alt = np.linalg.norm(pos, axis=1) - data["body"]["radiusKm"]
        assert min(alt) > 100
        results["altitudeRangesAboveEquatorialRadiusKm"][f"{body}/{obj['id']}"] = [
            round(float(min(alt)), 3),
            round(float(max(alt)), 3),
        ]

out = ROOT / "docs/orbital-scene-checks.json"
out.write_text(json.dumps(results, indent=2) + "\n")
print(
    json.dumps(
        {
            k: v
            for k, v in results.items()
            if k != "altitudeRangesAboveEquatorialRadiusKm"
        },
        indent=2,
    )
)
print("All scene checks passed; detailed ranges:", out)
