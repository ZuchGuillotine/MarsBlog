# Communications, reference spacecraft, general design concerns

Research sweep, 2026-11-01. Working notes; see `README.md` in this folder for the caveats. `[UNVERIFIED]` = background knowledge with no URL retrieved; `[CONFLICT]` = sources disagree.

## Part 1 — Communications hardware

### 1A. Optical inter-satellite link terminals

| Terminal | Data rate | Range | Mass | Power | Heritage | Source |
|---|---|---|---|---|---|---|
| Mynaric CONDOR Mk3 | 0.3–2.5 Gbps (SDA OCT compliant) | >6,500 km | not published | 22–38 VDC; 4 W optical Tx | deliveries to SDA Tranche 1/2 primes; >100 delivered by mid-2025 | https://mynaric.com/products/space/condor-mk3/ |
| Tesat SCOT80 | 2.5 / 10 Gbps | 8,000 km | 11.9–15 kg [CONFLICT] | ~60–80 W | first commercial SDA-compatible OISL (Kepler 2024) | https://satnow.com/products/laser-communication-terminals/tesat-spacecom-gmbh-co-kg/155-1423-scot80 |
| Tesat SCOT20 | n/p | 2,000 km | 1.6 kg, 1U | n/p | smallsat class | https://satsearch.co/products/tesat-scot20-smallsat-optical-communication-terminal |
| Tesat ConLCT80 | 10 Gbps | constellation class | 15 kg | 86 W | CCSDS reference | https://satsearch.co/products/tesat-conlct80-laser-communication-terminal-for-broadband-constellations |
| Tesat TOSIRIS (direct-to-Earth) | 1.25–10 Gbps down | LEO-to-ground | 8 kg | 40 W | 5-yr LEO life | https://satnow.com/products/laser-communication-terminals/tesat-spacecom-gmbh-co-kg/155-1423-tosiris |
| CACI CrossBeam ST0 / ST1 | 1.25 / 2.5 Gbps | 6,500–6,750 km | n/p | ~50 / ~75 W; hemispherical field of regard | DARPA Blackjack; SDA interop 2023 | https://www.caci.com/sites/default/files/2025-11/CACI_CrossBeam_Fact-Sheet_110325.pdf |
| General Atomics OCT | up to 5 Gbps | 5,000 km | 2U / 3U; 70 or 135 mm aperture | n/p | SDA v3.1 compliant | https://www.ga.com/space-systems/img/OCT_DS_0521E.pdf |
| Skyloom OCT | n/p | — | — | — | 84 terminals on orbit (SDA) | https://quantumcomputingreport.com/ionq-subsidiary-skyloom-reaches-84-on-orbit-optical-terminals-supporting-sda-constellation/amp/ |

SDA OCT Standard v3.0 is SDA-9100-0001-05 (Aug 2021); 2.5 Gbps coded throughput; v3.1/3.2/4.0 iterations. SpaceX Starlink: standard ISL ~100–200 Gbps, longest link 5,400 km; the "mini laser" for third-party satellites: 25 Gbps at up to 4,000 km, first orbital test Aug 2025, customers Muon Space and Starcloud; no mass/power/price published. Sources: https://www.aldec.com/files/ip_products/PB_Creonic_SDA_OCT_V3_0.pdf ; https://www.datacenterdynamics.com/en/news/spacex-developing-laser-to-connect-starlink-satellites-with-third-party-satellites/

### 1B. RF TT&C and data

| Unit | Band / rates | Mass | Power | Source |
|---|---|---|---|---|
| Syrlinks (Safran) EWC31 / N-STAR S-band transponder | Rx up to 512 kbps; Tx up to 2 Mbps; CCSDS | ~1.3 kg [UNVERIFIED] | 12 W | https://www.safran-group.com/products-services/n-star-ss-band-transponder-nano-satellites |
| Syrlinks EWC27 / X-LITE X-band Tx | up to 140 Mbps | n/p | 12 W | https://www.safran-group.com/products-services/x-lite-x-band-transmitter-nano-satellites |
| Tethers Unlimited SWIFT-SLX S-band SDR | 1.5–3.5 GHz | ~0.4–0.5 kg [CONFLICT] | 3 W base, 4–16 W Tx | https://cubesats.gsfc.nasa.gov/symposiums/2019/presentations/Day2/REUSTER.pdf |
| IQ Spacecom XLink-S | up to 100–200 Mbps [CONFLICT] | 200 g | 4–15 W | https://satsearch.co/products/iq-xlink-s |
| Satlab SRS-4 S-band | up to 5 MBd | n/p | n/p | https://www.satnow.com/products/software-defined-radios/satlab-a-s/112-1334-srs-4 |
| CesiumAstro Vireo Ka (multi-beam AESA) | 4–15+ Gbps | Tx 14.5 kg, Rx 7 kg | Ka 576: 2,200 W | https://cesiumastro.com/systems/vireo |

### 1C. Commercial relay services usable from LEO
- Viasat InRange (ex-Inmarsat L-band GEO fleet): relays LEO telemetry without ground stations; LEO up to 1,100 km; onboard hardware from Safran Data Systems. https://news.viasat.com/newsroom/press-releases/launch-vehicle-telemetry-expected-to-become-commercially-available-faster-as-inrange-moves-to-market
- Addvalue IDRS (Inmarsat-based LEO command and control relay): ≈6 kg terminal, ~200 kbps class [UNVERIFIED].
- Kepler Network (formerly Aether): optical data relay as a managed service; any spacecraft with an SDA-compatible OCT can connect; first 10 relay satellites launched 11 Jan 2026. https://kepler.space/?p=20867

Diagram implication: 1–2 SDA-compatible OCTs (~15 kg, 50–90 W each, hemispherical gimbal, 2.5 Gbps, 6,500 km) for fleet mesh and relay; S-band CCSDS TT&C with two hemispherical patch antennas; X- or Ka-band downlink for sensor imagery; optional L-band GEO relay for anytime low-rate command during engagements.

## Part 2 — Reference maneuverable / rendezvous spacecraft

| Spacecraft | Bus / mass | Propulsion | Relative-navigation sensors | Notes | Source |
|---|---|---|---|---|---|
| Astroscale ELSA-d (2021–24) | servicer ~175 kg [UNVERIFIED] | chemical, 8 thrusters | laser proximity/ranging sensor + cameras | magnetic capture demonstrated | https://www.astroscale.com/news/astroscales-elsa-d-successfully-demonstrates-repeated-magnetic-capture |
| Astroscale ADRAS-J (2024) | ~150 kg wet; 3.7 × 0.8 × 1.2 m deployed | green monoprop, 8–12 × 1 N [CONFLICT] | angles-only navigation via cameras; IR camera; LiDAR at 50 m | fly-around of H-IIA stage | https://astroscale.com/wp-content/uploads/2024/02/ADRAS-J-Press-Kit-English-2024.pdf |
| ClearSpace-1 | 580 kg wet | green bipropellant | far/close-range cameras + radar | four arms enclose PROBA-1; NET 2029 | https://indico.esa.int/event/516/contributions/9983/attachments/6342/10932/ClearSpace-1%20IOD%20Mission_Clean%20Space%20Days.pdf |
| Northrop MEV-1 / MEV-2 (GEO) | GEOStar-3, 2,326 / 2,875 kg | 2 EP modules | proximity sensors + visual system | docked IS-901 (2020), IS-10-02 (2021) | https://www.eoportal.org/satellite-missions/mev-1 |
| Northrop MRV + DARPA RSGS | launched 21 Jul 2026 | electric | arm cameras + lights | two 7-DOF arms | https://www.darpa.mil/news/2026/robotic-servicing-of-geosynchronous-satellites-lifts-off |
| Starfish Space Otter / Otter Pup 2 | ESPA-class | electric only (ThrustMe) | CETACEAN sensor fusion | Nautilus electrostatic docking | https://www.starfishspace.com/mission/ |
| Impulse Space Mira | 300 kg payload, 500 W | 8 × 26 N N2O/ethane | — | LEO Express-1 (2023) | https://www.impulsespace.com/mira |
| True Anomaly Jackal | ESPA-Grande | high-ΔV chemical (Agile Space) | not published | Victus Haze | https://www.trueanomaly.space/jackal |
| SpaceX Starlink V2 Mini | ~800 kg; two wings ~30 m span | argon Hall 170 mN, 2.1 kg | — | 3 laser ISLs per satellite | https://spaceflightnow.com/2023/02/26/spacex-unveils-first-batch-of-larger-upgraded-starlink-satellites/ |
| USSF GSSAP (GEO) | ~650–700 kg (press estimate) | not disclosed | EO/IR surveillance payload | 6 launched 2014–2022 | https://www.losangeles.spaceforce.mil/About-Us/Fact-Sheets/Display/Article/901960/geosynchronous-space-situational-awareness-program-gssap-satellite/ |
| NASA OSAM-1 (cancelled 2024) | Maxar SSL-1300 | chemical | Relative Navigation System matured by Raven on ISS (visible + IR + flash lidar [UNVERIFIED]) | two 7-DOF arms | https://www.nasa.gov/isam/relative-navigation-system/ |

Pattern: every flown rendezvous vehicle uses a layered sensor suite (wide-field visible for angles-only far range, narrow-field visible + thermal IR for mid-range/eclipse, laser rangefinder or lidar for close range) on the approach face. No retrieved source described radiator layout for any of them.

## Part 3 — Design concerns a credible diagram should show

| # | Concern | Mitigation to depict | Reference |
|---|---|---|---|
| 1 | Cold welding / galling in vacuum | Dissimilar metal pairs; MoS₂ or MoS₂+PFPE films; ceramics/anodizing/DLC at separable contacts. Case: Galileo HGA (1991): Ti-6Al-4V alignment pins with dry-film lube galled after lubricant loss, 3–4 of 18 ribs stuck (NASA TM-105355). | https://ntrs.nasa.gov/api/citations/19920011418/downloads/19920011418.pdf |
| 2 | Atomic oxygen at 600–800 km | Kapton erosion yield 3.0×10⁻²⁴ cm³/atom; AO-resistant outer MLI (SiOx-, Ge- or ITO-coated Kapton). NASA-HDBK-6024. | https://standards.nasa.gov/sites/default/files/standards/NASA/Baseline-w/CHANGE-2/2/2022-12-16-NASA-HDBK-6024_w-Chg-2_Reval-Final.pdf |
| 3 | MMOD (600–1,000 km is the densest LEO band) | Whipple / stuffed-Whipple (bumper + Nextel/Kevlar + rear wall) over tanks and optics bench; NASA/TM-2009-214785 handbook. | https://ntrs.nasa.gov/api/citations/20120002584/downloads/20120002584.pdf |
| 4 | Radiation at ~800 km SSO | ~5 krad/yr behind 1.85 mm Al (SPENVIS); 2–4 mm Al-equivalent box walls, spot shielding, rad-tolerant parts, latch-up protection. | https://arxiv.org/pdf/1306.6773 |
| 5 | Thermal control (dawn-dusk: one side always sunlit) | MLI, OSR radiators on anti-sun face, loop heat pipes, deployable radiators, louvers, survival heaters. | https://www.nasa.gov/wp-content/uploads/2023/05/7.-soa-thermal-2022.pdf |
| 6 | Outgassing / contamination | ASTM E595 screening (TML ≤1.0 %, CVCM ≤0.10 %), bake-out, vent paths away from optics, aperture doors during EP firing. | https://data.nasa.gov/dataset/spacecraft-material-outgassing-data |
| 7 | Charging / ESD in polar auroral zone | NASA-HDBK-4002B / NASA-STD-4005: conductive/ITO-coated outer surfaces, single-point ground, bleed resistors, limited array string voltage. | https://standards.nasa.gov/node/185 |
| 8 | Launch locks / HDRMs | EBAD NEA Model 9100 (6 kN preload, low shock); TiNi Frangibolt (SMA, resettable). One per deployable. | https://www.ebad.com/wp-content/uploads/2023/09/NEA-9100-HDRM-SllSht-1-27-2022Web.pdf |
| 9 | Lubricants / bearing life | Braycote 601EF for ball bearings; sputtered MoS₂ dry films; MoS₂+PFPE hybrid synergistic (ESTL). | https://esrtechnology.com/wp-content/uploads/2026/06/AMS-40-2010-Buttery-An-Evaluation-of-Liquid-Solid-and-Grease-Lubricants-for-Space-Mechanisms-Using-a-SOT.pdf |
| 10 | Solar array drives | Moog Small-Sat SADA ≤1.36 kg; Type 3/5 ~4.9 kg; Honeybee Micro-Sat SADA 0.9–1.45 kg. Fixed arrays are acceptable in dawn-dusk SSO. | https://www.moog.com/content/dam/moog/literature/sdg/space/spacecraft-mechanisms/moog-solar-array-drive-assembly-sada-family-datasheet.pdf |
| 11 | Deployable arrays | Redwire ROSA: 100–120 W/kg, strain-energy composite booms, "Diamond" 36 kg / 3.3 kW to "SunStone" 331 kg / 28 kW; flown on ISS iROSA, DART, Gateway. | https://rdw.com/product-archive/power/rosa/ |
| 12 | Hall-thruster plume impingement | plume half-angle ~40–45°; CEX ions sputter and deposit; keep sensitive surfaces out of the cone, close aperture doors during burns. | https://ntrs.nasa.gov/api/citations/19940020293/downloads/19940020293.pdf |
| 13 | Laser safety / deconfliction | Register with the USSF Laser Clearinghouse (space-based lasers register by catalog number and altitude band); predictive-avoidance firing windows; DoDI 3100.11. | https://www.vandenberg.spaceforce.mil/News/Features/Display/Article/920559/laser-tagged-how-the-jspoc-manages-laser-deconfliction/ |
| 14 | GPS / time sync | dual-frequency space GNSS receiver with 1-PPS distribution to OBC, laser timing and OCT [UNVERIFIED]. | — |
| 15 | Autonomy / collision avoidance | 18 SDS screens all operators via Space-Track; 19 SDS close-approach prediction; CDMs; LeoLabs commercial screening; onboard CA autonomy plus ephemeris sharing. | https://www.nasa.gov/cara/frequently-asked-questions |

## Part 4 — Visual / technical references for a 3D modeler
- NASA 3D Resources hub: https://nasa3d.arc.nasa.gov ; GitHub mirror https://github.com/nasa/NASA-3D-Resources
- ICESat-2 / ATLAS: https://icesat-2.gsfc.nasa.gov/how-it-works ; ATLAS functional diagram https://ntrs.nasa.gov/api/citations/20230010087/downloads/Martino_12512-17v2.pdf (0.8 m beryllium telescope, laser bench)
- Starlink V2 Mini imagery: https://spaceflightnow.com/2023/02/26/spacex-unveils-first-batch-of-larger-upgraded-starlink-satellites/ ; https://starlink.com/technology
- ClearSpace-1 views: https://eoportal.org/other-space-activities/clearspace-1
- ADRAS-J press kit: https://astroscale.com/wp-content/uploads/2024/02/ADRAS-J-Press-Kit-English-2024.pdf
- Optical terminal form factors: https://www.ga.com/space-systems/img/OCT_DS_0521E.pdf ; https://mynaric.com/products/space/condor-mk3/
- Mechanisms: EBAD NEA 9100, Moog SADA family, Redwire ROSA (links above)
