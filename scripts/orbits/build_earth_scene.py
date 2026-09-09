"""Build the deterministic Earth scene from OrbitFleet's designed adapter.

The output contains simulator truth samples for visualization. It is not received
telemetry and does not imply that the hypothetical spacecraft are tracked.
"""

from __future__ import annotations

import asyncio
import json
import math
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ORBITFLEET_ROOT = Path(
    os.environ.get("ORBITFLEET_REPO", ROOT.parent / "OrbitFleet")
).resolve()
OUTPUT = ROOT / "public/data/orbits/earth-scene.json"
EPOCH = datetime(2025, 1, 1, tzinfo=UTC)
SEED = 1701
FLEET_SIZE = 200
DURATION_SECONDS = 7_200
STEP_SECONDS = 30
EARTH_RADIUS_KM = 6_378.137
EARTH_MU_KM3_S2 = 398_600.4418
EARTH_ROTATION_RATE_RAD_S = 7.2921150e-5

# Keep the six configured service-path spacecraft and sample the rest evenly
# through the 200-object shell. Values are zero-based adapter indices.
DISTRIBUTED_INDICES = [round(6 + index * (FLEET_SIZE - 7) / 17) for index in range(18)]
SELECTED_INDICES = [*range(6), *DISTRIBUTED_INDICES]
COLORS = (
    "#62d9ff",
    "#7ce8c6",
    "#f2c66d",
    "#ff8f70",
    "#a991ff",
    "#83b7ff",
    "#46c7e8",
    "#64dba7",
    "#e9b858",
    "#f57868",
    "#927be0",
    "#6fa4e8",
)


def orbitfleet_commit() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=ORBITFLEET_ROOT,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def specific_energy(position: list[float], velocity: list[float]) -> float:
    radius = math.sqrt(sum(component * component for component in position))
    speed_squared = sum(component * component for component in velocity)
    return speed_squared / 2 - EARTH_MU_KM3_S2 / radius


async def build_scene() -> dict[str, Any]:
    sys.path.insert(0, str(ORBITFLEET_ROOT / "backend"))
    from orbitfleet.config import Settings
    from orbitfleet.ephemeris import EphemerisProvider
    from orbitfleet.satellite import SatelliteAdapter

    settings = Settings(
        _env_file=None,
        asset_count=FLEET_SIZE,
        nats_url="",
        openai_api_key="",
    )
    snapshot = EphemerisProvider(settings)._offline_shell(FLEET_SIZE)
    adapter = SatelliteAdapter("earth-scene", SEED, snapshot)
    adapter.started_unix = EPOCH.timestamp()
    await adapter.initialize()

    selected_ids = [f"SAT-{index + 1:03d}" for index in SELECTED_INDICES]
    positions = {asset_id: [] for asset_id in selected_ids}
    velocities = {asset_id: [] for asset_id in selected_ids}
    samples: list[dict[str, Any]] = []
    first_adapter_states = {
        asset_id: (
            list(adapter.asset(asset_id).position_km),
            list(adapter.asset(asset_id).velocity_km_s),
        )
        for asset_id in selected_ids
    }

    for sample_index in range(DURATION_SECONDS // STEP_SECONDS + 1):
        sample_time = sample_index * STEP_SECONDS
        if sample_index:
            await adapter.advance(sample_time, STEP_SECONDS)
        angle = EARTH_ROTATION_RATE_RAD_S * sample_time
        samples.append(
            {
                "timeSeconds": sample_time,
                "renderBodyQuaternion": [
                    0.0,
                    math.sin(angle / 2),
                    0.0,
                    math.cos(angle / 2),
                ],
            }
        )
        for asset_id in selected_ids:
            asset = adapter.asset(asset_id)
            positions[asset_id].append(list(asset.position_km))
            velocities[asset_id].append(list(asset.velocity_km_s))

    if len(samples) != 241 or [sample["timeSeconds"] for sample in samples] != list(
        range(0, DURATION_SECONDS + STEP_SECONDS, STEP_SECONDS)
    ):
        raise RuntimeError("sample timing is not the required inclusive 30-second grid")
    for asset_id in selected_ids:
        if positions[asset_id][0] != first_adapter_states[asset_id][0]:
            raise RuntimeError(
                f"first position does not match initialized adapter: {asset_id}"
            )
        if velocities[asset_id][0] != first_adapter_states[asset_id][1]:
            raise RuntimeError(
                f"first velocity does not match initialized adapter: {asset_id}"
            )
        initial_energy = specific_energy(
            positions[asset_id][0], velocities[asset_id][0]
        )
        maximum_drift = max(
            abs(specific_energy(position, velocity) - initial_energy)
            for position, velocity in zip(
                positions[asset_id], velocities[asset_id], strict=True
            )
        )
        if maximum_drift > 1e-5:
            raise RuntimeError(
                f"specific orbital energy drift exceeds validation bound for {asset_id}: "
                f"{maximum_drift:.12g} km^2/s^2"
            )

    objects = [
        {
            "id": asset_id,
            "name": adapter.asset(asset_id).name,
            "kind": "earth",
            "classification": "hypothetical",
            "color": COLORS[index % len(COLORS)],
            "positionsKm": positions[asset_id],
            "velocitiesKmS": velocities[asset_id],
        }
        for index, asset_id in enumerate(selected_ids)
    ]
    return {
        "epochUtc": EPOCH.isoformat().replace("+00:00", "Z"),
        "body": {
            "name": "Earth",
            "radiusKm": EARTH_RADIUS_KM,
            "muKm3S2": EARTH_MU_KM3_S2,
            "textureUrl": "/data/orbits/earth-blue-marble.png",
            "texturePrimeMeridianU": 0.5,
            "rotationRateRadS": EARTH_ROTATION_RATE_RAD_S,
        },
        "frame": {
            "name": "CONFIGURED_EARTH_CENTERED_INERTIAL",
            "description": (
                "Designed Earth reference frame; prime meridian +X at sample start; "
                "not tracked spacecraft"
            ),
            "axisMapping": "[x,z,-y]",
        },
        "durationSeconds": DURATION_SECONDS,
        "stepSeconds": STEP_SECONDS,
        "sunDirection": [1, 0, 0],
        "samples": samples,
        "objects": objects,
        "metadata": {
            "title": "Configured Earth fleet — two-hour simulator sample",
            "sources": [
                {
                    "label": "OrbitFleet designed two-body adapter",
                    "url": "https://github.com/ZuchGuillotine/orbitfleet",
                },
                {
                    "label": "Earth texture: NASA/GSFC Blue Marble composite",
                    "url": "https://svs.gsfc.nasa.gov/2915/",
                },
            ],
            "fidelity": (
                "Configured point-mass Earth trajectories sampled from simulation truth at "
                "30-second intervals; hypothetical spacecraft, not received telemetry or "
                "historical tracking data. Earth rotation uses a fixed-rate spherical model."
            ),
            "historicalPeriod": "Configured demo at fixed epoch; not historical measured orbits",
            "speedMultiplier": 60,
            "earthSource": {
                "label": "OrbitFleet source with required uncommitted causal-audit patch",
                "orbitFleetCommit": orbitfleet_commit(),
                "sourceVersion": "observatory-20260909",
                "requiresUncommittedAuditPatch": False,
                "seed": SEED,
                "fleetSize": FLEET_SIZE,
                "selectedAssetIds": selected_ids,
                "sampleSemantics": "simulation truth; not telemetry",
            },
        },
    }


async def main() -> None:
    scene = await build_scene()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(scene, separators=(",", ":")) + "\n")
    print(
        f"wrote {OUTPUT.relative_to(ROOT)}: {len(scene['objects'])} objects, "
        f"{len(scene['samples'])} samples, {scene['durationSeconds']} seconds"
    )


if __name__ == "__main__":
    asyncio.run(main())
