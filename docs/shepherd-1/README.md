# Shepherd-1: laser-ablation debris-remediation pathfinder

**Status: proposed, pitch-stage v1 design (2026-11-01). No hardware exists.**
First-order budgets for a fundraising video and pitch, not a flight analysis.

This folder holds the single source of truth for the Shepherd-1 design
(`shepherd-1-spec.json`), the sizing checks behind it (`sizing.json`, produced
by `scripts/shepherd/size_shepherd1.py`), the research notes it draws on
(`research/`), and this document. The published page is `/shepherd` on the
site; the 3D model, renders and schematics live in `public/shepherd/`.

| Deliverable | Where | Made by |
| --- | --- | --- |
| Interactive 3D viewer (rotate, label, explode, video mode) | `/shepherd` page, `src/components/ShepherdViewer.tsx` | React Three Fiber on the GLB |
| 3D model, deployed and stowed | `public/shepherd/shepherd-1.glb`, `shepherd-1-stowed.glb` | `scripts/shepherd/build_shepherd_model.py` (Blender 5.2 as a Python module) |
| Hero stills (2560 × 1440), exploded view, stowed view | `public/shepherd/renders/*.png` (originals) and `.jpg` (site) | `scripts/shepherd/render_shepherd.py stills` (Cycles) |
| 360° turntable, 6 s loop | `public/shepherd/renders/shepherd-1-turntable.mp4` | `scripts/shepherd/render_shepherd.py turntable` |
| Systems schematic and engagement geometry | `public/shepherd/shepherd-1-systems.svg`, `shepherd-1-engagement.svg` | `scripts/shepherd/build_schematics.py` |
| Design spec (dimensions, budgets, candidates) | `docs/shepherd-1/shepherd-1-spec.json` | hand-written, drives the model, schematics and page |
| Sizing checks | `docs/shepherd-1/sizing.json` | `scripts/shepherd/size_shepherd1.py` |

Reproduce everything from the repository root:

```sh
pip install bpy trimesh pillow            # Blender 5.2 Python module (~350 MB)
python3 scripts/shepherd/size_shepherd1.py
python3 scripts/shepherd/build_shepherd_model.py          # GLB + quick preview
python3 scripts/shepherd/build_shepherd_model.py --stowed
python3 scripts/shepherd/build_schematics.py
python3 scripts/shepherd/render_shepherd.py all --res 2560x1440 --samples 128 --frames 144
npm run type-check && npm run build
```

## 1. What was asked, and what this is

The brief: a highly accurate, aesthetically strong diagram and 3D rendering of
the Shepherd laser-ablation satellite for a fundraising video, containing every
component a knowledgeable reviewer would expect (tracking, a real laser chain,
propulsion that covers the manoeuvring and the mandatory deorbit, fleet
communications, a plausible commercial bus), and attentive to ordinary
spacecraft concerns such as cold welding. Not a research agenda.

The design here is **Shepherd-1, the pathfinder**: the spacecraft section 10 of
[The Case for Attack Satellites](https://populationmars.com/blog/the-case-for-attack-satellites)
calls for ("fly one"), scaled to what a commercial ESPA-Grande bus and a
rideshare port can carry. The 2.3 t production unit in sections 7 and 8 of the
article is kept as the thing the pathfinder leads to; its architecture is the
same, its numbers are not reachable with any catalogue bus today (see §6).

## 2. Lineage: what was kept, what changed

Kept from the article and the OrbitFleet simulations (`scripts/orbits/`):

- Frequency-tripled ytterbium laser at 343 nm; silicon-carbide beam director.
- The engagement rule: fire only on targets approaching from ahead, so recoil
  lowers perigee and the system cannot raise anything's orbit.
- Loiter 50 km below the target band: a failed shepherd decays before its
  targets, and differential J2 precession walks the plane between targets for
  no propellant (7.9°/yr at sun-synchronous, from `sizing.json`).
- Supercapacitor pulse storage sized by power, not energy.
- Hall-effect propulsion with a locked disposal reserve.
- The firing log, published per target.
- The OrbitFleet conjunction-response rule: protected satellites must be more
  than 0.1° off the beam axis beyond the target.
- The Phipps coupling model (spot = 2.44 M² λ R / D, optimum fluence
  8.5 × 10⁸ √τ J/m², 50 µN·s/J middle case with 25 and 100 as the bracket), reused
  unchanged in `size_shepherd1.py`.

Changed, with the reason:

| Item | Article production unit | Shepherd-1 | Why |
| --- | --- | --- | --- |
| Mass | ~2.3 t | 486 kg wet | Fits a 700 kg-qualified ESPA Grande port and a rideshare launch; commercial bus cores exist at this scale (Apex Nova, York LX, Arrow 450, Jackal) |
| Array | ~28 kW | 11 m² roll-out, 3.6 kW BOL | Largest flown-class array a 500 kg vehicle can carry (Redwire ROSA Diamond class, 3.3 kW / 36 kg, flown on DART) |
| Laser | 700 J, 100 ps, 30 Hz, 3.3 kW UV | 20 J, 1 ns, 10 Hz, 200 W UV | Nothing within 100× has flown. 1 ns drops the pulse compressor; the chain is a de-rated copy of HiLASE Bivoj's third-harmonic stage (50–55 J at 10 Hz at 343 nm, 53–64 % conversion), which exists in a laboratory |
| Aperture | 1.0 m | 0.45 m | Stows inside the body envelope; ~5 kg of SiC at Herschel/Euclid areal density |
| Range | 60–300 km (sweeper and shepherd) | 5–12 km (shepherd only) | Follows from 20 J and 0.45 m at optimum fluence; co-orbital formation at 10 km is routine rendezvous practice |
| Targets | 10 g fragments to 9 t stages | Catalogued 1–50 kg fragments at 700–900 km | What 98 W on target removes in days to weeks; enough to measure coupling on real debris and demonstrate the concept |

## 3. The vehicle

Body frame: +X ram (velocity), -X aft where the beam director points; -Y sun
side (dawn-dusk orbit keeps the Sun near -Y), +Y anti-sun where the radiators
are; +Z zenith, -Z nadir with the separation ring.

### Orbit and operations

Dawn-dusk sun-synchronous, 750 km, 98.4°. Continuous sunlight for most of the
year powers the laser without a large battery; 50 km below the 800 km band
where the dangerous mass is. In shepherd mode the spacecraft flies a natural
safety ellipse 5–12 km ahead of a catalogued fragment, fires back along the
fragment's velocity during the apogee half of its orbit while sunlit (~45 %
duty, as in the OrbitFleet campaign scene), and holds formation with the Hall
thruster as the target's period shortens. Targets are handed over from the
catalogue (Space-Track ephemerides), acquired by angles-only navigation from
hundreds of kilometres (ADRAS-J heritage), tracked on the 15 cm telescope, then
on the main aperture.

### Laser (the development item)

Yb:YAG master oscillator and diode-pumped multi-slab power amplifier at
1030 nm, 45 J per pulse, 10 Hz, 1 ns; third-harmonic generation in LBO to
343 nm at ~50 %: 20 J, 200 W average ultraviolet. Wall-plug ~10 % (20 % to
infrared, as the DiPOLE/Bivoj architecture approaches, × 50 % conversion), so
2 kW electrical in and 1.8 kW of heat out while firing. The amplifier and THG
stage sit in a sealed, pressurised housing with an oxygen partial pressure
(EarthCARE ATLID heritage) with zeolite molecular-adsorber panels (ICESat-2
heritage); an oxygen bleed bottle feeds the exposed ultraviolet optics (Aeolus
ALADIN's on-orbit fix for laser-induced contamination). A 20 kg supercapacitor
bank shapes the ~450 J, 1 ms quasi-CW diode pump pulses (~0.4 MW peak); it is
sized by current and cycle count, not energy.

Heritage gap, stated plainly: the highest average optical power flown is
~25 W (CATS on ISS), the highest ultraviolet ~3.5 W (ALADIN), the highest pulse
energy ~0.2 J (CALIPSO). Shepherd-1 is ~100× beyond flown pulse energy and ~60×
beyond flown UV average power. Everything else on the vehicle is flown-class.

### Beam director and pointing

0.45 m sintered-SiC primary (Mersen Boostec class, ~5 kg at 30 kg/m²),
Cassegrain afocal expander, HfO₂/SiO₂ high reflectors for 343 nm (on-primary
fluence ~13 mJ/cm², far below damage). Two-axis elevation-over-azimuth yoke
recessed in the aft cradle: azimuth ±100°, elevation -25°/+70°. Hollow axes
carry a coudé path from the fixed laser bench up through the azimuth axis and
out through one elevation trunnion. A 55 mm space-qualified fast steering
mirror (±5 mrad, >800 Hz; BlueHalo / CEDRAT / AeroVironment class) closes the
loop on target return light; an inertial reference unit rides on the tube
(LCRD heritage). Budget: bus 35 µrad (0.002°, 1σ) → gimbal → FSM holds the
1.4 µrad half-spot at 10 km. A motorised contamination door closes for thruster
burns and outgassing phases.

### Tracking and ranging

15 cm off-axis visible acquisition telescope, 1.5° field, V≈15 at short
exposure (MSX SBV / Sapphire class), body-fixed and aft-looking; narrow-field
tracker through the main aperture by dichroic; uncooled LWIR camera on the
gimbal for eclipse tracking; ranging with 1–5 J pulses from the main laser and
a photon-counting receiver (1 m at 10 km). An independent laser safety interlock
unit requires fine-tracker lock, no protected object within 0.1° of the beam
axis beyond the target, an open Laser Clearinghouse window, and the Earth limb
more than 100 km below the line of sight.

### Power and thermal

Two roll-out blanket wings (ROSA Diamond class), 1.1 × 5.0 m each, 11 m²,
fixed sun-facing along ±Z, 3.6 kW BOL / 3.05 kW EOL against 2.62 kW while
firing. 2.5 kWh lithium-ion for eclipse season and safe mode; 100 V bus.
Thermal: a mechanically pumped loop from the laser cold plates to two
deployable 2.0 × 0.85 m optical-solar-reflector radiators hinged from the
anti-sun face (6.8 m² two-sided) plus 0.9 m² of body radiator: 2.25 kW at
300 K with 344 W/m² net. MLI with germanium- or ITO-coated outer Kapton.

### Propulsion and disposal

Two 600 W-class xenon Hall thrusters (Busek BHT-600 / SETS ST-40 / Astra ASE
class), prime and redundant, on a two-axis thrust-vector platform at the ram
face; 35 mN, Isp 1,500 s; 24 kg xenon in a 25 L COPV with 8.8 kg locked as the
disposal reserve. Delta-v budget 570 m/s: disposal spiral 750 → 300 km
(248 m/s × 1.1), one degree of plane change (130 m/s), two 50 km altitude moves
(52 m/s), five years of formation keeping (40 m/s) and collision avoidance
(15 m/s), 60 m/s margin. The 45° plume cone points along +X; the radiators,
arrays and optics all lie behind the thruster exit plane. Natural decay from
750 km would not meet the FCC five-year rule, so disposal is active, the
second string is the backup, and the loiter-below rule is the last resort.

### Attitude control, communications, avionics

Four 4 N·m·s reaction wheels in a pyramid on an isolated mount, two star
trackers (anti-sun and zenith-aft baffles), fibre-optic IMU, fine sun sensors
on the sun face, three magnetorquer rods, dual-antenna GNSS with 1 PPS to the
laser timing and the crosslink terminal. One SDA-compatible optical crosslink
terminal (2.5 Gbps to 6,500 km, hemispherical gimbal, zenith face) for the
fleet mesh and the Kepler optical relay; S-band CCSDS TT&C with zenith and
nadir patches; X-band downlink at 140 Mbps for tracker imagery and the firing
log; an L-band GEO relay patch for anytime low-rate command and abort during
engagements. Redundant flight computer, a payload processor for tracking and
fire control, the independent interlock unit.

### Structure and mechanisms

1.0 × 0.95 × 0.85 m aluminium-honeycomb / CFRP body on a 24-inch Lightband-class
ring; stowed 1.17 × 1.12 × 0.99 m, inside the Moog ESPA Grande nominal port
envelope (1.07 × 1.17 × 0.97 m) and well under the 700 kg qualified port mass.
Stuffed-Whipple bumpers on the ram face over the xenon tank and laser bench.
Non-explosive release devices (EBAD NEA 9100 / TiNi Frangibolt class) on both
wings, both radiators, the gimbal and the aperture door. Dissimilar metal
pairs at every separable contact, sputtered MoS₂ on release interfaces,
ceramic-coated latch pins, Braycote 601EF in the gimbal bearings: the Galileo
high-gain antenna is the reference cold-weld failure. ITO-coated outer
surfaces and a single-point ground for the polar auroral zone; 2–4 mm
aluminium-equivalent electronics enclosures for ~5 krad/yr.

## 4. Budgets

Mass (kg): structure and mechanisms 55 · beam director and optics 51 · laser
80 · thermal 45 · power 72 · propulsion dry 26 · ADCS 20 · communications 25 ·
avionics 9 · acquisition sensors 9 · **dry subtotal 392** · margin 18 % 70 ·
**dry 462** · xenon 24 · **wet 486**.

Power while firing (W): laser 2,000 · payload sensors and processing 180 ·
bus 320 · thermal pumps and heaters 120 · **2,620** against 3,050 W EOL. The
thruster (650 W) is not run while firing.

Pulse plan (`sizing.json`): at 10 km the spot is 2.8 cm and 16 J reaches
optimum fluence; at 12 km the 20 J cap is reached (0.85 of optimum); beyond that
fluence and coupling fall. Energy on target 98 W after a 0.7 pointing
efficiency and a 0.7 surface-orientation factor. Firing time to a 200 km
perigee from 800 km at 45 % duty: 1 kg 0.9 days, 10 kg 8.6 days, 50 kg
43 days, 150 kg 129 days; double these at 25 µN·s/J.

## 5. Plausibility checks a reviewer will run

- **Aperture against range.** 2.44 × 1.5 × 343 nm / 0.45 m = 2.8 µrad; at
  10 km that is 2.8 cm. Optimum fluence at 1 ns is 26.9 kJ/m², so a 2.8 cm spot
  needs 16 J. Consistent with 20 J and a 5–12 km working range.
- **Energy to deorbit.** 164 m/s from 800 km; at 50 µN·s/J, 3.3 MJ per kg
  of target. At 98 W on target that is 9.3 h per kg of debris. Consistent with
  the firing-time table.
- **Array against load.** 11 m² at 1,361 W/m² × 30 % cells × 0.85 packing ×
  0.94 cosine = 3.6 kW BOL, 3.05 kW at 85 % EOL, against 2.62 kW while firing.
- **Radiator against heat.** 2.25 kW at 300 K, ε 0.88, 60 W/m² environmental
  sink: 344 W/m² net, 6.5 m² needed, 7.7 m² installed.
- **Propellant against delta-v.** 486 kg × (1 − e^(−570 / (1,500 × 9.81))) =
  18.3 kg; 24 kg loaded. Disposal alone (273 m/s) is 8.8 kg, locked.
- **Thrust against time.** 273 m/s × 486 kg / 35 mN = 44 days of continuous
  thrust for disposal, against a five-year clock.
- **Pointing chain.** 35 µrad bus → 5 mrad FSM range → 1.4 µrad half-spot:
  the FSM captures 140× the bus error; this is the lasercom-terminal pattern.
- **Envelope and mass.** 486 kg and 1.17 × 1.12 × 0.99 m against the 700 kg,
  1.07 × 1.17 × 0.97 m ESPA Grande port.

## 6. Why not a CubeSat, and why not the 2.3 t unit yet

The best published 16U CubeSat payload power is ~50 W orbit-average to
~300 W peak; a laser that ablates anything draws kilowatts while firing. The
largest commercial ESPA-Grande-class buses publish ~1 kW orbit-average and
1.5–3 kW peak payload power; Shepherd-1 therefore keeps the commercial bus core
and replaces the power and thermal subsystems with mission-specific roll-out
arrays and deployable radiators, which is how every high-power hosted payload
is done. The article's 2.3 t, 28 kW unit needs a Starlink-V3-class body, ~60 m²
of radiator and a laser three orders of magnitude beyond flown heritage; it is
the production spacecraft the pathfinder's measurements decide the size of.

## 7. Known limits of this design

- The laser is TRL 2–3 as a space system. Diode-stack lifetime (the ICESat
  GLAS indium failure), LBO ageing under high average UV power, and
  laser-induced contamination control are the three risks that the pressurised
  enclosure, oxygen bleed and spare pump modules address but do not retire.
- Coupling (50 µN·s/J) and the surface-orientation factor are assumptions,
  bracketed by 25 and 100. Measuring them is the pathfinder's purpose.
- Acquisition of uncatalogued 1–10 cm objects (sweeper mode) is not attempted;
  it needs a larger passive telescope and higher pulse energy.
- Budgets are first-order; no structural, thermal or stray-light analysis has
  been run. Vendor figures come from public datasheets and press material
  compiled in November 2026 and are flagged by verification status in
  `research/`.
- The visualised beam and fragment in the renders are drawn at 9 m for
  legibility; the real engagement range is 5–12 km.

## 8. Sources

Primary design sources are the article (sections 6–10), the OrbitFleet
campaign scene (`docs/laser-ablation-simulation.md`) and the conjunction
response (`docs/conjunction-response/README.md`). Hardware and heritage figures
and their URLs are in `research/buses.md`, `research/propulsion-gnc.md`,
`research/laser-optics-sensors.md` and `research/comms-references-concerns.md`,
each with its own verification tags. Key public references:

- Phipps et al., L'ADROIT, Acta Astronautica 104 (2014); ORION (1996).
- HiLASE Bivoj third-harmonic results (50–55 J at 10 Hz at 343 nm), High Power Laser Science and Engineering.
- ESA, Aeolus ALADIN laser-induced contamination and the oxygen fix; EarthCARE ATLID sealed housing.
- NASA ICESat-2 ATLAS and ICESat GLAS laser lifetime reports (NTRS).
- Moog ESPA / ESPA Grande datasheet; SpaceX Rideshare payload classes.
- Redwire ROSA; Busek BHT-600; SETS ST-40; Astra Spacecraft Engine datasheets.
- Mynaric CONDOR Mk3, CACI CrossBeam, Tesat SCOT80; SDA Optical Communications Terminal Standard.
- NASA TM-105355 (Galileo HGA), NASA-HDBK-6024 (atomic oxygen), NASA/TM-2009-214785 (MMOD), NASA-HDBK-4002B (charging), NASA-STD-8719.14 and FCC 22-74 (disposal).
- USSF Laser Clearinghouse registration and predictive avoidance (DoDI 3100.11).
