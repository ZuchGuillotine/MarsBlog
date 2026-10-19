"""Export the collision-buffer response as a fixed recording in the
``laser-ablation-1`` fixture format consumed by OrbitFleet's
``scripts/import_las_replay.py``.

Reads docs/conjunction-response/cosmos-2612-response.json (written by
build_conjunction_response.py) and writes
docs/conjunction-response/collision-buffer-recording.json: a six-hour excerpt
with two spacecraft-class bodies (the protected satellite and the drifting,
repairable one), one ablation satellite trailing on a safety ellipse, the four
prograde touches as engagements with per-second detail, and the hold events.

Run from the repository root after the response builder:
    python3 scripts/orbits/build_conjunction_response.py
    python3 scripts/orbits/build_collision_buffer_scene.py
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_laser_ablation_scene as m  # noqa: E402

ROOT = m.ROOT
SOURCE = ROOT / "docs/conjunction-response/cosmos-2612-response.json"
OUTPUT = ROOT / "docs/conjunction-response/collision-buffer-recording.json"
DURATION = 21_600  # six-hour excerpt; the response is complete after ~1 h
ASSET_ID, INTRUDER_ID, LASER_ID = "protected-sat", "drifting-sat", "las-1"


def orbit_row(t: float, p: list[float], v: list[float]) -> list[float]:
    el = m.elements([*p, *v])
    return [t, *p, *v, el["perigee"], el["apogee"]]


def baseline_row(t: float, p: list[float], v: list[float]) -> list[float]:
    el = m.elements([*p, *v])
    return [t, *p, el["perigee"], el["apogee"]]


def build() -> dict[str, Any]:
    run = json.loads(SOURCE.read_text())
    samples = [s for s in run["samples"] if s["t"] <= DURATION]
    assert [s["t"] for s in samples] == list(range(0, DURATION + 1, run["stepSeconds"]))
    summary, params = run["summary"], run["parameters"]
    bodies = run["bodies"]

    asset_samples = [orbit_row(s["t"], s["asset"], s["assetV"]) for s in samples]
    intruder_samples = [orbit_row(s["t"], s["intruder"], s["intruderV"]) for s in samples]
    intruder_baseline = [baseline_row(s["t"], s["baselineIntruder"], s["baselineIntruderV"]) for s in samples]
    laser_samples = [orbit_row(s["t"], s["laser"], s["laserV"]) for s in samples]

    def campaign(rows: list[list[float]], base: list[list[float]], s_rows: list[dict[str, Any]], engaged: bool) -> list[list[Any]]:
        return [
            [r[0], r[7] - b[4], r[8] - b[5], s["dvRetroCmS"] / 100 if engaged else 0.0, s["dvRetroCmS"] / 100 if engaged else 0.0,
             s["energyOnTargetJ"] if engaged else 0.0, LASER_ID if (engaged and s["firing"]) else ""]
            for r, b, s in zip(rows, base, s_rows, strict=True)
        ]

    objects = [
        {
            "id": ASSET_ID,
            "name": "Protected satellite",
            "role": "debris",
            "kind": "spacecraft",
            "color": "#75c9d2",
            "massKg": bodies["asset"]["mass_kg"],
            "areaM2": bodies["asset"]["area_m2"],
            "recoilEfficiency": 0.0,
            "initialOrbit": {"perigeeKm": params["altitudeKm"], "apogeeKm": params["altitudeKm"], "inclinationDeg": params["inclinationDeg"], "nodeDeg": params["nodeDeg"]},
            "origin": "Active satellite stand-in; never illuminated",
            "samples": asset_samples,
            "baseline": [baseline_row(s["t"], s["asset"], s["assetV"]) for s in samples],
            "campaign": campaign(asset_samples, [baseline_row(s["t"], s["asset"], s["assetV"]) for s in samples], samples, False),
        },
        {
            "id": INTRUDER_ID,
            "name": "Drifting satellite (repairable)",
            "role": "debris",
            "kind": "spacecraft",
            "color": "#f2c66d",
            "massKg": bodies["intruder"]["mass_kg"],
            "areaM2": bodies["intruder"]["area_m2"],
            "recoilEfficiency": bodies["intruder"]["recoil_efficiency"],
            "initialOrbit": {"perigeeKm": params["altitudeKm"] - 0.053, "apogeeKm": params["altitudeKm"] - 0.053, "inclinationDeg": params["inclinationDeg"], "nodeDeg": params["nodeDeg"]},
            "origin": "Uncooperative, non-manoeuvring stand-in 4.8 km behind the protected satellite, closing 0.5 km per orbit",
            "samples": intruder_samples,
            "baseline": intruder_baseline,
            "campaign": campaign(intruder_samples, intruder_baseline, samples, True),
            "separation": [[s["t"], s["rangeAssetIntruderKm"], m.norm(s["baselineRtnKm"])] for s in samples],
        },
    ]
    laser_rows = []
    for s in samples:
        firing = s["firing"]
        laser_rows.append([
            s["t"],
            "FIRING" if firing else s["status"],
            INTRUDER_ID,
            s["rangeLaserIntruderKm"],
            s["pulseJ"] if firing else 0.0,
            s["repHz"] if firing else 0.0,
            s["powerOnTargetW"] if firing else 0.0,
            0,
            0.0,
            0.0,
            s["firingS"],
            s["energyOnTargetJ"],
            1 if s["sunlit"] else 0,
            s["holdCode"],
        ])
    lasers = [
        {
            "id": LASER_ID,
            "name": "LAS-1 Shepherd",
            "role": "laser",
            "kind": "laser_shepherd",
            "mode": "shepherd (prograde buffer)",
            "family": "co-planar, trailing",
            "assignedTarget": INTRUDER_ID,
            "color": "#d9b3ff",
            "massKg": run["laserDesign"]["busMassKg"],
            "initialOrbit": {"perigeeKm": params["altitudeKm"] - params["laserEllipseRadialKm"], "apogeeKm": params["altitudeKm"] + params["laserEllipseRadialKm"], "inclinationDeg": params["inclinationDeg"], "nodeDeg": params["nodeDeg"]},
            "origin": f"Safety ellipse centred {params['laserBehindKm']:.0f} km behind the drifting satellite; fires forward along its velocity",
            "samples": laser_samples,
            "laser": laser_rows,
            "totals": {
                "firingS": summary["firingS"],
                "emittedJ": summary["emittedJ"],
                "onTargetJ": summary["energyOnTargetJ"],
                "propellantKg": 0.0,
                "dvSelfMs": 0.0,
                "finalMassKg": run["laserDesign"]["busMassKg"],
            },
        }
    ]
    engagements = []
    for touch in run["touches"]:
        if touch["start"] >= DURATION:
            continue
        end_idx = min(len(samples) - 1, int(-(-touch["end"] // run["stepSeconds"])))
        after = intruder_samples[end_idx]
        base_after = intruder_baseline[end_idx]
        engagements.append({
            "id": f"T{touch['n']:02d}",
            "laser": LASER_ID,
            "target": INTRUDER_ID,
            "mode": "buffer",
            "start": touch["start"],
            "end": touch["end"],
            "durationS": touch["durationS"],
            "dvMs": touch["dvRetroMs"],
            "dvRetroMs": -touch["dvRetroMs"],
            "dvProgradeMs": touch["dvRetroMs"],
            "energyOnTargetJ": touch["energyOnTargetJ"],
            "impulseNs": touch["dvRetroMs"] * bodies["intruder"]["mass_kg"],
            "meanRangeKm": touch["meanRangeKm"],
            "meanHeadOnCos": -touch["meanHeadOnCos"],
            "meanProgradeCos": touch["meanHeadOnCos"],
            "minAssetClearanceDeg": touch["minAssetClearanceDeg"],
            "meanPowerOnTargetW": touch["energyOnTargetJ"] / max(touch["durationS"], 1.0),
            "perigeeAfterKm": after[7],
            "apogeeAfterKm": after[8],
            "dPerigeeVsBaselineKm": after[7] - base_after[4],
            "dApogeeVsBaselineKm": after[8] - base_after[5],
            "predictedMinSeparationKm": touch["predictedMissAfterKm"],
            "predictedSeparationAtTcaKm": touch["predictedAtTcaKm"],
            "outcome": "TOUCH",
            "reasonText": (
                f"{touch['dvCmS']:.2f} cm/s prograde; predicted minimum separation "
                f"{touch['predictedMissAfterKm']:.2f} km, {touch['predictedAtTcaKm']:.2f} km at the original closest approach"
            ),
            "detail": touch["detail"],
            "detailStepS": 1,
        })
    timeline = [
        {"t": e["t"], "type": "HOLD" if e["type"] in ("HOLD", "COAST") else e["type"], "laser": LASER_ID,
         "target": INTRUDER_ID, "message": e["message"]}
        for e in run["events"] if e["t"] <= DURATION and e["type"] in ("HOLD", "COAST", "ASSESS", "CLEARED", "TOUCH_START", "TOUCH_END")
    ]
    return {
        "schemaVersion": "laser-ablation-1",
        "title": "Collision buffering — one ablation satellite nudges a drifting satellite off a conjunction",
        "epochLabel": "Configured epoch; representative orbits, not an element set",
        "frame": {"name": "CONFIGURED_EARTH_EQUATORIAL_INERTIAL", "description": "Earth equator in XY, north pole +Z; no real ephemeris", "axisMapping": "[x,z,-y]"},
        "body": {"name": "Earth", "radiusKm": m.RADIUS, "muKm3S2": m.MU, "j2": m.J2},
        "sunDirection": run["sunDirection"],
        "durationSeconds": DURATION,
        "stepSeconds": run["stepSeconds"],
        "integratorStepSeconds": run["integratorStepSeconds"],
        "laserDesign": m.LASER_DESIGN,  # source of truth; the run export rounds small constants
        "holdText": run["holdText"],
        "relations": {
            "protected": {
                "assetId": ASSET_ID,
                "intruderId": INTRUDER_ID,
                "floorKm": params["safetyFloorKm"],
                "reopenKm": params["screeningMissKm"] * params["margin"],
                "originalTcaS": summary["unperturbedTcaS"],
                "unperturbedMissM": summary["unperturbedMissM"],
            }
        },
        "presentation": {
            "kicker": "FIXED SCENARIO · COLLISION BUFFER",
            "headline": "A nudge instead of a removal.",
            "intro": (
                "A drifting but repairable satellite is closing on an active one. The shepherd trails it and "
                "pushes it forward in short touches, raising its orbit by about a hundred metres so the gap "
                "re-opens. Prograde, capped, re-assessed after each touch: the opposite of the removal rule."
            ),
            "note": (
                "Dynamics differ from debris removal: recoil raises the orbit instead of lowering it, each "
                "touch is capped at 90 s and followed by a re-prediction, and firing stops once the separation "
                "clears its floor. Energy on target is set by the gap to re-open, not by re-entry."
            ),
        },
        "objects": objects + lasers,
        "engagements": engagements,
        "timeline": timeline,
        "summary": {
            "touches": summary["touches"],
            "firingS": summary["firingS"],
            "dvProgradeCmS": summary["dvRetroCmS"],
            "energyOnTargetJ": summary["energyOnTargetJ"],
            "emittedJ": summary["emittedJ"],
            "semiMajorAxisChangeM": summary["intruderSemiMajorAxisChangeM"],
            "minSeparationKm": summary["integratedMinRangeKm"],
            "separationAtOriginalTcaKm": summary["separationAtOriginalTcaKm"],
            "unperturbedMissM": summary["unperturbedMissM"],
            "ablatedMassMg": summary["ablatedMassMg"],
        },
        "limits": run["limits"],
        "sources": [
            {"label": "Response run and write-up", "url": "https://github.com/ZuchGuillotine/MarsBlog/tree/main/docs/conjunction-response"},
            {"label": "The Case for Attack Satellites (design basis)", "url": "https://populationmars.com/blog/the-case-for-attack-satellites/"},
        ],
    }


def rounded(value: Any, digits: int = 5, key: str | None = None) -> Any:
    if isinstance(value, float):
        return round(value, 9 if key == "laserDesign" else digits)
    if isinstance(value, list):
        if key == "samples":
            return [[round(x, 7) if 4 <= i <= 6 else rounded(x, digits) for i, x in enumerate(row)] for row in value]
        return [rounded(x, digits, key) for x in value]
    if isinstance(value, dict):
        return {k: rounded(x, digits, k if k == "laserDesign" or key is None or k == "samples" else key) for k, x in value.items()}
    return value


if __name__ == "__main__":
    scene = build()
    OUTPUT.write_text(json.dumps(rounded(scene), separators=(",", ":"), allow_nan=False))
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes); sha256 {hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}")
    print(json.dumps(scene["summary"], indent=1))
    for e in scene["engagements"]:
        print(f"  {e['id']} {e['start']:.0f}-{e['end']:.0f} s dv {e['dvProgradeMs'] * 100:.2f} cm/s dApogee {e['dApogeeVsBaselineKm'] * 1000:.0f} m dPerigee {e['dPerigeeVsBaselineKm'] * 1000:.0f} m")
