# Laser ablation campaign simulation

> **Retired public implementation (2026-09-22).** The public
> `/orbit/laser-ablation` route, UI component, and precomputed scene and manifest
> assets have been retired. This document, the builder and verification scripts,
> and their recorded checks remain only as historical audit references; the
> implementation and output descriptions below do not describe retained current
> outputs. The published simulator is
> <https://orbitfleet.populationmars.com/debris>.

Historical implementation references: component
`src/components/LaserAblationSim.tsx` (removed) · data
`public/data/orbits/laser-ablation-scene.json` (removed; formerly 1.97 MB raw,
0.73 MB gzip) · builder: `scripts/orbits/build_laser_ablation_scene.py` · checks:
`scripts/orbits/verify_laser_ablation_scene.py` →
`docs/laser-ablation-checks.json`.

## Scope

Three proposed laser-ablation satellites from *The Case for Attack Satellites*
(sections 6–8) fly through the fictional debris field of OrbitFleet's debris
outgassing replay for six hours. The scene shows every engagement attempt, the
orbital change it causes, whether the shot was taken or refused and why, and a
projected timeline to a 200 km perigee for each target. It is a configured
engineering scenario at a fictional epoch with approximate physics. No real
object, flight design, tracking data or validated ablation measurement is
represented.

The builder is standard-library Python, deterministic, and runs in about ten
seconds. It is independent of OrbitFleet's code but reproduces its seven debris
bodies exactly: the verification compares the gravity-only baselines against
OrbitFleet's `debris-demo.json` and finds a maximum difference of 8 cm over two
hours (the two builders use 1 s and 2 s RK4 steps respectively).

## Bodies

| Object | Initial orbit | Mass | Area | Notes |
| --- | --- | --- | --- | --- |
| Fragments A–E, derelict spacecraft, spent rocket stage | as in OrbitFleet (600×640 km 53° … 650×1800 km 64.8°) | 40–2,000 kg | 0.4–12 m² | identical initial states and colours |
| Fragment F (insulation flake) | 759×846 km, 53° | 10 g | 100 cm² | added; placed to cross the sweeper head-on at T+80 min |
| Fragment G (bracket) | 600×645 km, 72° | 1.2 kg | 300 cm² | added; placed to cross head-on at T+140 min |
| Fragment H (fastener) | 864×874 km, 98° | 5 g | 10 cm² | added; shallow crossing from behind and below at T+210 min, which the rules must refuse |
| LAS-1 Shepherd | co-planar with the derelict, 160 km ahead | 2.3 t | — | 82° family |
| LAS-2 Shepherd | co-planar with the spent stage, 180 km ahead | 2.3 t | — | 65° family |
| LAS-3 Sweeper | 639×768 km, 98.0°, dawn-dusk plane | 2.3 t | — | placed so Fragment A approaches it head-on at T+40 min |

The three small fragments are additions to OrbitFleet's set. They exist because
the sweeper's single-pass behaviour cannot be shown on tonne- or 100 kg-class
bodies, and because the article's case rests partly on the 1–10 cm population.
They are placed by back-propagating a designed encounter state under J2, so the
designed geometry holds exactly until the first shot perturbs it.

## Physics

**Gravity and integration.** Point mass plus J2 (μ = 398 600.4418 km³/s²,
R = 6378.137 km, J2 = 1.08262668e-3), RK4 at 1 s with control decisions
frozen per step, 30 s export cadence, six-hour window. No drag, radiation
pressure, third bodies, attitude dynamics or mass loss.

**Laser.** 343 nm, 100 ps pulses, 3.3 kW average ultraviolet, ≤ 700 J per
pulse, 1–30 Hz, 1 m aperture, M² = 1.5. Spot diameter is 2.44·M²·λ·R/D. Pulse
energy is set to the Phipps optimum fluence (8.5 kJ/m² at 100 ps) times the spot
area, capped at 700 J, and the repetition rate to the 3.3 kW budget capped at
30 Hz. This reproduces the article's anchors: 658 J at 250 km and 2.63 kJ at
500 km. Beyond 258 km the 700 J cap leaves fluence below optimum; at short range
the 30 Hz cap limits average power (1.3 kW at 60 km).

**Coupling.** 50 µN·s per joule on target at optimum fluence (article middle
case; the projections also report 25 and 100), ramping linearly to zero at 25 %
of optimum fluence. Energy on target is a pointing efficiency of 0.7 times the
fraction of the spot covered by the target's projected area. The recoil force is
coupling × power on target, directed along the beam, scaled by a per-body
surface-normal efficiency (0.7 fragments, 0.6 derelict, 0.8 stage) standing in
for tumbling and surface orientation. Mass loss is ignored (micrograms per pulse).

**Firing rules** (article: "fire only on targets that are approaching, from
ahead"):

- range 60–300 km;
- beam within 60° of the target's anti-velocity (head-on cosine ≥ 0.5);
- sweeper: target approaching (range rate negative);
- shepherd: fire only on the apogee half of an eccentric target orbit (r > a),
  because a retrograde impulse lowers the opposite apsis;
- laser sunlit (firing is suspended in eclipse rather than drawing the pack);
- line of sight at least 100 km above the reference sphere.

**Shepherd formation keeping.** Lowering the target shortens its period, so it
closes on the shepherd ahead of it. The shepherd's 170 mN argon Hall thruster
(2,500 s, 150 kg) fires retrograde whenever the target's cumulative retrograde
Δv exceeds the shepherd's own by 0.05 m/s, or the gap closes below 110 km, and
latches off when matched. The formation stays within 145–180 km throughout and
each shepherd spends about 0.1 kg of argon in six hours.

**Projections.** Retrograde Δv still needed is the apogee-impulse value that
brings perigee to 200 km (checked against the article: 99, 164, 214 and 261 m/s
from 550, 800, 1,000 and 1,200 km circular). Shepherd targets extrapolate the
measured Δv per firing hour at the observed duty. Sweeper targets extrapolate Δv
per pass with a random-phase encounter model of two orbit crossings per sweeper
orbit and a 600 km window. The atmospheric decay tail after reaching a 200 km
perigee is a King-Hele orbit-averaged estimate with a static exponential
atmosphere (2.5e-10 kg/m³ at 200 km, 37 km scale height, Cd = 2.2); solar
activity changes it several-fold.

**Outcomes.** SUCCESS: perigee ≤ 200 km after the segment. EFFECTIVE: a
shepherd segment whose rate projects ≤ 180 days, or a sweeper pass delivering
≥ 2 % of the Δv still needed. PARTIAL: measurable but below those thresholds.
INEFFECTIVE: below 0.1 %. ABORTED: an opportunity that entered 300 km without a
shot, tagged with the rule that blocked it most.

## Findings within the model

| | |
| --- | --- |
| Engagements logged | 25 (12 effective, 6 partial, 5 ineffective, 2 refused) |
| LAS-1 on the 600 kg derelict | 0.42 m/s per firing hour, 49 % duty, 1.24 m/s in six hours; 180 m/s still needed → ~36 days at 50 µN·s/J (73 / 18 at 25 / 100), then ≈ 130 days of decay from 200×1,484 km |
| LAS-2 on the 2,000 kg stage | 0.17 m/s per firing hour, 50 % duty, 0.50 m/s in six hours; 117 m/s still needed → ~59 days (118 / 30), then ≈ 300 days of decay from 200×1,783 km |
| LAS-3 on the 10 g flake | 48 and 43 m/s in the two best passes (16–18 s each); perigee 759 → 582 km; one more pass projected, ~15 days of waiting at random phasing |
| LAS-3 on the 1.2 kg bracket | 0.2–0.7 m/s per pass; marginal for a sweeper, ~2 years at random phasing |
| LAS-3 on 100 kg Fragment A | 0.001–0.013 m/s per pass; ineffective, reassign to a shepherd |
| Refusals | Fragment H (shallow crossing from behind) and one later pass on Fragment F, both on geometry |

The shepherd numbers sit where the article's energy budget puts them (23 days
for a 1 t satellite from 800 km at 1.65 kW on target, without the apogee-half
and eclipse duty). The sweeper numbers are more conservative than the article's
"10 g in one pass" because energy on target follows the spot-to-target area
ratio rather than a fixed 50 %.

## Verification

`verify_laser_ablation_scene.py` (results in `docs/laser-ablation-checks.json`):

- J2 acceleration versus finite-difference potential gradient: 1.1e-12 km/s².
- Gravity-only J2-inclusive energy drift over six hours: 2.0e-14 relative.
- Step halving (1 s vs 0.5 s) over two hours: 1.2e-9 km.
- Encounter design round trip (forward then back 4,800 s): 8.4e-12 km.
- Pulse plan anchors 658 J / 2.63 kJ; rate ≤ 30 Hz and power ≤ 3.3 kW at all ranges.
- Apogee-impulse Δv anchors within 1 m/s of the article's four values.
- Every non-aborted segment has head-on cosine ≥ 0.5, mean range within 60–300 km,
  mean power on target ≤ 2.31 kW, and lowers the target's J2-inclusive energy.
- Untouched bodies match their baselines exactly; no body ends with a raised perigee.
- Emitted energy ≤ 3.3 kW × firing time; propellant within the 150 kg tank.
- Shared baselines versus OrbitFleet `debris-demo.json`: 8.3e-5 km maximum difference.

## Reproduce

```sh
python3 scripts/orbits/build_laser_ablation_scene.py
ORBITFLEET_DEBRIS_JSON=/path/to/orbitfleet/web/public/data/debris-demo.json \
  python3 scripts/orbits/verify_laser_ablation_scene.py
npm run type-check && npm run build
```

## Known limits

Listed in the scene's `limits` array and shown on the page. The most important:
coupling, threshold and pointing efficiency are assumptions; there is no
sensor, tracking error or scheduling model; the projections are linear
extrapolations of six hours; and the decay tail uses a static atmosphere.
Porting the three satellites into OrbitFleet's `DebrisApp` would need the
engagement controller added to `outgassing.py` or a sibling module; the JSON
here is self-contained and does not depend on that.
