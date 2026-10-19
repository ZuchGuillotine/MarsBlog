# Minimal-touch ablation response: COSMOS 2612 / ICEYE-X36 stand-in

An offline run of the proposed ablation satellite against a stand-in for the
October 2026 incident in which COSMOS 2612 (NORAD 68762, ~500 kg, launched
April 2026) manoeuvred into the plane of ICEYE-X36 (NORAD 59103, ~90 kg,
545 km sun-synchronous) and station-kept within a few kilometres, with one
tracker predicting a 26 m closest approach on 19 October 16:07 UTC. The
question asked: if an uncooperative spacecraft parks itself on a collision
course, can the laser nudge it off that course with the least energy and the
least surface effect, without ever firing toward the protected satellite?

This is not a site feature. The files here are the run and its record:

| File | Content |
| --- | --- |
| `cosmos-2612-response.json` | full run: 30 s samples of all three bodies in the ICEYE-centred frame, every touch, every prediction, the event log, the summary |
| `cosmos-2612-response.mp4` | sped-up sequence (×300 during the touches, ×1800 after) with a live data panel, H.264 |
| `cosmos-2612-response.png` | end-of-run summary frame |
| `../../scripts/orbits/build_conjunction_response.py` | scenario and controller; imports the gravity, laser and coupling model unchanged from `build_laser_ablation_scene.py` |
| `../../scripts/orbits/render_conjunction_response.py` | renderer (numpy, matplotlib, ffmpeg) |

## Scenario

Element sets could not be fetched from this environment (tracking sites are
blocked by the sandbox proxy), so the orbits are representative, built from the
published figures: 545 km circular, 97.8°, both spacecraft in one plane, the
intruder 4.8 km behind the asset and catching up 0.5 km per orbit on a
53 m-lower orbit, with a residual geometric offset so that the unperturbed
closest approach is 54 m after 9.6 orbits (15.3 h). No real epoch, element
set or spacecraft design is represented.

The ablation satellite is the shepherd from the campaign scene (3.3 kW, 343 nm,
1 m aperture, 50 µN·s/J at optimum fluence, 0.7 pointing efficiency, 0.6
surface-normal efficiency for a boxy spacecraft). It flies a natural safety
ellipse (±12 km radial, ±24 km along-track, same period) centred 150 km
**behind** the intruder.

## Why the article's debris rule is inverted here

The campaign scene fires only from ahead so that recoil lowers perigee. That is
the right rule for removal and the wrong rule for this geometry. A first run
with the laser ahead of the intruder, pushing it retrograde, lowered its orbit
and made it catch ICEYE-X36 sooner: a 176 m fly-under six hours in. It also
placed the protected satellite between the laser and the target, where a
pointing fault would deliver the full beam.

From behind, each touch pushes the intruder prograde, raising its orbit by tens
of metres. That slows and then reverses the catch-up, the gap re-opens, and the
beam axis points away from the asset, which is 4.8 km beyond the target and
0.10–0.16° off axis because of the safety-ellipse offset. Raising an active
satellite by 100 m is not a debris concern; it is the point.

## Controller

- A touch is at most 90 s of firing. After each touch the controller holds
  10 minutes and re-predicts, under gravity only, the minimum separation over
  the rest of the window and the separation at the original closest-approach
  epoch.
- Firing requires 60–300 km range, beam within 60° of the target velocity
  (prograde), the laser sunlit, and ICEYE-X36 at least 0.10° off the beam axis
  beyond the target.
- The response stops when the predicted minimum is at least 2 km (safety
  floor) and the separation at the original epoch is at least 6.25 km (5 km
  screening distance × 1.25 margin for tracking uncertainty).

## Result

| | |
| --- | --- |
| Touches | 4, each 90 s, at T+0.00, 0.62, 0.81 and 1.00 h |
| Δv applied | 4.98 cm/s prograde, 1.24 cm/s per touch |
| Energy on target | 832 kJ (1.19 MJ emitted), about 5,200 pulses of 190–240 J at 12–16 Hz |
| Orbit change | semi-major axis +106 m; relative drift reversed from 0.5 km/orbit closing to about 0.3 km/orbit opening |
| Separation | never below 4.65 km (the closure during the first hour); 7.8 km at the original TCA instead of 54 m |
| Beam clearance | ICEYE-X36 between 0.10° and 0.16° off the beam axis beyond the target during every touch |
| Surface effect | ≈ 2.5 g ablated in total, in a ~19 cm spot at 0.85 J/cm² per pulse: a few tens of microns of structural surface if it is structure |
| Laser propellant | none; the safety ellipse is a natural relative orbit |

The touches are spaced by the ellipse geometry: between touches 1 and 2 the
laser's radial motion carries the beam axis within 0.10° of the asset and the
controller holds for 25 minutes.

Each touch moves the predicted separation at the original epoch by about
1.9 km, which is the expected 3 × Δv × time-to-epoch for an along-track nudge
applied 15 hours out. Acting a day earlier would have halved the energy; acting
an hour before the approach would have needed metres per second.

## What minimal damage means here

Momentum coupling and a 10 km/s plasma velocity put the ablated mass at
2.5 g for the whole response, spread over a 19 cm spot that moves across the
illuminated face as the geometry changes. On aluminium structure or thermal
blanket that is a cosmetic mark tens of microns deep. On a solar array, star
tracker, radiator or antenna it is damage, because those are harmed well below
0.85 J/cm². The run does not know which face is lit; a real response would need
an attitude estimate and a no-fire mask for the sensitive faces. That, not the
energy, is the limiting factor for "minimal damage".

## Limits

Listed in the JSON `limits` array. The most important: the intruder is assumed
not to manoeuvre during the response (a cooperative or active spacecraft can
undo a 5 cm/s nudge in seconds); coupling, pointing efficiency and the surface
efficiency are assumptions; predictions carry no tracking covariance, the 1.25
margin stands in for it; no collision probability is computed; no drag,
radiation pressure or attitude dynamics.

## Reproduce

```sh
python3 scripts/orbits/build_conjunction_response.py
python3 scripts/orbits/render_conjunction_response.py   # needs numpy, matplotlib, ffmpeg
```

## Sources for the scenario figures

- [Orbital Radar conjunction page, COSMOS 2612 ⟷ ICEYE-X36](https://orbitalradar.com/conjunction/59103-68762): 26 m predicted miss, TCA 19 Oct 16:07 UTC
- [UNITED24 Media](https://united24media.com/war-in-ukraine/russian-military-satellite-stalks-ukraine-linked-spy-satellite-in-orbit-closing-in-to-just-5-km-23556): 16 October manoeuvre, ~5 km station-keeping, LeoLabs assessment
- [Times of Defence](https://www.timesofdefence.com.tr/russian-military-satellite-cosmos-2612-executes-coplanar-rendezvous-maneuver-targeting-iceye-x36-sar-satellite/): two-phase approach from 30 September, plane match around 12 October, ~57 m/s total
- [Satcat, COSMOS 2612](https://www.satcat.com/sats/68762): Plesetsk launch 16 April 2026, ~500 kg estimate, SSO
- [N2YO, ICEYE-X36](https://www.n2yo.com/satellite/?s=59103) and [Satcat, ICEYE-X36](https://www.satcat.com/sats/59103): 540–549 km, 97.8°, ~90 kg, Transporter-10 launch 4 March 2024
