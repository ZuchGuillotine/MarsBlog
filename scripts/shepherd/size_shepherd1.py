"""Sizing checks for Shepherd-1, the ESPA-Grande-class laser-ablation pathfinder.

Standard library only. Reuses the laser model of
``scripts/orbits/build_laser_ablation_scene.py`` (Phipps optimum fluence,
spot = 2.44 M^2 lambda R / D, momentum coupling at optimum fluence) at the
pathfinder's scale. Run from the repository root:

    python3 scripts/shepherd/size_shepherd1.py

Writes docs/shepherd-1/sizing.json and prints a summary. Everything here is a
first-order budget for a pitch-stage design, not a flight analysis.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/shepherd-1/sizing.json"

MU = 398_600.4418  # km^3/s^2
RE = 6_378.137  # km
G0 = 9.80665
SIGMA = 5.670374419e-8
SOLAR = 1361.0  # W/m^2

# ---------------------------------------------------------------- laser
LASER = {
    "wavelength_m": 343e-9,         # frequency-tripled Yb (1030 nm / 3)
    "pulse_duration_s": 1.0e-9,     # 1 ns: no pulse compressor; direct lab analogue (HiLASE Bivoj THG, 50 J @ 10 Hz @ 343 nm)
    "aperture_m": 0.45,             # SiC primary, Cassegrain afocal expander
    "beam_quality_m2": 1.5,
    "uv_average_power_w": 200.0,    # pathfinder class (article production unit: 3,300 W)
    "max_pulse_energy_j": 20.0,     # 20 J UV from ~45 J at 1030 nm
    "max_rep_rate_hz": 10.0,
    "min_rep_rate_hz": 1.0,
    "wall_plug_ir": 0.20,           # electrical -> 1030 nm for a J-class multi-slab Yb:YAG (DiPOLE/Bivoj class "approaching 20%")
    "thg_efficiency": 0.50,         # 1030 -> 343 nm in LBO at ns, J-class (Bivoj: 53-63%)
    "pointing_efficiency": 0.7,     # as in the article model
    "coupling_ns_per_j": 50e-6,     # middle case; 25 and 100 bracket
}
LASER["optimum_fluence_j_m2"] = 8.5e8 * math.sqrt(LASER["pulse_duration_s"])  # Phipps scaling
LASER["wall_plug_uv"] = LASER["wall_plug_ir"] * LASER["thg_efficiency"]
LASER["electrical_input_w"] = LASER["uv_average_power_w"] / LASER["wall_plug_uv"]
LASER["waste_heat_w"] = LASER["electrical_input_w"] - LASER["uv_average_power_w"]
SPOT_FACTOR = 2.44 * LASER["beam_quality_m2"] * LASER["wavelength_m"] / LASER["aperture_m"]


def spot_diameter_m(range_km: float) -> float:
    return SPOT_FACTOR * range_km * 1_000.0


def pulse_plan(range_km: float) -> dict[str, float]:
    area = math.pi * (spot_diameter_m(range_km) / 2) ** 2
    energy = min(LASER["max_pulse_energy_j"], LASER["optimum_fluence_j_m2"] * area)
    rate = min(LASER["max_rep_rate_hz"], LASER["uv_average_power_w"] / energy)
    fluence = energy / area
    return {
        "range_km": range_km,
        "spot_cm": spot_diameter_m(range_km) * 100,
        "pulse_j": energy,
        "rate_hz": rate,
        "average_w": energy * rate,
        "fluence_fraction": fluence / LASER["optimum_fluence_j_m2"],
    }


# Range at which the 30 J cap meets optimum fluence (the useful working range)
def optimum_range_km() -> float:
    area = LASER["max_pulse_energy_j"] / LASER["optimum_fluence_j_m2"]
    d = 2 * math.sqrt(area / math.pi)
    return d / SPOT_FACTOR / 1_000.0


# -------------------------------------------------------------- targets
def dv_to_perigee(alt_km: float, perigee_km: float = 200.0) -> float:
    """Retrograde impulse (m/s) from a circular orbit to the given perigee."""
    r1 = RE + alt_km
    r2 = RE + perigee_km
    v_circ = math.sqrt(MU / r1)
    a = (r1 + r2) / 2
    v_apo = math.sqrt(MU * (2 / r1 - 1 / a))
    return (v_circ - v_apo) * 1_000.0


def firing_time_h(mass_kg: float, dv_ms: float, power_on_target_w: float,
                  coupling: float = LASER["coupling_ns_per_j"]) -> float:
    energy_j = mass_kg * dv_ms / coupling
    return energy_j / power_on_target_w / 3_600.0


# -------------------------------------------------------------- thermal
def radiator_area_m2(heat_w: float, t_k: float = 300.0, emissivity: float = 0.88,
                     sink_w_m2: float = 60.0) -> float:
    """Area needed to reject heat_w at t_k with an absorbed environmental sink
    (Earth IR + albedo on a panel that sees Earth at the horizon)."""
    net = emissivity * SIGMA * t_k**4 - sink_w_m2
    return heat_w / net


# ---------------------------------------------------------------- power
def array_area_m2(power_w: float, cell_eff: float = 0.30, packing: float = 0.85,
                  eol_factor: float = 0.85, cos_loss: float = 0.94) -> float:
    return power_w / (SOLAR * cell_eff * packing * eol_factor * cos_loss)


# ----------------------------------------------------------- propulsion
def propellant_kg(mass_kg: float, dv_ms: float, isp_s: float) -> float:
    return mass_kg * (1 - math.exp(-dv_ms / (isp_s * G0)))


def plane_change_ms(alt_km: float, deg: float) -> float:
    v = math.sqrt(MU / (RE + alt_km)) * 1_000.0
    return 2 * v * math.sin(math.radians(deg) / 2)


def j2_nodal_rate_deg_day(alt_km: float, inc_deg: float) -> float:
    a = RE + alt_km
    n = math.sqrt(MU / a**3)
    j2 = 1.08262668e-3
    rate = -1.5 * n * j2 * (RE / a) ** 2 * math.cos(math.radians(inc_deg))
    return math.degrees(rate) * 86_400


def main() -> None:
    ranges = [3, 5, 8, 10, 12, 15, 20, 30, 50]
    plans = [pulse_plan(r) for r in ranges]
    r_opt = optimum_range_km()
    power_on_target = LASER["uv_average_power_w"] * LASER["pointing_efficiency"] * 0.7  # 0.7 surface-normal
    targets = []
    for name, mass, alt in [
        ("10 g insulation flake", 0.010, 800),
        ("1 kg bracket", 1.0, 800),
        ("10 kg fragment", 10.0, 800),
        ("50 kg fragment", 50.0, 800),
        ("150 kg microsat carcass", 150.0, 800),
        ("1 t dead satellite (production unit job)", 1_000.0, 800),
    ]:
        dv = dv_to_perigee(alt)
        hours = firing_time_h(mass, dv, power_on_target)
        targets.append({
            "target": name, "mass_kg": mass, "from_alt_km": alt, "dv_ms": round(dv, 1),
            "firing_hours_at_50uNs_per_J": round(hours, 2),
            "firing_days_at_45pct_duty": round(hours / 24 / 0.45, 2),
            "firing_days_at_25uNs_per_J": round(2 * hours / 24 / 0.45, 2),
        })

    thermal = {
        "laser_waste_heat_w": round(LASER["waste_heat_w"]),
        "bus_and_payload_electronics_w": 450,
        "total_rejected_w": round(LASER["waste_heat_w"] + 450),
        "radiator_temperature_k": 300,
        "net_rejection_w_m2": round(0.88 * SIGMA * 300**4 - 60),
        "radiator_area_needed_m2": round(radiator_area_m2(LASER["waste_heat_w"] + 450), 1),
        "body_radiator_area_m2": 0.9,
        "deployable_radiator_panels": {"count": 2, "size_m": [2.0, 0.85], "two_sided_area_m2": 6.8},
    }
    power_firing = {
        "laser_electrical_w": round(LASER["electrical_input_w"]),
        "payload_sensors_processing_w": 180,
        "bus_w": 320,
        "thermal_pumps_heaters_w": 120,
        "total_firing_w": round(LASER["electrical_input_w"] + 180 + 320 + 120),
    }
    power_thrusting = {"hall_thruster_w": 650, "bus_w": 320, "thermal_w": 80, "total_w": 1_050}
    array = {
        "eol_power_needed_w": power_firing["total_firing_w"] + 300,
        "area_needed_m2": round(array_area_m2(power_firing["total_firing_w"] + 300), 1),
        "wings": 2, "type": "roll-out blanket (ROSA class)", "wing_m": [1.1, 5.0],
        "installed_area_m2": round(2 * 1.1 * 5.0, 1),
        "bol_power_w": round(2 * 1.1 * 5.0 * SOLAR * 0.30 * 0.85 * 0.94),
        "eol_power_w": round(2 * 1.1 * 5.0 * SOLAR * 0.30 * 0.85 * 0.94 * 0.85),
    }

    wet_mass = 480.0
    isp = 1_500.0
    dv_budget = {
        "deorbit_750_to_200km_perigee_impulsive_ms": round(dv_to_perigee(750), 1),
        "deorbit_low_thrust_spiral_750_to_300km_ms": round(
            (math.sqrt(MU / (RE + 300)) - math.sqrt(MU / (RE + 750))) * 1_000, 1),
        "plane_change_1deg_at_750km_ms": round(plane_change_ms(750, 1.0), 1),
        "altitude_change_50km_ms": round(
            (math.sqrt(MU / (RE + 750)) - math.sqrt(MU / (RE + 800))) * 1_000, 1),
        "formation_keeping_5yr_ms": 40.0,
        "collision_avoidance_5yr_ms": 15.0,
        "margin_ms": 60.0,
    }
    dv_budget["total_ms"] = round(
        dv_budget["deorbit_low_thrust_spiral_750_to_300km_ms"] * 1.1
        + dv_budget["plane_change_1deg_at_750km_ms"]
        + 2 * dv_budget["altitude_change_50km_ms"]
        + dv_budget["formation_keeping_5yr_ms"]
        + dv_budget["collision_avoidance_5yr_ms"]
        + dv_budget["margin_ms"], 1)
    propellant = {
        "wet_mass_kg": wet_mass, "isp_s": isp,
        "propellant_for_budget_kg": round(propellant_kg(wet_mass, dv_budget["total_ms"], isp), 1),
        "propellant_loaded_kg": 24.0,
        "disposal_reserve_locked_kg": round(propellant_kg(wet_mass, dv_budget["deorbit_low_thrust_spiral_750_to_300km_ms"] * 1.1, isp), 1),
        "thrust_mN": 35.0,
        "deorbit_burn_time_days_continuous": round(
            dv_budget["deorbit_low_thrust_spiral_750_to_300km_ms"] * 1.1 * wet_mass / 0.035 / 86_400, 1),
    }
    j2 = {
        "nodal_rate_deg_day_750km_97.6deg": round(j2_nodal_rate_deg_day(750, 97.6), 4),
        "nodal_rate_deg_day_800km_97.6deg": round(j2_nodal_rate_deg_day(800, 97.6), 4),
        "relative_drift_deg_year_50km_below": round(
            (j2_nodal_rate_deg_day(750, 97.6) - j2_nodal_rate_deg_day(800, 97.6)) * 365.25, 2),
        "relative_drift_deg_year_50km_below_53deg": round(
            (j2_nodal_rate_deg_day(500, 53) - j2_nodal_rate_deg_day(550, 53)) * 365.25, 2),
    }
    pointing = {
        "spot_cm_at_10km": round(spot_diameter_m(10) * 100, 1),
        "hold_half_spot_urad_at_10km": round(spot_diameter_m(10) / 2 / 10_000 * 1e6, 1),
        "bus_pointing_1sigma_urad_typ_espa": 35.0,  # ~0.002 deg class bus
        "fine_steering_mirror_range_urad": 5_000.0,
        "fine_steering_bandwidth_hz": 800.0,
    }
    out = {
        "laser": LASER | {"optimum_fluence_j_m2": round(LASER["optimum_fluence_j_m2"]),
                          "working_range_km_at_max_pulse": round(r_opt, 1)},
        "pulse_plans": plans,
        "power_on_target_w": round(power_on_target),
        "targets": targets,
        "thermal": thermal,
        "power_firing": power_firing,
        "power_thrusting": power_thrusting,
        "array": array,
        "dv_budget": dv_budget,
        "propellant": propellant,
        "j2": j2,
        "pointing": pointing,
    }
    OUT.write_text(json.dumps(out, indent=2) + "\n")
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
