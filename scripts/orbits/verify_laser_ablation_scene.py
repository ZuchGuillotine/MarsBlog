"""Independent checks for the laser-ablation campaign scene. No network.

Run from the repository root after the builder:
    python3 scripts/orbits/build_laser_ablation_scene.py
    python3 scripts/orbits/verify_laser_ablation_scene.py

Writes docs/laser-ablation-checks.json. If a checkout of OrbitFleet's
debris demo dataset is available at $ORBITFLEET_DEBRIS_JSON, the seven shared
debris baselines are compared against it as well.
"""

from __future__ import annotations

import json
import math
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_laser_ablation_scene as model  # noqa: E402

ROOT = model.ROOT
scene = json.loads(model.OUTPUT.read_text())
objects = {o["id"]: o for o in scene["objects"]}
results: dict[str, object] = {}


def check(name: str, value: float, limit: float) -> None:
    results[name] = value
    assert value < limit, f"{name}: {value} >= {limit}"


# 1. J2 acceleration matches the negative gradient of the potential.
point = [3800.0, 2300.0, 1600.0]
gradient = []
for axis in range(3):
    plus, minus = list(point), list(point)
    plus[axis] += 0.01
    minus[axis] -= 0.01
    gradient.append((model.potential(plus) - model.potential(minus)) / 0.02)
check(
    "j2AccelerationGradientErrorKmS2",
    model.norm(model.add(model.gravity(point), gradient)),
    1e-11,
)

# 2. Energy conservation under gravity only over the full six hours.
state = model.initial(700, 1200, 45, 155)
energies = []
for _ in range(int(model.DURATION / model.STEP)):
    state = model.rk4(state, model.STEP)
    energies.append(model.norm(state[3:]) ** 2 / 2 + model.potential(state[:3]))
check(
    "gravityOnlyRelativeEnergyDrift",
    (max(energies) - min(energies)) / abs(energies[0]),
    1e-9,
)

# 3. Step halving for a designed small fragment (largest velocity changes).
initial = objects["fragment-8"]["samples"][0][1:7]
coarse, fine = list(initial), list(initial)
for _ in range(7_200):
    coarse = model.rk4(coarse, 1.0)
    fine = model.rk4(model.rk4(fine, 0.5), 0.5)
check("stepHalvingPositionDifferenceKm", model.norm(model.add(coarse[:3], fine[:3], -1.0)), 1e-5)

# 4. Backward/forward propagation closure used by the encounter design.
forward = model.propagate(list(initial), 4_800.0)
back = model.propagate(forward, -4_800.0)
check("designRoundTripPositionErrorKm", model.norm(model.add(back[:3], initial[:3], -1.0)), 1e-6)

# 5. Pulse plan reproduces the article's range/energy anchors.
energy_250, rate_250, _ = model.pulse_plan(250.0)
energy_500 = model.LASER_DESIGN["optimumFluenceJM2"] * model.spot_area_m2(500.0)
results["pulseEnergyAt250KmJ"] = energy_250
results["optimumPulseEnergyAt500KmJ"] = energy_500
assert 620 < energy_250 < 700, energy_250
assert 2_400 < energy_500 < 2_800, energy_500
for rng in (60, 100, 150, 250, 300):
    energy, rate, _ = model.pulse_plan(rng)
    assert rate <= model.LASER_DESIGN["maxRepRateHz"] + 1e-9
    assert energy * rate <= model.LASER_DESIGN["averagePowerW"] + 1e-6

# 6. Apogee-impulse delta-v anchors from the article (200 km perigee).
for altitude, expected in ((550, 99), (800, 165), (1000, 214), (1200, 261)):
    dv = model.apogee_burn_dv_ms(model.RADIUS + altitude, 0.0, 200.0)
    results[f"dvTo200KmFrom{altitude}KmCircularMs"] = dv
    assert abs(dv - expected) < 3, (altitude, dv, expected)

# 7. Scene invariants.
design = scene["laserDesign"]
for seg in scene["engagements"]:
    if seg["outcome"] == "ABORTED":
        assert seg["dvMs"] == 0.0
        continue
    assert seg["meanHeadOnCos"] >= design["minHeadOnCosine"], seg["id"]
    assert design["minRangeKm"] <= seg["meanRangeKm"] <= design["maxRangeKm"], seg["id"]
    assert seg["meanPowerOnTargetW"] <= design["averagePowerW"] * design["pointingEfficiency"] + 1e-6
    target = objects[seg["target"]]
    first = next(s for s in reversed(target["samples"]) if s[0] <= seg["start"])
    last = next(s for s in target["samples"] if s[0] >= seg["end"])
    # J2-inclusive specific energy is conserved without the laser, so any
    # change across a firing segment is the recoil's work. Tolerance covers
    # the exported 0.1 mm/s velocity rounding.
    energy_before = model.norm(first[4:7]) ** 2 / 2 + model.potential(first[1:4])
    energy_after = model.norm(last[4:7]) ** 2 / 2 + model.potential(last[1:4])
    assert energy_after <= energy_before + 2e-6, f"{seg['id']} raised orbital energy"
untouched = [o for o in scene["objects"] if o["role"] == "debris" and o["projection"]["status"] == "NOT_ENGAGED"]
results["untouchedTargets"] = [o["id"] for o in untouched]
check(
    "untouchedMaxPerigeeDeltaKm",
    max(abs(row[1]) for o in untouched for row in o["campaign"]),
    1e-9,
)
for o in scene["objects"]:
    if o["role"] != "debris":
        continue
    final = o["campaign"][-1]
    assert final[1] <= 1e-9, f"{o['id']} ended with a raised perigee"
lasers = [o for o in scene["objects"] if o["role"] == "laser"]
for laser in lasers:
    totals = laser["totals"]
    assert totals["emittedJ"] <= design["averagePowerW"] * totals["firingS"] + 1e-6
    assert totals["propellantKg"] <= design["propellantKg"]
results["engagements"] = len(scene["engagements"])
results["outcomes"] = {}
for seg in scene["engagements"]:
    results["outcomes"][seg["outcome"]] = results["outcomes"].get(seg["outcome"], 0) + 1  # type: ignore[index]

# 8. Optional: shared debris baselines match OrbitFleet's demo dataset.
debris_json = os.environ.get("ORBITFLEET_DEBRIS_JSON")
if debris_json and Path(debris_json).exists():
    demo = json.loads(Path(debris_json).read_text())
    worst = 0.0
    for demo_object in demo["objects"]:
        ours = objects[demo_object["id"]]["baseline"]
        for row, sample in zip(ours, demo_object["baseline"], strict=False):
            assert row[0] == sample["t_s"]
            worst = max(worst, model.norm(model.add(row[1:4], sample["p_km"], -1.0)))
    check("orbitFleetBaselineMaxDifferenceKm", worst, 1e-4)

out = ROOT / "docs/laser-ablation-checks.json"
out.write_text(json.dumps(results, indent=2) + "\n")
print(json.dumps(results, indent=2))
