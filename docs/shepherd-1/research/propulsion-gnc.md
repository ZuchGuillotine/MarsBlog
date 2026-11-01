# Propulsion catalogue, Δv arithmetic, ACS/pointing hardware

Research sweep, 2026-11-01. Working notes; see `README.md` in this folder for the caveats. `[mem]` = background knowledge, not retrieved; `[conflict]` = sources disagree; `[derived]` = computed in the sweep.

## Part 1. Propulsion catalogue

### 1A. Hall-effect thrusters (sub-kW class, primary candidates for a 250–500 kg Shepherd)

| Vendor / product | Propellant | Thrust | Isp | Input power | Mass | Total impulse | TRL / heritage | Source |
|---|---|---|---|---|---|---|---|---|
| Busek BHT-100 | Xe | 7 mN | 1,000 s | 100 W | 1.16 kg | 45 kN·s demonstrated | TRL 6–7 | https://www.busek.com/bht100-hall-thruster |
| Busek BHT-200 | Xe | 13 mN | 1,390 s | 200 W | ~1 kg [mem] | 75 kN·s demonstrated | TRL 9: TacSat-2 (2006), FalconSat-5/-6 | https://www.busek.com/hall-thrusters |
| Busek BHT-350 | Xe (Kr/I2) | 17 mN | 1,244 s | 350 W (200–600 W) | n/p | 212–244 kN·s demonstrated [conflict] | TRL 6–8 | https://www.busek.com/bht350 |
| Busek BHT-600 | Xe (Kr, I2) | 39 mN (36 mN at 600 W) | 1,300–1,500 s | 600 W | ~2.5–3 kg [mem] | >7,000 h life test | TRL 6–7 | https://busek.com/bht600 ; https://ntrs.nasa.gov/api/citations/20170001303/downloads/20170001303.pdf |
| Busek BHT-6000 (reference) | Xe | 288–320 mN | 2,029–2,600 s | 5–6 kW | 12.5 kg | >8.5 MN·s predicted | 4 units delivered for Gateway PPE | https://www.busek.com/bht6000 |
| Orbion Aurora | Xe | 5.3–15.6 mN | 940–1,280 s | 115–350 W | system dry ~6 kg incl. PPU + PMA | ≥500 kN·s; ≥5,500 cycles | TRL 9: ~50 flight thrusters, 12/month in 2025 | https://orbionspace.com/wp-content/uploads/2026/01/Orbion-Space-Technology-Corporate-Brief.pdf |
| Exotrail spaceware-micro | Xe (Kr) | >7 mN; clusters 14–28 mN | ~1,000–1,200 s [mem] | 150 W class | n/p | up to 60–115 kN·s | TRL 8–9 | https://satsearch.co/products/exotrail-spaceware-micro-cluster2-xl-thruster |
| Exotrail spaceware-mini | Xe / Kr / I2 | ~20–25 mN [mem] | n/p | 400 W class | n/p | configurable | TRL 5–6 | https://exotrail.com/product/spaceware |
| Astra Spacecraft Engine (ex-Apollo ACE) | Kr | 24–25 mN at 400 W | ~1,400 s [mem] | 400 W (280–600 W) | thruster 1.0 kg; system dry 4.5–7.6 kg [conflict] | ~200 kN·s | TRL 9: Sherpa-LTE 2021; Maxar/Apex orders | https://wp.astra.com/wp-content/uploads/2023/01/ASE-DATA-SHEET-2023-1.pdf |
| Astra ACE Max | Kr | 54–60 mN | ~1,500–1,800 s [mem] | 1,400–1,450 W | 19.8 kg system dry | ~1 MN·s [derived] | TRL 5–6 | https://satcatalog.com/component/ace-max |
| SETS ST-40 / SPS-40 | Xe (Kr) | 15–34 mN | 1,300–1,750 s | 250–600 W | ~1.5 kg thruster; ~10 kg system [mem] | 50 % efficiency | TRL 9: on orbit since 2022/23 (EOS SAT-1) | https://sets.space/st40/ |
| SETS ST-25 | Xe | 5–14 mN | 1,000–1,500 s | 100–250 W | n/p | 26–38 % efficiency | TRL 6–7 | https://sets.space/st25 |
| Rafael IHET-300 | Xe | 15 mN | 1,300 s | 250–600 W | 1.6 kg | n/p | TRL 9: Venµs (2017) | https://www.satnow.com/products/thrusters/rafael/36-1175-ihet-300 |
| Safran PPS1350-G (reference) | Xe | 90 mN | 1,660 s | 1.5 kW | 5.3 kg | 3.4 MN·s | TRL 9: SMART-1, Alphasat | https://www.safran-group.com/products-services/ppsr1350-stationary-plasma-thruster |
| Safran PPS5000 (reference) | Xe | 150–300 mN | 1,730–2,000 s | 2.5–5 kW | 12.3 kg incl. XFC | 15 MN·s | TRL 9: Eurostar Neo | https://www.safran-group.com/download/media/420283 |
| Aerojet XR-5 (reference) | Xe | ~290 mN [mem] | ~2,020 s [mem] | 4.5 kW | 12.3 kg | >10 MN·s [mem] | TRL 9: AEHF, X-37B | https://www.satcatalog.com/component/xr-5-hall-thruster/ |
| SpaceX Starlink V2-mini argon Hall thruster | Ar | 170 mN (official) | "1.5× gen-1" official; 2,500 s secondary | 4.2 kW is a back-calculation at 50 % efficiency, not a SpaceX statement [derived] | 2.1 kg | n/p | TRL 9: thousands flown since Feb 2023 | https://spaceflightnow.com/2023/02/26/spacex-unveils-first-batch-of-larger-upgraded-starlink-satellites/ |

### 1B. Gridded ion, FEEP, electrospray, metal plasma, RF

| Vendor / product | Type | Thrust | Isp | Power | Mass | Heritage | Source |
|---|---|---|---|---|---|---|---|
| ThrustMe NPT30-I2-1U | gridded ion, solid iodine | 0.3–1.1 mN | ≤2,400 s | 35–65 W | 1.2 kg wet all-in-one | TRL 9: first iodine EP in space (2020); Otter Pup 2 | https://thrustme.fr/base/stock/ProductBannerFiles/2_thrustme-npt30-i2.pdf |
| Enpulsion NANO / R³ | FEEP, indium | 10–350 µN | 2,000–6,000 s | 8–40 W | 0.9 kg wet | TRL 9: >200 units [mem] | https://www.enpulsion.com/wp-content/uploads/ENP2018-001.G-ENPULSION-NANO-Product-Overview.pdf |
| Enpulsion MICRO R³ | FEEP | 0.5–1 mN | 2,700 s at 1 mN | 64–120 W | 3.9 kg wet incl. PPU | TRL 7–8 | https://www.enpulsion.com/products/micro-r3/ |
| Benchmark Xantus | metal plasma | µN·s bits | 700–3,100 s [derived] | <100 W [mem] | n/p | on orbit since 2024 | https://payloadspace.com/benchmark-sends-metal-plasma-propulsion-to-orbit |
| Phase Four Maxwell Block 2 | RF plasma, Xe | >13 mN | >700 s | 300–500 W | 5.0 kg dry | TRL 9 (Capella) | https://satnow.com/products/thrusters/phase-four/36-1174-maxwell-block-2 |
| Magdrive Rogue | pulsed metal plasma | up to 10 mN peak | n/p | tens of W | ~3 kg | first demo 2025 | https://aerospaceamerica.aiaa.org/magdrives-plasma-thruster-proves-its-mettle-in-first-orbital-test/ |
| NEXT-C (reference) | gridded ion | 25–235 mN | ≤4,220 s | 0.5–6.9 kW | thruster <13.5 kg, PPU <36 kg | DART | https://ntrs.nasa.gov/api/citations/20210018563/downloads/NEXT-C%20AIAA%20Paper%202021%20FINAL.pdf |

### 1C. Chemical / cold gas / resistojet

| Vendor / product | Type | Thrust | Isp | Mass | Heritage | Source |
|---|---|---|---|---|---|---|
| Bradford ECAPS 1N HPGP | green mono, LMP-103S | 0.25–1 N | 204–231 s | 0.38 kg | PRISMA, SkySat; 30+ missions | https://www.satnow.com/products/thrusters/ecaps/36-1262-1n-hpgp |
| Aerojet MR-103G/J | hydrazine | 0.19–1.13 N | 202–224 s | 0.33–0.37 kg | hundreds flown | https://www.satcatalog.com/component/mr-103j-1n/ |
| Aerojet MR-106L | hydrazine | 10–34 N | 228–235 s | 0.59 kg | many buses | https://www.satcatalog.com/component/mr-106l-22n/ |
| Benchmark Halcyon Avant | HTP biprop | ~20 N | ~303 s | n/p | Sherpa-LTC 2022 | https://www.satnow.com/products/thrusters/benchmark-space-systems/36-1164-halcyon-avant |
| Dawn Aerospace B20 | N2O / propene biprop | 6.5–18 N | 250–280 s | ~0.6 kg | D-Orbit ION and many since | https://www.dawnaerospace.com/thrusters |
| VACCO MiPS | cold gas R-236fa | 25 mN | ~40 s | 0.5–1.65 kg | MarCO, NEA Scout | https://satcatalog.com/component/marco-mips |

Prices: no vendor publishes list prices; the only public price-adjacent data were Apollo Fusion's "$250k saving" claim and a third-party $60k figure for a Rocket Lab RW3-1.0 wheel.

## Part 2. Δv arithmetic (μ = 398,600.44 km³/s², R⊕ = 6,378.137 km)

- 800 km circular: v = 7.4518 km/s, period 100.9 min.
- Deorbit, impulsive single burn: to 100 km perigee **193 m/s**; to 200 km perigee **164 m/s**.
- Deorbit, low-thrust spiral (Edelbaum): 800 → 200 km circular **332 m/s** (×1.15 duty/steering penalty → ~382 m/s); 800 → 300 km hand-off **274 m/s** (→ ~315 m/s). A low-thrust system cannot buy the cheap elliptical option; it pays roughly 2× the impulsive cost.
- Time check (continuous thrust): 500 kg at 10 mN for 382 m/s → 221 days; 2,300 kg at 60 mN → 170 days; 250 kg at 1 mN (FEEP) → 3.0 years. FEEP/iodine-1U class is too weak for a Shepherd deorbit unless clustered.
- Plane change at 800 km: impulsive **130 m/s per degree** of inclination; low-thrust continuous ≈ 204 m/s per degree. RAAN change impulsive: 104 m/s/deg at 53°, 129 m/s/deg at 83° and 97.8°.
- 10 km altitude change: ~5.2 m/s. A 1 km altitude offset drifts along-track ≈ 134 km/day; moving from 200 km behind to 50 km ahead of a target costs ~1 m/s total. Holding 50–200 km ahead on the same orbit costs essentially zero Δv.
- J2 differential nodal precession per 50 km altitude step at 800 km: 0.097 °/day at 53° (35 °/yr), 0.020 °/day at 83° (7.1 °/yr), 0.022 °/day at 97.8° (8.0 °/yr). A 50 km excursion costs ~52 m/s round trip versus 104–204 m/s per degree for a direct node change.
- Propellant for 382 m/s: 500 kg at Isp 1,600 s → 12.0 kg; 250 kg → 6.0 kg; 2,300 kg → 55 kg. A 193 m/s chemical deorbit kit at Isp 230 s costs ~8 % of wet mass but is fast and independent of the EP string.
- Regulatory: FCC Second Report and Order FCC 22-74 (adopted 29 Sep 2022): deorbit no later than five years after mission completion, applicable to satellites launched on/after 29 Sep 2024. NASA-STD-8719.14 Req. 4.6-4: post-mission disposal probability of success ≥ 0.90. ESA ESSB-ST-U-007 (2023) uses 5 years and ≥0.9 (0.95 for large constellations) [mem].

Sources: https://docs.fcc.gov/public/attachments/FCC-22-74A1_Rcd.pdf ; https://s3vi.ndc.nasa.gov/ssri-kb/static/resources/nasa-std-8719.14b.pdf ; https://arxiv.org/pdf/1107.0192

## Part 3. Attitude control and pointing hardware

### 3A. Reaction wheels

| Product | Momentum | Torque | Mass | Power | Source |
|---|---|---|---|---|---|
| BCT RWp050 / RWp100 / RWp500 | 0.05 / 0.1 / 0.5 N·m·s | 7–25 mN·m | 0.24–0.86 kg | ~1 W | https://www.bluecanyontech.com/components/reaction-wheels/ |
| BCT RW1 | 1.0 N·m·s | 0.06 N·m | 1.1 kg | <100 W peak | https://satsearch.co/products/bluecanyontech-rw1 |
| BCT RW4 / RW4-HT | 4.0 / 2.5 N·m·s | 0.25 / 0.50 N·m | 3.2 kg | ~10 W avg | https://satsearch.co/products/bluecanyontech-rw4 |
| BCT RW8 | 8 N·m·s | 0.25–0.5 N·m | 4.4 kg | — | https://satnow.com/products/reaction-wheels/blue-canyon-technologies/38-1186-rw8 |
| Rocket Lab RW4-1.0 | 1.0 N·m·s | 60–100 mN·m | 0.97–1.38 kg | 5.3 W steady | https://www.rocketlab.co.nz/assets/Uploads/1-Nms-RW4-1.0-Data-Sheet.pdf |
| Rocket Lab RW4-12 | 12 N·m·s | 200 mN·m | 5 kg | — | https://rocketlabcorp.com/assets/Uploads/RW-12-Datasheet-v3.5.pdf |
| Honeywell HR12 / HR14 / HR16 | 12–100 N·m·s | ~0.2 N·m [mem] | 7–10 kg | 22 W | https://satcatalog.com/component/hr14-25 |
| Collins RSI 12 / RSI 45 | 4–45 N·m·s | 75–170 mN·m | 4.85–7.7 kg | 20–22 W | https://www.collinsaerospace.com/what-we-do/Space/Space-Wheels/Rsi-12-Momentum-And-Reaction-Wheels |

### 3B. CMGs
Honeywell M50 (25–75 N·m·s, 75 N·m, 28 kg); Honeybee Microsat CMG (56–86 mN·m·s each, 0.6 kg + 0.7 kg electronics); Airbus CMG 15-45S (15 N·m·s, 45 N·m, 18.4 kg, 25 W, Pléiades heritage); BCT CMG-8 (~8 N·m·s / ~8 N·m).

### 3C. Star trackers

| Product | Accuracy (cross / roll) | Mass | Power | Source |
|---|---|---|---|---|
| BCT Standard NST | 6″ / 40″ | 0.35 kg | 1.5–3.5 W | https://www.bluecanyontech.com/static/pdf/NST-2024.pdf |
| Rocket Lab ST-16RT2 | 5″ / 55″ RMS | 158–243 g | 0.5–1 W | https://www.rocketlabusa.com/assets/Uploads/ST-16RT2-Datasheet-v4.1.pdf |
| Sodern Hydra (1 EU + 2 OH) | bias 11″, NEA 2.3″ XY | OH 1.4 kg, EU 1.9 kg | 7.7 W | https://sodern.ariane.group/wp-content/uploads/sites/4/2018/04/Datasheet_HYDRA_2017.pdf |
| Sodern Auriga | arcsec class | <250 g | 0.8 W | https://api.sodern.com/uploads/AURIGA_8_PAGE_a11f9a3724.pdf |
| Jena-Optronik ASTRO APS | <1″ / 8″ | ~2 kg | 6 W | https://jena-optronik.de/tl_files/pdf/Data%20Sheet%20ASTRO%20APS.pdf |
| Ball CT-2020 | 1.5″ | ~3 kg | n/p | https://www.ball.com/getattachment/9cf8d772-2ec8-4d54-ba43-53e140fa6083/D3408_CT2020_Updated_20211221.pdf |

### 3D. IMUs
Honeywell HG1700 (RLG, 0.7–0.9 kg, <5 W); Honeywell HG4930 (MEMS, 0.25 °/h, 140 g, <3 W); Northrop LN-200S (FOG, 1 °/h, 0.748 kg, 12 W; Kepler, Mars rovers); Safran STIM300 / STIM377H (MEMS, 0.3 °/h, 55 g).

### 3E. Sun sensors, magnetorquers, GNSS
NewSpace NFSS-411 fine sun sensor (0.1° RMS, <35 g); NewSpace NCTR-M016 rods (1.6 A·m²); ESPA-class buses typically fly 15–40 A·m² rods [mem]; NovAtel OEM719 (31 g, ~1–2 W); Syrlinks/Safran N-SPHERE (position <20 cm).

### 3F. Achievable bus pointing and the fine-steering requirement
- BCT XACT on orbit: 0.004–0.012° (3σ); star-tracker-limited 0.001° RMS with two trackers. ESPA-class buses quote ±0.002–0.01° (1σ) pointing, ~0.001° knowledge, 1–5″/s stability; wheel-induced jitter 1–10 µrad RMS unless isolated [mem].
- Holding a 30 cm spot at 250 km needs 1.2 µrad; best bus pointing (35 µrad) misses by ~30×, so a two-stage architecture (coarse bus/gimbal, fine steering mirror closed on target return light) is mandatory, as in laser-communication terminals.
- Diffraction check: a 30 cm spot at 250 km at 1,064 nm needs a ~2.2 m aperture; at 343 nm a ~0.7 m aperture. Wavelength tripling is what makes a 1 m director workable.
- Comparators: ICESat-2 ATLAS pointing control ~90 µrad, knowledge 13 µrad, achieved ~9 µrad; LLCD/LCRD inertially stabilized telescopes with FSM + centroid tracking, jitter requirement 4.2 µrad RMS.
- Fine steering mirrors: PI S-330/S-331 (2–10 mrad, nrad resolution, 1–9 kHz); CEDRAT P-FSM150S (±2°, space-qualified, EarthCARE ATLID beam steering heritage); BlueHalo 55 mm space-qualified FSM (>800 Hz, ±5 mrad); AeroVironment FSM (±17.5 mrad, >1 kHz).
- Recommended fine stage: piezo tip/tilt, ≥±1 mrad range, <0.1 µrad resolution, ≥1 kHz bandwidth, driven by a quad-cell / centroid tracker on target return light; passive isolation between wheels and the optical bench so wheel jitter stays below ~0.5 µrad RMS at the mirror.
