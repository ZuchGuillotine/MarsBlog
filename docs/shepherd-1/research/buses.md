# Shepherd bus trade study: COTS satellite bus spec survey

Research sweep, 2026-11-01. Working notes; see `README.md` in this folder for the caveats.

## 0. How the data was gathered, and its limits

- Direct page fetches failed on every vendor host tried (network allow-list), so every number below comes from search-engine excerpts of the cited page, not a direct read of the datasheet. Treat them as "quoted by the cited URL" and re-verify against the PDF before putting them on a drawing.
- Legend: **n/p** = not published, or not found in the sources reached. **(?)** = conflicting or weakly sourced. **[mem]** = background knowledge, not from a retrieved source; verify.

## 1. Standard launch interfaces and reference classes

### 1.1 Moog ESPA ring (15-inch standard) and ESPA Grande (24-inch)

| Item | ESPA (standard) | ESPA Grande | Source |
|---|---|---|---|
| Ports | 6 × Ø15 in (381 mm) bolt circle | 4 × Ø24 in (610 mm) | [Moog ESPA ring datasheet](https://www.moog.com/content/dam/moog/literature/sdg/space/structures/moog-sais-espa-ring-datasheet.pdf) |
| Ring height | 24 in | 42 in | same |
| Port payload mass | 257 kg (ESPA Heavy option: 450 kg with 5/16-in bolts) | 700 kg (qualified by test, "up to 1543 lb") | same; [Moog ESPA page](https://www.moog.com/products/spacecraft-payload-interfaces/espa.html) |
| Ring mass | 136 kg | 211 kg | Moog datasheet |
| Per-port envelope (nominal) | 24 × 28 × 38 in (610 × 711 × 965 mm) | 42 × 46 × 38 in (1067 × 1168 × 965 mm) | [Wikipedia, EELV Secondary Payload Adapter](https://en.wikipedia.org/wiki/EELV_Secondary_Payload_Adapter) |
| CG constraint | CG within 20 in of port plane | same | [Moog tech highlights](https://moog.com/sdg-space-console/home/tech-highlights/espa.html) |
| Note | Older literature quotes 181 kg/port (classic USAF ESPA) [mem] | Pre-test Ø24 advertised capability was 318 kg at 20 in ([SmallSat 2018](https://digitalcommons.usu.edu/smallsat/2018/all2018/414)) | |

Design takeaway: an "ESPA-class" Shepherd is bounded by ~257–450 kg and a 0.61 × 0.71 × 0.97 m stowed box; "ESPA-Grande-class" by ~700 kg and 1.07 × 1.17 × 0.97 m. The 38 in dimension is the radial stand-off from the port (CG must be inside 20 in of it).

### 1.2 SpaceX Falcon 9 Rideshare (Transporter/Bandwagon) plate classes

| Plate | Bolt pattern | Included mass | Source |
|---|---|---|---|
| Half plate | 8 in or 15 in | 100 kg | [spacex.com/rideshare](https://spacex.com/rideshare) |
| Full plate | 15 in or 24 in | 200 kg | same |
| Full plate, XL volume | 24 in | 300 kg | same |
| Price | — | $7,000/kg (2026 launches), $7,500/kg (2027) per third party (?) | [newspaceeconomy.ca](https://newspaceeconomy.ca/2026/02/27/spacex-rideshare-pricing-as-of-february-2026-what-it-costs-whats-included-and-how-buyers-budget-a-mission/) |

The XL-plate stowed envelope dimensions are in the Rideshare Payload User's Guide (RPUG), which could not be opened. "Included mass" is a pricing tier, not a structural limit; additional mass can be purchased up to the port limit.

### 1.3 SDA Transport Layer reference

| Item | Value | Source |
|---|---|---|
| Tranche 1 Transport Layer buy | 126 satellites (Feb 2022 awards); Northrop Grumman 42 of them; York and Lockheed Martin the others | [eoPortal SDA](https://eoportal.org/satellite-missions/sda) |
| Optical crosslinks | 3–5 per satellite planned; Class A ≥4 OCTs, Class B 2 OCTs; 1550 nm standard | [Defense Daily](https://www.defensedaily.com/?p=1066521) |
| Per-satellite mass | Third-party catalog entries list 300 kg and 400 kg (?) | [keeptrack SOTD](https://keeptrack.space/satellite-of-the-day/sotd-2026-08-13) |

## 2. CubeSat-class buses (12U–27U)

| Manufacturer / product | Form factor | Bus / max S/C mass | Payload mass | Payload power (OAP / peak) | Pointing | Heritage | Price | Source |
|---|---|---|---|---|---|---|---|---|
| Kongsberg NanoAvionics M16P | 16U | Bus ~8 kg; max S/C 36 kg | ~21.5 kg | 17.5–25 W avg | n/p | TRL 9 | n/p | [NanoAvionics M16P](https://nanoavionics.com/small-satellite-buses/16u-cubesat-nanosatellite-m16p/) |
| EnduroSat 16U | 16U | Bus 10–14 kg (?) | 18–24 kg (?) | 27–50 W avg (?) | <0.1° | flown | n/p | [EnduroSat 16U](https://endurosat.com/products/16u-platform) |
| GomSpace 16U kit | 16U | Max S/C 24 kg | up to 17 kg | 67/116 W BOL generation | n/p | GOMX series | n/p | [GomSpace Platform Kits](https://gomspace.com/wp-content/uploads/2025/09/Platform-Kits.pdf) |
| AAC Clyde Space EPIC (16U) | 16U | n/p | n/p | 10 W OAP (6U/12U) | ≤0.1° | first 16U ordered 2024 | EUR 2.3 M for one 16U satellite incl. commissioning | [AAC press release](https://cdn.bequoted.com/media/1/655fbc7f-4f5a-4512-929c-d2ed7528e185/AAC-Clyde-Space-Press-release-2024-05-15.pdf) |
| Spire LEMUR 16U | 16U | total 24–28 kg | 14–23 kg (?) | 100 W OAP / 300 W peak | n/p | large fleet | n/p | [Spire LEMUR spec](https://spire.com/space-services/lemur-space-platform/) |
| Argotec HAWK 12 / 27 | 12U / 27U | 12U wet <36 kg | 12 kg / 30 kg | 220 W generated (12U) | n/p | LICIACube, ArgoMoon | n/p | [NASA RSDO 12U](https://assets.science.nasa.gov/content/dam/science/cds/spacecraft-development/rsdo/rapid-iv-catalog/12U_Summary_Rapid_IV_RSDO.pdf) |
| Millennium ALTAIR | 27U-class core | TRACERS NTE 200 kg | up to 50 kg | 90 W | n/p | ALTAIR Pathfinder, TRACERS | E1 variant listed at $500,000 (dated) | [TRACERS](https://tracers.physics.uiowa.edu/node/146) |

CubeSat-class verdict: best published payload power in the 16U class is ~50 W OAP (EnduroSat) to ~100 W OAP / 300 W peak (Spire). Useful only for a sub-100 W pointing/tracking demo, not for ablation.

## 3. ESPA / microsat class (≈100–500 kg)

| Manufacturer / product | Class | Mass | Payload mass | Payload power | Pointing (3σ) | Propulsion / ΔV | Heritage | Source |
|---|---|---|---|---|---|---|---|---|
| NanoAvionics MP42 (Gen-2) | ESPA 15-in | max S/C 200 kg | 100 kg | 157–161 W avg | n/p | n/p | >120 kg unit flown | [NanoAvionics MP42](https://nanoavionics.com/small-satellite-buses/2613-2/) |
| NanoAvionics MP42D | 500 kg class | 500 kg | 250 kg | n/p; 3.4 kWh storage | n/p | n/p | announced Aug 2026 | [NanoAvionics MP42D](https://nanoavionics.com/?p=201271) |
| Apex Space Aries (LEO) | ESPA 15-in | dry 125 kg; wet ~200 kg | up to 150 kg | 175 W OAP EOL base / 500 W OAP high-power | knowledge <215 arcsec, control <430 arcsec | ΔV up to 800 m/s | Aries SN1 flown 2024 | [Apex LEO Aries](https://apexspace.com/platforms/leo-aries) |
| Apex Space Nova | ESPA-Grande | bus 200 kg; max wet 500 kg | 300 kg payload + fuel | 1 kW OAP | n/p | n/p | Loft Orbital procured | [Apex models](https://www.apexspace.com/models) |
| York S-CLASS | ESPA | total ~180 kg | 85–90 kg | 100 W OAP (?) / 500 W peak | n/p | n/p | SDA Tranche 0 & 1 | [York platforms](https://yorkspacesystems.com/platforms) |
| York LX-CLASS | ESPA / ESPA-Grande | total >350 kg | 300 kg+ | 1.5 kW peak | n/p | n/p | in production since 2021 | [Via Satellite](https://www.satellitetoday.com/manufacturing/2021/04/28/york-space-systems-introduces-larger-more-powerful-lx-class-spacecraft/) |
| Blue Canyon X-SAT Saturn / Saturn-400 | ESPA-Grande | n/p | 200 kg class | n/p | RW or CMG options | Dawn Aerospace green biprop | MethaneSAT (2024) | [BCT spacecraft](https://bluecanyontech.com/spacecraft) |
| Rocket Lab Photon / Pioneer / Lightning | ESPA-class | Photon bus ~50 kg | 120–180 kg | Lightning 3 kW system (?) | n/p | Curie / HyperCurie | Varda, CAPSTONE, ADRAS-J kick stage | [Rocket Lab bus lineup](https://rocketlabcorp.com/updates/new-blog-post-16/) |
| Terran Orbital (Lockheed) Nebula | ESPA / Grande | wet up to 250 kg | up to 130 kg | array 1 kW max | 10–50 arcsec | n/p | SDA T1 buses | [Nebula datasheet](https://terranorbital.com/wp-content/uploads/2024/10/0073_TO_NEBULA_PLATFORM_101024.pdf) |
| Loft / Airbus US Arrow 150 | ESPA | 200 kg total | 100 kg, 1 m³ | 250 W OAP EOL / 700 W peak | n/p | 800 m/s | >600 Arrow flown (OneWeb) | [Arrow brochure](https://airbusus.com/wp-content/uploads/2023/08/ARROW-Family-Brochures.pdf) |
| Airbus US Arrow 450 | ESPA-Grande | n/p | 200–300 kg | 450–820 W OAP EOL; 3.0 kW peak | n/p | n/p | SDA Transport | [airbusus.com/arrow450](https://airbusus.com/arrow450/) |
| Muon Space Halo (MuSat XL) | to 500 kg | 500 kg launch | n/p | 1 kW avg payload power | n/p | n/p | FireSat flown 2026 | [Muon Halo](https://www.muonspace.com/halo-platform-released/) |
| Impulse Space Mira | ESPA-Grande OTV | n/p | up to 300 kg | 500 W (upgraded: >2×) | n/p | 8 × 26 N; 500 m/s @300 kg, 900 m/s @100 kg | LEO Express-1 (2023) | [Impulse Mira](https://www.impulsespace.com/mira) |
| True Anomaly Jackal | ESPA-Grande | ~275 kg (?) | 50 kg & 200 W baseline; 200 kg & 1 kW GEO config | n/p | 20 thrusters; 800–1,000 m/s | Jackal-01/02 (2024) | [True Anomaly Jackal](https://www.trueanomaly.space/jackal) |
| Astroscale ADRAS-J | ESPA-class | ~150 kg wet | mission-specific | n/p | n/p | 12 × 1 N green monoprop | fly-around of H-IIA stage 2024 | [Gunter ADRAS-J](https://space.skyrocket.de/doc_sdat/adras-j.htm) |
| Northrop ESPAStar-D | propulsive ESPA ring | dry 430–470 kg | ~320 kg per port | 800 W OAP / 850 W EOL peak | n/p | hydrazine 360–800 m/s (?) | LDPE-1/2/3 | [ESPAStar-D brochure](https://rsdo.gsfc.nasa.gov/images/catalog-rapidIV/ESPAStar-D_Brochure.pdf) |
| Redwire Hammerhead | ESPA / Grande | 175 kg wet | up to 120 kg | up to 517 W | n/p | n/p | PROBA-V, ALTIUS | [Redwire Hammerhead](https://redwirespace.com/capabilities/hammerhead) |
| Redwire SabreSat (VLEO) | ~400 kg | ~400 kg | ~200 kg | up to 5,000 W OAP EOL | n/p | EP | in development | [Redwire SabreSat](https://redwirespace.com/capabilities/sabresat) |

## 4. Larger reference class (≈0.6–3 t)

| Product | Mass | Power | Propulsion | Source |
|---|---|---|---|---|
| SpaceX Starlink V2 Mini | ~800 kg (FCC design); 525–740 kg in other reports (?) | two arrays each 12.8 m long; array area 116 m² not confirmed | Argon Hall thruster: 170 mN, 2,500 s, 4.2 kW, 2.1 kg, centre-mounted cathode | [Spaceflight Now](https://spaceflightnow.com/2023/02/26/spacex-unveils-first-batch-of-larger-upgraded-starlink-satellites/), [Tesmanian quoting SpaceX](https://www.tesmanian.com/de/blogs/tesmanian-blog/starlink-v2) |
| SpaceX Starlink V3 | ~2,000 kg | n/p (~60 m wingspan reported) | argon Hall [mem] | [Gunter Starlink V3](https://space.skyrocket.de/doc_sdat/starlink-v3.htm) |
| Lockheed LM 400 | bus up to 1,000 kg | up to 14 kW peak payload | n/p | [LM 400 card](https://sustainability.lockheedmartin.com/content/dam/lockheed-martin/space/documents/lm400/22-02556_LM400_Asize_2022_02.pdf) |
| Maxar Legion / 500-series | ~700 kg (Legion); 5–9 kW parent class | | | [Maxar 2019 deck](https://terralink.kz/upload/Download/2019-11-22/2_Maxar_Presentation.pdf) |
| ESA ClearSpace-1 (OHB bus) | 580 kg wet incl. margin | ~600 W (2021) (?) | n/p | [ESA Clean Space Days 2024](https://indico.esa.int/event/644/contributions/12346/attachments/7636/14732/CleanSpaceDays_ADRIOS_ClearSpace1_Woicke.pdf) |

## 5. Which buses could host a 1 kW / 5 kW / 20 kW electrical payload

Assumptions (ours): a DPSS laser at 25–35 % wall-plug rejects 65–75 % of input as heat; a LEO radiator at 290–300 K rejects ~250–350 W/m² net; triple-junction arrays give ~200–250 W/m² EOL sun-pointed.

**(a) ~1 kW class**: Apex Nova (1 kW OAP), Muon MuSat XL (1 kW), Airbus Arrow 450 (450–820 W OAP, 3 kW peak, best heritage), Northrop ESPAStar-D (800 W, propulsive), True Anomaly Jackal GEO config (1 kW, 200 kg, 1,000 m/s, designed for RPO), York LX-CLASS (1.5 kW peak), Terran Nebula (1 kW array). Marginal: Apex Aries high-power, Hammerhead, Mira. CubeSats are out.

**(b) ~5 kW class**: no ESPA/ESPA-Grande COTS bus publishes ≥5 kW OAP. Candidates: Redwire SabreSat (5 kW but VLEO), LM 400 (14 kW peak), Maxar 500-series, Starlink V2 Mini-class (not sold). The pragmatic route for an ESPA-Grande Shepherd is a ~1 kW OAP bus core with mission-specific arrays (Redwire ROSA Diamond class, 3.3 kW / 36 kg) and battery buffering, plus a pumped-loop deployable radiator.

**(c) ~20 kW class**: no COTS smallsat bus; this is a 2–3 t custom vehicle (Starlink V3 class, ~60 m span) launched dedicated, not rideshare.

## 6. Least certain numbers

Starlink V2 Mini array area and mass; BCT Venus/Saturn payload power; York S-CLASS OAP; SDA Tranche 1 per-satellite mass; Apex Aries base OAP; ESPAStar-D ΔV; LM 400 mass; SpaceX XL-plate stowed envelope (RPUG).
