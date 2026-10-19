"""Minimal-touch laser ablation response to an uncooperative co-orbital approach.

Scenario modelled on the October 2026 COSMOS 2612 / ICEYE-X36 incident: an
uncooperative ~500 kg spacecraft station-keeping a few kilometres from a ~90 kg
radar satellite in a 545 km sun-synchronous orbit, on a slow drift that would
bring the two within tens of metres. One proposed ablation satellite (the
shepherd design from the campaign scene) flies a displaced safety ellipse
*behind* the intruder and applies short, re-assessed "touches" of prograde
recoil until the predicted separation never falls below a safety floor and
re-opens past a screening threshold by the original time of closest approach.
The goal is the smallest energy on target that does the job, so each touch is
capped and the next is only taken after a fresh prediction.

Why from behind and prograde, against the debris rule of the article: the
intruder trails the asset and is catching up. A retrograde nudge from ahead
lowers it and makes it catch up sooner (a first run produced a 176 m fly-under
six hours in), and it puts the protected asset between the laser and the
target. A prograde nudge raises the intruder by tens of metres, stops the
catch-up and re-opens the gap, and the beam axis points away from the asset.

Representative orbits only: element sets could not be fetched in this
environment, so altitudes, inclination and relative geometry are taken from
published reporting (545 km, 97.8°, ~5 km station-keeping, 26 m predicted
TCA miss). No real epoch, element set or spacecraft design is represented.

Physics and laser model are imported unchanged from build_laser_ablation_scene.

Run from the repository root:
    python3 scripts/orbits/build_conjunction_response.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_laser_ablation_scene as m  # noqa: E402

ROOT = m.ROOT
OUT_DIR = ROOT / "docs/conjunction-response"
OUTPUT = OUT_DIR / "cosmos-2612-response.json"

# ----------------------------------------------------------------------------
# Scenario parameters (representative, see module docstring)
# ----------------------------------------------------------------------------
STEP = 1.0  # s, RK4 and control step
CADENCE = 30  # s, exported samples
ALTITUDE_KM = 545.0
INCLINATION_DEG = 97.8
NODE_DEG = 300.0  # representative; dawn-dusk assumed for the sun direction
ASSET = {"id": "iceye-x36", "name": "ICEYE-X36 (stand-in)", "mass_kg": 90.0, "area_m2": 1.6}
INTRUDER = {"id": "cosmos-2612", "name": "COSMOS 2612 (stand-in)", "mass_kg": 500.0, "area_m2": 4.0,
            "recoil_efficiency": 0.6}
INITIAL_GAP_KM = 4.8  # intruder trails the asset by this much along-track
CLOSING_PER_ORBIT_KM = 0.5  # slow catch-up drift that produces the conjunction
MISS_RADIAL_M = 26.0  # residual geometric miss without intervention
TCA_ORBITS = INITIAL_GAP_KM / CLOSING_PER_ORBIT_KM  # ~9.6 orbits
SCREENING_MISS_KM = 5.0  # separation to re-establish by the original TCA epoch
SAFETY_FLOOR_KM = 2.0  # never let the predicted separation fall below this
MARGIN = 1.25  # on top of the screening distance for tracking uncertainty
TOUCH_MAX_S = 90.0  # cap on one touch of firing
REASSESS_HOLD_S = 600.0  # re-predict after each touch before the next
LASER_BEHIND_KM = 150.0  # mean along-track trail of the ablation satellite
LASER_ELLIPSE_RADIAL_KM = 12.0  # safety-ellipse radial amplitude (x2 along-track)
BEAM_CLEARANCE_DEG = 0.10  # asset must be this far off the beam axis beyond the target
ABLATION_EXHAUST_KM_S = 10.0  # for the ablated-mass estimate (Phipps-class plasma velocity)


def circular_state(altitude_km: float, inclination_deg: float, node_deg: float, phase_s: float = 0.0) -> list[float]:
    state = m.initial(altitude_km, altitude_km, inclination_deg, node_deg)
    return m.propagate(state, phase_s) if phase_s else state


def period_s(a_km: float) -> float:
    return 2 * math.pi * math.sqrt(a_km**3 / m.MU)


def relative_rtn(reference: list[float], other: list[float]) -> tuple[float, float, float]:
    """Position of ``other`` relative to ``reference`` in km: radial (up),
    along-track (velocity direction), cross-track."""
    r = reference[:3]
    v = reference[3:]
    radial = m.unit(r)
    normal = m.unit(m.cross(r, v))
    along = m.cross(normal, radial)
    d = m.add(other[:3], r, -1.0)
    return m.dot(d, radial), m.dot(d, along), m.dot(d, normal)


def closest_approach(a: list[float], b: list[float], horizon_s: float, step_s: float = 10.0) -> tuple[float, float, list[float], list[float]]:
    """Propagate both states under gravity and return (time, miss km, state_a, state_b) at the minimum range."""
    best = (0.0, m.norm(m.add(a[:3], b[:3], -1.0)), list(a), list(b))
    t = 0.0
    while t < horizon_s:
        a = m.propagate(a, step_s)
        b = m.propagate(b, step_s)
        t += step_s
        d = m.norm(m.add(a[:3], b[:3], -1.0))
        if d < best[1]:
            best = (t, d, list(a), list(b))
    return best


def beam_clearance_deg(laser: list[float], target: list[float], asset: list[float]) -> float:
    """Angle between the beam axis (laser -> target) and the direction to the asset."""
    beam = m.unit(m.add(target[:3], laser[:3], -1.0))
    to_asset = m.unit(m.add(asset[:3], laser[:3], -1.0))
    return math.degrees(math.acos(max(-1.0, min(1.0, m.dot(beam, to_asset)))))


def build() -> dict[str, Any]:
    a_km = m.RADIUS + ALTITUDE_KM
    orbit_period = period_s(a_km)
    speed = math.sqrt(m.MU / a_km)

    # Asset: circular reference orbit.
    asset0 = circular_state(ALTITUDE_KM, INCLINATION_DEG, NODE_DEG)
    # Intruder: trails the asset along-track, slightly lower so it catches up at
    # CLOSING_PER_ORBIT_KM per orbit (drift = 3*pi*da per orbit), with a small
    # radial offset so the unperturbed closest approach is tens of metres.
    da_km = CLOSING_PER_ORBIT_KM / (3 * math.pi)
    intruder0 = circular_state(ALTITUDE_KM - da_km, INCLINATION_DEG, NODE_DEG, phase_s=-INITIAL_GAP_KM / speed)
    # Geometric residual miss: tilt the plane by a few metres' worth of inclination.
    tilt = (MISS_RADIAL_M / 1000.0) / a_km
    intruder0 = [*m.rotate(intruder0[:3], m.unit(m.add(asset0[:3], [0, 0, 0])), tilt), *m.rotate(intruder0[3:], m.unit(asset0[:3]), tilt)]

    # Unperturbed conjunction.
    horizon = (TCA_ORBITS + 1.0) * orbit_period
    tca_s, miss0_km, _, _ = closest_approach(list(asset0), list(intruder0), horizon)
    tca_refined = closest_approach(m.propagate(list(asset0), tca_s - 120), m.propagate(list(intruder0), tca_s - 120), 240, 1.0)
    tca_s = tca_s - 120 + tca_refined[0]
    miss0_km = tca_refined[1]

    # Ablation satellite: same period, mean position LASER_AHEAD_KM ahead, on a
    # safety ellipse (natural 2:1 relative motion) around that point.
    behind = m.propagate(list(intruder0), -LASER_BEHIND_KM / speed)
    r_apogee = a_km + LASER_ELLIPSE_RADIAL_KM
    laser0 = [
        *m.scale(m.unit(behind[:3]), r_apogee),
        *m.scale(m.unit(behind[3:]), math.sqrt(m.MU * (2 / r_apogee - 1 / a_km))),
    ]  # same semi-major axis as the asset (same period), starting at apogee
    # Sun: dawn-dusk plane assumption, 90 deg from the node, in the equator.
    sun = m.unit([math.cos(math.radians(NODE_DEG + 90)), math.sin(math.radians(NODE_DEG + 90)), -0.08])

    duration = math.ceil((tca_s + orbit_period * 0.6) / CADENCE) * CADENCE
    design = m.LASER_DESIGN

    # State
    asset, intruder, laser = list(asset0), list(intruder0), list(laser0)
    baseline_intruder = list(intruder0)
    samples: list[dict[str, Any]] = []
    touches: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    predictions: list[dict[str, Any]] = []
    dv_total = 0.0
    dv_retro = 0.0
    energy_on_target = 0.0
    emitted = 0.0
    pulses = 0.0
    firing_s = 0.0
    touch_open: dict[str, Any] | None = None
    hold_until = 0.0
    campaign_done = False
    predicted_miss_km = miss0_km
    status = "ASSESS"
    reason = "initial conjunction assessment"
    last_logged = ""

    def predict(t: float) -> tuple[float, float, float]:
        """Gravity-only prediction from the current states: (time of minimum
        separation, minimum separation km, separation at the original TCA km)."""
        remaining = max(0.0, tca_s - t)
        a_now, b_now = list(asset), list(intruder)
        c = closest_approach(list(a_now), list(b_now), remaining + 600.0, 10.0)
        a_fine = m.propagate(list(a_now), max(0.0, c[0] - 15))
        b_fine = m.propagate(list(b_now), max(0.0, c[0] - 15))
        f = closest_approach(a_fine, b_fine, 30, 1.0)
        a_tca = m.propagate(list(a_now), remaining)
        b_tca = m.propagate(list(b_now), remaining)
        at_tca = m.norm(m.add(a_tca[:3], b_tca[:3], -1.0))
        return t + max(0.0, c[0] - 15) + f[0], f[1], at_tca

    def log(t: float, kind: str, message: str) -> None:
        events.append({"t": t, "type": kind, "message": message})

    # Initial assessment
    tca_pred, predicted_miss_km, predicted_at_tca_km = predict(0.0)
    predictions.append({"t": 0.0, "tcaS": tca_pred, "missKm": predicted_miss_km, "atTcaKm": predicted_at_tca_km, "touches": 0})
    log(0.0, "ASSESS", f"Unperturbed closest approach in {tca_pred / 3600:.1f} h at {predicted_miss_km * 1000:.0f} m; floor {SAFETY_FLOOR_KM:.0f} km, re-open to {SCREENING_MISS_KM * MARGIN:.2f} km by that epoch")

    steps = int(duration / STEP)
    for i in range(steps + 1):
        t = i * STEP
        extra_intruder = [0.0, 0.0, 0.0]
        firing = False
        rng = m.norm(m.add(intruder[:3], laser[:3], -1.0))
        d_hat = m.unit(m.add(intruder[:3], laser[:3], -1.0))
        head_on = m.dot(d_hat, m.unit(intruder[3:]))  # prograde push alignment
        clearance = beam_clearance_deg(laser, intruder, asset)
        lit = m.sunlit(laser[:3], sun)
        pulse_j = rate_hz = power_on = 0.0
        if campaign_done:
            status, reason = "COAST", "threshold cleared; monitoring to closest approach"
        elif t < hold_until:
            status, reason = "HOLD", "re-assessing predicted miss after touch"
        elif rng > design["maxRangeKm"]:
            status, reason = "HOLD", "target beyond 300 km"
        elif rng < design["minRangeKm"]:
            status, reason = "HOLD", "target inside 60 km"
        elif head_on < design["minHeadOnCosine"]:
            status, reason = "HOLD", "beam not within 60° of target velocity (prograde push)"
        elif clearance < BEAM_CLEARANCE_DEG:
            status, reason = "HOLD", f"protected asset within {BEAM_CLEARANCE_DEG:.2f}° of the beam axis"
        elif not lit:
            status, reason = "HOLD", "laser in eclipse"
        else:
            firing = True
            status, reason = "TOUCH", ""
        if firing:
            if touch_open is None:
                touch_open = {"n": len(touches) + 1, "start": t, "dv0": dv_retro, "e0": energy_on_target,
                              "ranges": [], "cos": [], "clear": []}
                log(t, "TOUCH_START", f"Touch {touch_open['n']}: firing at {rng:.0f} km from behind, asset {clearance:.2f}° off the beam axis beyond the target")
            pulse_j, rate_hz, fluence = m.pulse_plan(rng)
            coupling = m.coupling_ns_per_j(fluence) * INTRUDER["recoil_efficiency"]
            fraction = design["pointingEfficiency"] * min(1.0, INTRUDER["area_m2"] / m.spot_area_m2(rng))
            power_out = pulse_j * rate_hz
            power_on = power_out * fraction
            force_n = coupling * power_on
            accel = force_n / INTRUDER["mass_kg"] / 1000.0
            extra_intruder = m.scale(d_hat, accel)
            dv_step = force_n / INTRUDER["mass_kg"] * STEP
            dv_total += dv_step
            dv_retro += dv_step * head_on
            energy_on_target += power_on * STEP
            emitted += power_out * STEP
            pulses += rate_hz * STEP
            firing_s += STEP
            touch_open["ranges"].append(rng)
            touch_open["cos"].append(head_on)
            touch_open["clear"].append(clearance)
            if t - touch_open["start"] + STEP >= TOUCH_MAX_S:
                firing_end = True
            else:
                firing_end = False
        else:
            firing_end = touch_open is not None
        if firing_end and touch_open is not None:
            end = t + (STEP if firing else 0.0)
            tca_pred, predicted_miss_km, predicted_at_tca_km = predict(end)
            touch = {
                "n": touch_open["n"],
                "start": touch_open["start"],
                "end": end,
                "durationS": end - touch_open["start"],
                "dvRetroMs": dv_retro - touch_open["dv0"],
                "dvCmS": (dv_retro - touch_open["dv0"]) * 100,
                "energyOnTargetJ": energy_on_target - touch_open["e0"],
                "meanRangeKm": sum(touch_open["ranges"]) / len(touch_open["ranges"]),
                "meanHeadOnCos": sum(touch_open["cos"]) / len(touch_open["cos"]),
                "minAssetClearanceDeg": min(touch_open["clear"]),
                "predictedMissAfterKm": predicted_miss_km,
                "predictedAtTcaKm": predicted_at_tca_km,
                "predictedTcaS": tca_pred,
            }
            touches.append(touch)
            predictions.append({"t": end, "tcaS": tca_pred, "missKm": predicted_miss_km, "atTcaKm": predicted_at_tca_km, "touches": len(touches)})
            log(end, "TOUCH_END", f"Touch {touch['n']} done: {touch['dvCmS']:.2f} cm/s prograde, {touch['energyOnTargetJ'] / 1000:.0f} kJ on target; predicted minimum {predicted_miss_km:.2f} km, {predicted_at_tca_km:.2f} km at the original TCA")
            touch_open = None
            hold_until = end + REASSESS_HOLD_S
            if predicted_miss_km >= SAFETY_FLOOR_KM and predicted_at_tca_km >= SCREENING_MISS_KM * MARGIN:
                campaign_done = True
                log(end, "CLEARED", f"Predicted minimum {predicted_miss_km:.2f} km ≥ {SAFETY_FLOOR_KM:.0f} km floor and {predicted_at_tca_km:.2f} km at the original TCA ≥ {SCREENING_MISS_KM * MARGIN:.2f} km; no further touches")
        key = status + reason
        if key != last_logged and status != "TOUCH":
            log(t, status, reason)
        last_logged = key

        if i % int(CADENCE / STEP) == 0:
            rr, aa, nn = relative_rtn(asset, intruder)
            lr, la, ln = relative_rtn(asset, laser)
            br, ba, bn = relative_rtn(asset, baseline_intruder)
            samples.append({
                "t": t,
                "asset": asset[:3], "intruder": intruder[:3], "laser": laser[:3],
                "intruderV": intruder[3:], "assetV": asset[3:], "laserV": laser[3:],
                "intruderRtnKm": [rr, aa, nn],
                "laserRtnKm": [lr, la, ln],
                "baselineRtnKm": [br, ba, bn],
                "rangeAssetIntruderKm": m.norm(m.add(asset[:3], intruder[:3], -1.0)),
                "rangeLaserIntruderKm": rng,
                "status": status,
                "reason": reason,
                "firing": firing,
                "pulseJ": pulse_j, "repHz": rate_hz, "powerOnTargetW": power_on,
                "dvRetroCmS": dv_retro * 100,
                "energyOnTargetJ": energy_on_target,
                "predictedMissKm": predicted_miss_km,
                "predictedAtTcaKm": predicted_at_tca_km,
                "sunlit": lit,
                "beamClearanceDeg": clearance,
            })
        if i == steps:
            break
        asset = m.rk4(asset, STEP)
        intruder = m.rk4(intruder, STEP, extra_intruder)
        baseline_intruder = m.rk4(baseline_intruder, STEP)
        laser = m.rk4(laser, STEP)

    # Actual closest approaches in the integrated run (perturbed vs baseline).
    actual = min(samples, key=lambda s: s["rangeAssetIntruderKm"])
    baseline_min = min(samples, key=lambda s: m.norm(s["baselineRtnKm"]))
    ablated_mass_mg = energy_on_target * design["couplingNsPerJ"] * INTRUDER["recoil_efficiency"] / (ABLATION_EXHAUST_KM_S * 1000.0) * 1e6
    fluence_j_cm2 = design["optimumFluenceJM2"] / 1e4
    summary = {
        "scenario": "COSMOS 2612 / ICEYE-X36 stand-in, representative 545 km sun-synchronous orbit",
        "orbitPeriodS": orbit_period,
        "unperturbedTcaS": tca_s,
        "unperturbedMissM": miss0_km * 1000.0,
        "screeningMissKm": SCREENING_MISS_KM,
        "safetyFloorKm": SAFETY_FLOOR_KM,
        "margin": MARGIN,
        "touches": len(touches),
        "firingS": firing_s,
        "pulses": round(pulses),
        "emittedJ": emitted,
        "energyOnTargetJ": energy_on_target,
        "dvTotalCmS": dv_total * 100,
        "dvRetroCmS": dv_retro * 100,
        "finalPredictedMissKm": predicted_miss_km,
        "finalPredictedAtTcaKm": predicted_at_tca_km,
        "separationAtOriginalTcaKm": next(s["rangeAssetIntruderKm"] for s in samples if s["t"] >= tca_s),
        "integratedMinRangeKm": actual["rangeAssetIntruderKm"],
        "integratedMinRangeAtS": actual["t"],
        "baselineMinRangeKm": m.norm(baseline_min["baselineRtnKm"]),
        "baselineMinRangeAtS": baseline_min["t"],
        "ablatedMassMg": ablated_mass_mg,
        "fluencePerPulseJCm2": fluence_j_cm2,
        "spotDiameterMAt150Km": m.SPOT_FACTOR * 150_000.0,
        "intruderSemiMajorAxisChangeM": (m.elements(intruder)["a"] - m.elements(baseline_intruder)["a"]) * 1000.0,
        "laserPropellantKg": 0.0,
    }
    return {
        "schemaVersion": "conjunction-response-1",
        "title": "Minimal-touch ablation response to an uncooperative co-orbital approach",
        "epochLabel": "Configured epoch; representative orbits, not an element set",
        "stepSeconds": CADENCE,
        "integratorStepSeconds": STEP,
        "durationSeconds": duration,
        "sunDirection": sun,
        "parameters": {
            "altitudeKm": ALTITUDE_KM, "inclinationDeg": INCLINATION_DEG, "nodeDeg": NODE_DEG,
            "initialGapKm": INITIAL_GAP_KM, "closingPerOrbitKm": CLOSING_PER_ORBIT_KM,
            "touchMaxS": TOUCH_MAX_S, "reassessHoldS": REASSESS_HOLD_S,
            "laserBehindKm": LASER_BEHIND_KM, "laserEllipseRadialKm": LASER_ELLIPSE_RADIAL_KM,
            "screeningMissKm": SCREENING_MISS_KM, "safetyFloorKm": SAFETY_FLOOR_KM, "margin": MARGIN,
            "beamClearanceDeg": BEAM_CLEARANCE_DEG, "exhaustKmS": ABLATION_EXHAUST_KM_S,
        },
        "bodies": {"asset": ASSET, "intruder": INTRUDER, "laser": {"id": "las-1", "name": "LAS-1 Shepherd", "massKg": design["busMassKg"]}},
        "laserDesign": design,
        "summary": summary,
        "touches": touches,
        "predictions": predictions,
        "events": events,
        "samples": samples,
        "limits": [
            "Representative orbits from published figures (545 km, 97.8°, ~5 km station-keeping, tens-of-metres predicted miss); no element set, epoch or spacecraft design is represented.",
            "Intruder treated as uncooperative and non-manoeuvring during the response; a cooperative or actively manoeuvring spacecraft can undo any nudge.",
            "Ablation coupling 50 µN·s/J × 0.6 surface-normal efficiency at optimum fluence; energy on target follows spot-to-area ratio × 0.7 pointing efficiency. Assumptions, not measurements.",
            "Surface effect is estimated from momentum coupling and a 10 km/s plasma velocity; it says nothing about which surface is hit. Optics, radiators and solar cells are damaged at far lower fluence than structure.",
            "Beam safety is a single angular clearance rule for the protected asset; no model of pointing jitter distribution, other traffic, or ground illumination.",
            "Gravity: point mass plus J2 at 1 s RK4; no drag, radiation pressure or attitude dynamics. Predictions are gravity-only propagation without tracking error; the margin factor stands in for covariance.",
            "Closest-approach distances are geometric; no collision probability is computed.",
        ],
    }


def rounded(value: Any, digits: int = 5) -> Any:
    if isinstance(value, float):
        return round(value, digits)
    if isinstance(value, list):
        return [rounded(x, digits) for x in value]
    if isinstance(value, dict):
        return {k: rounded(x, digits) for k, x in value.items()}
    return value


if __name__ == "__main__":
    scene = build()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(rounded(scene), separators=(",", ":"), allow_nan=False))
    s = scene["summary"]
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes), {len(scene['samples'])} samples")
    print(json.dumps(rounded(s, 4), indent=2))
    for touch in scene["touches"]:
        print(f"  touch {touch['n']}: T+{touch['start'] / 3600:5.2f} h  {touch['durationS']:.0f} s  {touch['dvCmS']:.2f} cm/s  {touch['energyOnTargetJ'] / 1000:.0f} kJ  range {touch['meanRangeKm']:.0f} km  cos {touch['meanHeadOnCos']:.2f}  clearance {touch['minAssetClearanceDeg']:.2f}°  min→ {touch['predictedMissAfterKm']:.2f} km  atTCA→ {touch['predictedAtTcaKm']:.2f} km")
    for e in scene["events"]:
        print(f"  {e['t'] / 3600:6.2f} h {e['type']:<12} {e['message']}")
