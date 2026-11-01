# Space lasers, optics, contamination control, debris sensors

Research sweep, 2026-11-01. Working notes; see `README.md` in this folder for the caveats. **[V]** = figure appears in a search snippet from the cited source; **[BK]** = background knowledge, not verified; **[NF]** = not found this session.

## Part 1 — Flown / near-flight space pulsed lasers

| Mission (laser) | λ | Pulse energy | Rep rate | Pulse width | Avg optical power | Lifetime / shots | Lesson |
|---|---|---|---|---|---|---|---|
| MGS MOLA (1996–2001) | 1064 nm | 48 mJ BOL → ~20 mJ EOL [V] | 10 Hz | 8.5 ns | ~0.5 W; 13.7 W electrical [V] | 671 million shots in 4.5 yr [V] | Energy halved over life (diode aging) |
| ICESat GLAS (2003–2009) | 1064 + 532 nm | 75 mJ / 35 mJ [BK] | 40 Hz | ~5 ns | ~4 W | Laser 1 died after 36 days [V] | Excess indium solder in diode arrays → Au-In intermetallic failure [V]; duty-cycled to stretch life |
| CALIPSO CALIOP (2006– ) | 1064 + 532 nm | ~110 mJ each λ [V] | 20.16 Hz | 20 ns | ~4.4 W | >1.6×10⁹ shots, then canister pressure leak → switched to backup 2009 [V] | Sealed pressurized canister is both enabler and failure mode |
| LRO LOLA (2009– ) | 1064 nm | 2.7–3.2 mJ | 28 Hz | 5–6 ns | ~0.08 W | >1.8×10⁹ shots [V] | Extended vacuum life test |
| ICESat-2 ATLAS (2018– ) | 532 nm | ~0.2–1.2 mJ, 11 energy steps | 10 kHz | ~1.3–1.5 ns | up to 9 W at 532 nm [V] | ~1×10¹² shots requirement met at 4 yr [V] | Fibertek; slightly pressurized enclosure; zeolite molecular adsorber coating to protect optics [V] |
| GEDI on ISS (2018– ) | 1064 nm | 10–11 mJ | 242 Hz | 10–14 ns | ~2.5 W each | — | Side-pumped Nd:YAG slab |
| CATS on ISS (2015–2017) | 1064/532/355 nm | ~1 mJ | 5 kHz | — | ~25 W total [V] | 33 months | Highest average-power space lidar laser to date |
| Aeolus ALADIN (2018–2023) | 354.8 nm | 60–70 mJ [V] | 50.5 Hz | ~20 ns | ~3–3.5 W UV | 1.5 m SiC telescope | Laser-induced contamination: ~50 % UV energy drop within hours in a 2008 vacuum test [V]; fix: continuous O₂ trickle from two 30 L tanks, ~25 Pa near the UV optics [V]; at 5 Pa, 7 % loss per 10⁷ shots |
| EarthCARE ATLID (2024– ) | 354.8 nm | 35–38 mJ | 51 Hz | 20–26 ns | ~1.8 W UV | — | Sealed pressurized housing (>1 atm) with O₂ partial pressure [V] |

Optical-comms pointing heritage: LLCD (2013): 10 cm telescope, two-axis coarse gimbal plus two-axis fine stage, magneto-hydrodynamic inertial reference unit, ~30 kg, ~90 W, line-of-sight jitter requirement 4.2 µrad RMS [V]. LCRD (2021): two 10 cm optical modules on two-axis gimbals, ~15 µrad downlink beam [V].

Ground HEL heritage: Lockheed ATHENA 30 kW fiber (2015); HELIOS >60 kW factory test (2022); YAL-1 ABL megawatt-class chemical laser, cancelled 2011, cautionary on logistics and lethal-range shortfall.

## Part 2 — Commercial high-energy short/ultrashort-pulse lasers

- Thin-disk (Yb:YAG, 1030 nm): Trumpf Dira 200-x (~200 mJ-class ps), Dira 500-10 (500 W, 50 mJ, 10–100 kHz) [V]; record 220 mJ at 1 kHz (2019) [V]. Dausinger + Giesen: 750 mJ at ≥1 kHz, 3 ps ordered by HiLASE [V]; single-disk energy limit >1 J claimed. No product demonstrates 1 J, 100 Hz, ps, kW in one system [V].
- Innoslab / fiber: Edgewave PX up to 600 W, 2 mJ, 12 ps; Active Fiber Systems Ytterbium-300 (300 W, 3 mJ, THG to 343 nm option) [V]; coherently combined fiber 10.4 kW at ~130 µJ [V].
- J-class DPSSL (ns): DiPOLE100 / HiLASE Bivoj: 1030 nm, 2–10 ns, 100 J at 10 Hz (Dec 2016), later 150 J at 10 Hz; optical-to-optical 22 %; wall-plug "approaching 20 %" [V]; cryogenic He-gas-cooled multi-slab [BK]. **Third-harmonic conversion on Bivoj: 50 J at 10 Hz at 343 nm, 53 %, later 55 J at 63.5 %** (≈500 W UV average) [V]: the closest existing analogue to a hundreds-of-joules 343 nm space laser, but nanosecond and laboratory-scale. LLNL Mercury: 55 J at 10 Hz for hours, diode-pumped Yb:S-FAP, He-gas cooled [V]. HAPLS pump: 200 J at 10 Hz design, 70 J at 3.3 Hz achieved 2016 [V].
- Pump diodes: nLIGHT 73 % wall-plug at 980 nm bar level (2006), fiber-coupled modules >50 % [V]; Northrop CEO QCW arrays predicted MTTF 19.8×10⁹ shots [V]; GLAS Au-In failure is the canonical packaging lesson.
- THG to 343/355 nm: 10 J-class Yb:YAG → 3.5 J at 343 nm, 56 % in LBO [V]; thin-disk ps 234 W at 343 nm at 300 kHz [V]; Bivoj 50–55 J at 53–63.5 % [V]. LBO long-term UV degradation at high average power [NF].
- Supercapacitors for space: Nesscap ESHSR-0010C0-002R7UC first ESA-EPPL-II-listed part; ESA COTS campaign 18,000 h vacuum floating life, 32 FIT [V]; 5–7 Wh/kg, >10⁶ cycles [V]; Skeleton SpaceCap in ESA GSTP development, no formally qualified flight part found [V]. Sizing note: the bank's role is pulse-shaping of diode current (ms-scale QCW), so energy per pulse is small and the driver is pulse current and cycle count (needs shallow-depth cycling).
- TRL statement: highest average power ever flown ~25 W (CATS); highest UV ~3.5 W (ALADIN); highest pulse energy flown ~220 mJ (CALIOP). No picosecond laser has flown as a payload [BK]. The article's 3.3 kW UV, 100 ps, 300 J-class laser is ~3 orders beyond flown heritage in pulse energy and UV average power: TRL 2–3 as a space system. Most credible first-flight laser: a ruggedized 100–300 W-class 1030 nm system with THG, in an ATLID-style pressurized O₂-bearing housing, or a single DiPOLE-type 10–20 J / 10 Hz ns slab module with THG.

## Part 3 — Beam director, optics, contamination, thermal

- Mirror substrates: Boostec (Mersen) sintered SiC: Herschel 3.5 m at 25 kg/m² [V]; Gaia primaries 1.5 × 0.56 m, 38 kg; Euclid M1 Ø1.25 m <40 kg [V]; Airbus OTOS concept 16.5 kg/m². Beryllium (JWST <26.5 kg/m²). A 1 m director mirror is ~20–35 kg; a 0.45 m mirror ~5 kg.
- Gimbal precedents: SBSS Block 10: 30 cm aperture, 175 kg telescope on a two-axis gimbal [V], the closest flown precedent for a gimbaled ~0.3 m surveillance telescope. LLCD/LCRD two-axis gimbals with inertial stabilization. Tesat/Mynaric: coarse gimbal plus fast steering mirror [V].
- Fast steering mirrors: BlueHalo 55 mm space-qualified FSM, >800 Hz, ±5 mrad [V]; AeroVironment FSM ±17.5 mrad, >1 kHz [V]; CEDRAT P-FSM150S space-qualified (ATLID beam steering heritage); PI piezo ±5 mrad, nrad resolution. None rated for kW-class UV fluence; coating and substrate thermal design needed [BK]. Adaptive optics not required in vacuum.
- UV coatings: HfO₂/SiO₂ HR at 355 nm, ns: 5–8 J/cm² [V]; ps-regime LIDT scales roughly as τ^0.3–0.5 [BK]. On-primary fluence for 20 J over a 45 cm aperture is ~13 mJ/cm², far below damage; risk concentrates in the laser chain, THG crystals and small fold/FSM optics.
- Laser-induced contamination: DLR (2016): with 355 nm pulsed light and contaminant partial pressures 10⁻⁵–10⁻⁴ mbar, O₂ mitigation shows threshold behaviour; existing deposits removed under tens of Pa O₂ [V]. ALADIN 25 Pa O₂ trickle; ATLID sealed >1 atm housing with O₂ partial pressure [V]; NASA Molecular Adsorber Coating (zeolite) used for ATLAS optics [V]; ISO/TR 20811 test method. Diagram elements: pressurized O₂-bearing laser/THG enclosure, O₂ bleed at exposed UV optics, MAC panels in the bench cavity, deployable aperture door.
- Thermal: Airbus deployable radiator ~2.4 kW per unit with two-phase loop heat pipe [V]; heat pipes are too rigid for deployables so LHP or mechanically pumped loops are used [V]; real one-sided panels at 290–320 K deliver ~150–300 W/m² net [BK]. 15 kW (production unit) needs ~60 m² radiating area; 2.3 kW (pathfinder) ~7 m².

## Part 4 — Debris detection / tracking sensors and prior laser-removal design points

| Sensor | Aperture | FOV | Sensitivity | Notes |
|---|---|---|---|---|
| MSX SBV (1996) | 15 cm off-axis | — | ~15.5 mag [V] | progenitor of SBSS and Sapphire |
| SBSS Block 10 (2010) | 30 cm [V] | — | — | 175 kg telescope on two-axis gimbal [V] |
| Sapphire (2013) | 15 cm | 1.4° [V] | — | SSTL bus, contributes to SSN |
| NEOSSat (2013) | 15 cm f/6 | 0.86° [V] | V≈19.5 with stacking; ~17 practical for SSA [V] | 1024² CCD |

Scaling note: a 10 cm sphere (albedo 0.2) at 300 km in sunlight is roughly V≈+9–10; a 1 cm object ~V≈14–15, within SBV-class sensitivity only if the angular rate is tracked or exposure is very short. Passive detection of 1 cm at 1,000 km requires NEOSSat-class integration, incompatible with the streak rate; this is the central sensing problem for sweeper mode.

Rendezvous sensors: ADRAS-J visible camera detected the H-IIA stage at several hundred km (angles-only navigation); infrared camera with model-matching within a few km; LiDAR for the 50 m fly-around [V]. ClearSpace-1: narrow- and wide-angle cameras plus ranging device. Jena-Optronik RVS3000 scanning lidar (ATV heritage); Neptec TriDAR (0.5 m to >2 km); ASC GoldenEye flash lidar (to 3 km). None provide 60–300 km fine track on 1–10 cm objects; low-energy pulses from the ablation laser itself, or a dedicated rangefinder channel, are the heritage-consistent fine-ranging approach at range.

Phipps design points: ORION (1996): ground-based 20 kW, 530 nm, detection of 1 cm at 500 km, clears 1–20 cm debris in ~2 years below ~1,000 km [V]. L'ADROIT (2014): space-based UV, ~38 J or more per pulse cited by Ebisuzaki 2015, 1.5 m aperture cited in ORION-update material [V]; baseline 355 nm, ~100 ps, tens of J at tens of Hz, ~760 km polar orbit, large passive UV acquisition telescope, ~10 t class, ~$0.5–1 B [BK, unverified; open photonicassociates.com/documents/LADROIT.pdf]. Air Force Engineering University (Wen et al., Optik 2018): removal efficiency highest when station inclination and RAAN match the debris [V]. DLR Aerospace 10(7):633 (2023): head-on irradiation at low elevation versus outward irradiation; 10–40 cm fragments deorbited in ~100–400 passes [V]. NASA OTPS March 2023: removal of 1–10 cm debris and nudging large debris rated the two most efficient remediation methods [V]. DLR/GSI (2018): free-falling cm-sized Al, Cu, steel and PCB samples irradiated with the nhelix laser (60 J, 10 ns, 1064 nm); random orientation gives 86 % momentum uncertainty; heat accumulation limits pulses between cool-downs [V].

## Diagram-relevant takeaways
- Label the laser's heritage gap honestly; nearest ground analogue is HiLASE Bivoj THG (50–55 J at 10 Hz at 343 nm, ns).
- Pressurized O₂-bearing laser/THG enclosure (ATLID), O₂ bleed at exposed UV optics (ALADIN), MAC panels, aperture door.
- SiC primary at 25–35 kg/m²; dielectric HR coatings.
- Pointing chain: body slew → two-axis gimbal with inertial reference (LCRD heritage) → FSM (±5 mrad, ~1 kHz).
- Acquisition: 15–30 cm SBV/SBSS-class passive telescope → narrow-field tracker → low-energy ranging pulses → full-energy burst.
