// Content for /construction/sintering-bricks (Solar Regolith Paving).
// Numbers carry a `kind` so the page can label them consistently:
//   'measured'   – published measurement by someone else (cited)
//   'reference'  – industrial / textbook reference value (cited)
//   'calculated' – our arithmetic from cited inputs (shown on the page)
//   'projection' – our projection; assumptions shown in "How we got this number"
//   'target'     – a design target set before testing
//   'estimate'   – a cost or schedule estimate for the owner to confirm

export type Kind =
  | 'measured'
  | 'reference'
  | 'calculated'
  | 'projection'
  | 'target'
  | 'estimate';

export const contact = {
  email: 'feedback@haidaa.com',
  collaborate:
    'mailto:feedback@haidaa.com?subject=Solar%20regolith%20paving%20%E2%80%94%20collaboration',
  fund: 'mailto:feedback@haidaa.com?subject=Solar%20regolith%20paving%20%E2%80%94%20funding%20V1',
};

export const glance = [
  { k: 'Stage', v: 'V1 Earth test head. Hardware in procurement.' },
  {
    k: 'What exists',
    v: 'Process design, V1 experiment plan with kill criteria, test materials being gathered.',
  },
  {
    k: 'Next milestone',
    v: 'First melt pools: fine vs coarse basalt beds, same flux, sectioned for depth.',
  },
  {
    k: 'What we need',
    v: 'V1 funding ($15k–40k, estimate), optics and ceramics collaborators, an argon or vacuum test partner.',
  },
];

export const heroNumbers: { value: string; label: string; kind: Kind }[] = [
  {
    value: '5 cm',
    label: 'target depth per pass. ESA PAVER: ~2 cm.',
    kind: 'target',
  },
  {
    value: '3–5 MJ/kg',
    label: 'energy per kg placed. PAVER lab parameters: ~10–14 MJ/kg.',
    kind: 'projection',
  },
  {
    value: '~70 %',
    label: 'filler the pool can absorb if the filler is preheated to 1,000 °C. Cold filler: ~30 %.',
    kind: 'calculated',
  },
  {
    value: '300–450 MPa',
    label: 'compressive strength of industrial cast basalt, the target material class.',
    kind: 'reference',
  },
];

export const problemStats = [
  {
    value: '155 m',
    text: 'Distance from the Apollo 12 lunar module to Surveyor 3. The Surveyor was still sandblasted: ~103 pits/cm², and that was the edge of the plume.',
    ref: 'immer2011',
  },
  {
    value: '300–2,000 m/s',
    text: 'Estimated speed of regolith ejected by the Apollo 12 descent plume. Lunar escape velocity is ~2,400 m/s.',
    ref: 'immer2011',
  },
  {
    value: '5–18 cm',
    text: 'Soil eroded under the Phoenix lander on Mars, exposing subsurface ice. Cratering under a human-class Mars lander could threaten the mission.',
    ref: 'watkins2021',
  },
];

export const paverFacts = [
  ['Team', 'BAM, Aalen Univ., Clausthal Univ. of Technology, LIQUIFER, DLR; ESA-funded'],
  ['Heat source', '12 kW CO₂ laser standing in for a ~2.37 m² Fresnel lens'],
  ['Feed', 'EAC-1A lunar simulant, dried 3 days at 180 °C to stop bubbling'],
  ['Process', '45 mm spot at 188 W/cm² (~3 kW), 5 mm/min'],
  ['Product', 'Interlocking hollow-triangle tiles ~20–25 cm across'],
  ['Depth', '~1.8–2 cm per layer; 2.5 cm max after a 40-minute stationary dwell'],
  ['Strength', '94 MPa compressive, ~4.8 % porosity'],
  ['Estimate', '100 m² pad at 2 cm thick in ~115 days (ESA)'],
];

export const paverLimits = [
  'Slow: a 45 mm spot moving at 5 mm/min.',
  'Glassy, smooth top surface; crystalline only lower in the layer.',
  'Fine powder feed: a regolith dust bed insulates, so melt depth stalls near 2 cm.',
  'Re-heating an already solid track cracks it; tile geometry had to avoid crossovers.',
];

export const physics = [
  {
    title: 'Energy',
    body: 'Melting basalt from ambient takes about 2 MJ/kg in theory (sensible heat plus ~0.4–0.5 MJ/kg latent). In practice, full-melt processes spend several times that, because a 1,400 °C surface radiates ~440 kW/m² into vacuum. We melt only 25–30 % of the placed mass and bring the rest to ~1,000 °C, where radiative loss is a third as large.',
    stat: 'σT⁴ at 1,400 °C ≈ 440 kW/m²; at 1,000 °C ≈ 150 kW/m² (ε = 1)',
  },
  {
    title: 'Fracture',
    body: 'Glass has no crack-arrest mechanism. Unmelted crystalline aggregate deflects and pins cracks. Industrial cast basalt, melted at ~1,280–1,300 °C and cooled slowly in kilns, recrystallizes to pyroxene and reaches 300–450 MPa compressive strength with Mohs hardness 8.',
    stat: 'PAVER glass tiles: 94 MPa. Cast basalt: 300–450 MPa.',
  },
  {
    title: 'Seeding',
    body: 'Filler of the same composition acts as a nucleant. A seeded basaltic mush should crystallize faster and at less undercooling than a clean melt, giving a cast-basalt-like ceramic instead of glass. V1 tests this directly.',
    stat: 'Hypothesis under test in V1 (experiment 04).',
  },
  {
    title: 'Heat transfer',
    body: 'A regolith dust bed in vacuum conducts about 0.001–0.01 W/m·K. Solid basalt conducts ~1.5–2.5 W/m·K, 100–1,000× more. Flux on cobbles couples deeper than flux on dust. Coarse feed also carries less adsorbed volatile per kg.',
    stat: 'Lunar regolith: 0.00074 W/m·K at the surface (Diviner); 0.01–0.03 at depth (Apollo).',
  },
];

// PAVER vs this project. Right column values are projections/targets unless marked.
export const comparison: { row: string; paver: string; ours: string; kind: Kind }[] = [
  {
    row: 'Feed preparation',
    paver: 'Fine simulant powder, oven-dried',
    ours: 'Coarse rock windrowed in place; fines preheated and degassed on board. No sieving.',
    kind: 'target',
  },
  {
    row: 'Mass melted',
    paver: '~100 %',
    ours: '25–30 %; remainder preheated filler',
    kind: 'target',
  },
  {
    row: 'Energy per kg placed',
    paver: '~10–14 MJ/kg of beam energy (our calculation from the lab track parameters)',
    ours: '3–5 MJ/kg delivered',
    kind: 'projection',
  },
  {
    row: 'Depth per pass',
    paver: '~1.8–2 cm',
    ours: '≥5 cm',
    kind: 'target',
  },
  {
    row: 'Surface',
    paver: 'Glassy, smooth',
    ours: 'Grooved by the screed for traction',
    kind: 'target',
  },
  {
    row: 'Microstructure',
    paver: 'Glass on top, dendritic crystals below',
    ours: 'Crystalline throughout (seeding + annealing hood)',
    kind: 'target',
  },
  {
    row: 'Cracking',
    paver: 'Cracks when a solid track is re-heated',
    ours: 'Cracks directed into joints scored every 0.5–1 m',
    kind: 'target',
  },
  {
    row: 'Placed volume per m² of collector per sunlit day',
    paver: '0.003–0.004 m³ (lab parameters) · 0.007 m³ (ESA pad estimate)',
    ours: '0.0065–0.011 m³',
    kind: 'projection',
  },
];

export const throughput = {
  assumptions: [
    ['Collector aperture', '10 m²'],
    ['Lunar beam irradiance', '1,361 W/m²'],
    ['Optical efficiency (reflectance × intercept × tracking)', '0.75 (assumed)'],
    ['Power delivered to the ground', '≈ 10.2 kW'],
    ['Pad', '10 × 10 m × 5 cm = 5 m³'],
    ['Product density', '2.7 t/m³ (cast basalt 2.9–3.0, minus ~7 % porosity, assumed)'],
    ['Mass placed', '≈ 13.5 t'],
    ['Ideal heat content of the product', '0.3 × 2.1 MJ/kg (melt to 1,450 °C) + 0.7 × 1.0 MJ/kg (filler to 1,000 °C) ≈ 1.3 MJ/kg'],
    ['Assumed thermal efficiency', '26–43 % → 3–5 MJ/kg delivered. PAVER’s lab parameters imply ~15–20 %.'],
  ],
  result: '13.5 t × 3–5 MJ/kg ÷ 10.2 kW ≈ 46–77 days of sunlight per 100 m² pad at 5 cm.',
  calendar:
    'At an equatorial mare site the Sun is up ~14.8 of every 29.5 days, so ≈ 3–5 calendar months. Polar ridges with longer illumination shorten this.',
  paverBasis:
    'PAVER basis: ~3 kW at 10–14 MJ/kg and ~2.8 t/m³ gives 0.007–0.009 m³/day from a ~2.37 m² lens (0.003–0.004 m³ per m² per day). ESA’s 115-day estimate (2 m³, same lens assumed) gives 0.007. We project 0.0065–0.011.',
  honest:
    'Against ESA’s own pad estimate, our volume rate per m² of collector is similar. The gains we are testing are depth per pass (5 cm vs 2 cm), a crystalline grooved surface, controlled cracking, and no fines preparation. Against the published lab parameters the rate gain is 2–4×.',
};

export const pushback = [
  {
    n: '01',
    problem: 'Cold filler freezes the pool.',
    numbers:
      'A pool at 1,450 °C has ~0.5 MJ/kg of usable heat before a mare-basalt mush locks up near 1,150 °C. Cold filler needs ~1.2 MJ/kg to reach that. Stirring in cold filler caps it at ~30 % by mass.',
    response:
      'Preheat the filler to ~1,000 °C (~0.2 MJ/kg still needed) and the pool can take ~70 %, an asphalt-like aggregate ratio. The preheat/degas car and a two-zone flux footprint (annular preheat + concentrated core, shaped by the iris) follow from this.',
  },
  {
    n: '02',
    problem: 'Volatiles foam the melt.',
    numbers:
      'Lunar fines hold solar-wind gases. Martian fines released ~2 wt % water when Curiosity heated them to 835 °C; oxychlorines release O₂ and HCl at ~200–600 °C; iron sulfates release SO₂ from ~500–550 °C, magnesium sulfate from ~780 °C; calcium sulfate is stable past 1,000 °C.',
    response:
      'Degas at 600–1,000 °C before the material reaches the pool. On Mars this step is required. PAVER oven-dried its simulant for 3 days to stop bubbling; we do it in-line.',
  },
  {
    n: '03',
    problem: 'Radiation quenches the surface to glass.',
    numbers:
      'A 1,000 °C surface still radiates ~150 kW/m² to space. Cooling through the 1,100 → 900 °C crystallization window happens in seconds on a bare ribbon, which is why full-melt tiles come out glassy on top.',
    response:
      'A polished-metal hood trails the melt and reflects most of that radiation back, plus low afterheat from spillover flux. Target: cut net radiative loss ~80 % so the ribbon cools slowly and crystallizes. The LWIR camera measures the cooling rate; hood position is the actuator. It is sheet metal.',
  },
  {
    n: '04',
    problem: 'Thermal contraction cracks a continuous ribbon.',
    numbers:
      'From a ~900 °C set point to lunar night is ~1,000 K. With cast basalt’s 8–9 × 10⁻⁶/K expansion, that is ~0.8 % free contraction against well under 0.1 % tensile strain capacity.',
    response:
      'Score contraction joints every 0.5–1 m while the mush is still soft, as with concrete control joints. Same-composition filler and matrix keep internal expansion mismatch small.',
  },
];

export const stations = [
  {
    n: '01',
    name: 'Grade',
    temp: 'Ambient',
    text: 'Steel blade and rake windrow fist-sized rock into the lane and firm the subgrade. No sieving, minimal excavation.',
  },
  {
    n: '02',
    name: 'Preheat / degas',
    temp: '600–1,000 °C',
    text: 'Reflective hood and spillover flux heat the windrow and the filler fines. Water, chlorine and sulfur species vent before they reach the pool.',
  },
  {
    n: '03',
    name: 'Melt',
    temp: 'Pool ~1,400–1,450 °C',
    text: 'The dish focuses on the coarse rock; cobbles melt into a pool. A chute meters preheated fines in to form a crystal mush of up to ~70 % solids.',
  },
  {
    n: '04',
    name: 'Screed',
    temp: 'Mush 1,000–1,200 °C',
    text: 'A boron-nitride paddle spreads and lightly compacts the mush behind the hot core, presses traction grooves, and scores a contraction joint every 0.5–1 m.',
  },
  {
    n: '05',
    name: 'Anneal',
    temp: '1,100 → 900 °C, slow',
    text: 'A long polished hood keeps the ribbon hot through the crystallization window so it sets as ceramic, not glass. Wheels run outside the paved lane.',
  },
];

export const feedstock = [
  {
    name: 'Columbia River basalt, crushed',
    role: 'V1 bulk feed',
    note: 'Free or cheap in Washington. Tholeiitic basalt: a reasonable, lower-iron analogue for mare basalt. Lets us burn through hundreds of kilograms learning the process.',
  },
  {
    name: 'LMS-1 (Exolith)',
    role: 'Lunar mare validation',
    note: 'Mineral-based mare simulant: pyroxene, glass-rich basalt, anorthosite, olivine, ilmenite. The main lunar validation feed.',
  },
  {
    name: 'LHS-1 (Exolith)',
    role: 'Lunar highland check',
    note: 'Anorthosite-rich highland simulant. Tests how far the process degrades on the harder-to-melt terrain.',
  },
  {
    name: 'MGS-1 (Exolith)',
    role: 'Mars validation',
    note: 'Rocknest-based Mars global simulant. Tests degassing and foaming with Mars-like chemistry.',
  },
];

export const terrain = [
  {
    name: 'Mare basalt (Moon)',
    note: 'FeO- and TiO₂-rich; Apollo 12 basalt starts crystallizing at ~1,230 °C. Melts much more easily than highland rock. First choice.',
  },
  {
    name: 'Highland anorthosite (Moon)',
    note: 'Plagioclase-rich; anorthite melts at ~1,550 °C. Workable but needs more flux per kg.',
  },
  {
    name: 'Mare regolith grain size',
    note: 'Median grain ~0.07 mm; 95 % finer than ~1.4 mm. Coarse cobbles concentrate around fresh craters, so the demo site is mare next to an ejecta field.',
  },
  {
    name: 'Mars rock cover',
    note: 'Modal rock cover ~6 % of surface area from orbital thermal data; no 1° × 1° region is rock-free. Landing sites measured 5–40 %. Coarse aggregate is easier to find on Mars than on the Moon.',
  },
];

export const blade = [
  {
    name: 'Hexagonal boron nitride (h-BN)',
    note: 'Not wetted by most molten glasses and metals; standard release coating for glass forming and foundry work. Rated ~900 °C in air, ~1,400 °C in vacuum. Low mechanical strength and needs renewal, so the paddle has replaceable edges.',
  },
  {
    name: 'Flight stack (Moon): BN on molybdenum / TZM',
    note: 'Refractory metal holds shape at screed temperature in vacuum. For Mars CO₂, the substrate choice is open: molybdenum oxidizes, and BN forms and loses a B₂O₃ layer in oxidizing gas.',
  },
  {
    name: 'V1: BN-coated steel',
    note: 'Cheap coupons. In Earth air at 1,000–1,200 °C the BN coating is above its air rating, so it is re-sprayed each run and blade wear is logged.',
  },
  {
    name: 'Not graphite',
    note: 'Carbon reduces FeO in the melt (gas bubbles, metallic iron) and burns in hot CO₂.',
  },
];

export const moonMars = [
  {
    row: 'Beam irradiance',
    moon: '1,361 W/m², no atmosphere',
    mars: '~590 W/m² above the atmosphere; ~200–400 W/m² direct beam at noon on clear sols (τ ≈ 0.4–0.9)',
  },
  {
    row: 'Collector area for the same melt power',
    moon: '1× (10 m² in the projection)',
    mars: '~3–7× at noon on a clear sol; more over a full day',
  },
  {
    row: 'Sunlight duty cycle',
    moon: '~14.8 days on, ~14.8 off (equator); longer at polar ridges',
    mars: 'Several usable hours per sol; weeks of downtime in dust storms (τ reached 10.8 in 2018)',
  },
  {
    row: 'Atmosphere and dust',
    moon: 'Vacuum: good for melting, no oxidation; abrasive, electrostatically charged dust',
    mars: '~6 mbar CO₂: oxidizes BN and metals; dust settles on and abrades optics',
  },
  {
    row: 'Coarse aggregate',
    moon: 'Scarce in mare regolith; concentrated in crater ejecta',
    mars: 'Common: modal rock cover ~6 %, 5–40 % at landing sites',
  },
  {
    row: 'Volatiles to remove',
    moon: 'Solar-wind implanted gases in fines',
    mars: '~2 wt % water, perchlorates/chlorates, sulfates',
  },
  {
    row: 'Verdict',
    moon: 'Easier first deployment',
    mars: 'Adaptation: bigger collector, sealed optics, mandatory degassing',
  },
];

export const roadmap = [
  {
    v: 'V1',
    status: 'Current · hardware in procurement',
    title: 'Earth control head + solar concentrator',
    build: [
      '~1 m² Fresnel concentrator on a 4-DOF head',
      'Computer-controlled iris aperture, 300 mm–1 m, on LinuxCNC + Python',
      'Blink-and-read: close the iris ~50 ms, read true thermal emission with no reflected sunlight, reopen — synchronized in LinuxCNC',
      'Two-colour ratio pyrometer (emissivity swings between dust, melt and slag)',
      'RGB video of the pool; LWIR camera on the wake to measure cooling rate',
      'Load cell on a manual rake: mush force vs temperature vs solids fraction',
      'Trays of crushed Columbia River basalt; LMS-1, LHS-1, MGS-1 for validation runs; argon tent as the middle step',
    ],
    proves:
      'The process window: melt depth in coarse vs fine beds, filler limit with preheat, foaming with and without degassing, and whether a hood turns glass into ceramic.',
    exit:
      'Coarse beds melt ≥1.5× deeper than fine beds at equal energy; preheated filler reaches ≥60 % before lockup; hooded coupons are crystalline with cracks confined to scored joints.',
    needs: 'V1 budget $15k–40k (estimate). Optics and ceramics reviewers. Coupon characterization (XRD/SEM). Test days in clear, dry sun east of the Cascades.',
  },
  {
    v: 'V2',
    status: 'Next · depends on V1',
    title: 'Paving payload on someone else’s rover',
    build: [
      'Melt head, preheat zone and annealing hood packaged as a payload',
      'Mounted on a partner’s mobility platform (small to large lunar rover class)',
      'Closed-loop control: iris, travel speed, filler rate and hood position from pyrometry and LWIR',
      'Vacuum or argon campaign at a partner facility',
    ],
    proves:
      'Continuous ribbon, not coupons: steady depth, joint spacing and cooling rate while moving; mass, power and dust behaviour of a flyable payload.',
    exit:
      'A ≥10 m continuous ribbon at target depth in inert gas or vacuum, crystalline, with measured energy per kg within the projection.',
    needs: 'Estimate $0.3M–1.5M: SBIR/STTR Phase I–II scale. A rover partner. Vacuum chamber or solar furnace time.',
  },
  {
    v: 'V3',
    status: 'Later · depends on V2',
    title: 'The full paving train',
    build: [
      'Five cars: grade, preheat/degas, melt, screed, anneal',
      'Blading and grading of in-place rock',
      'Deployable faceted dish with iris; sealed optics for Mars',
    ],
    proves:
      'Landing pads and haul roads built from local rock with no binder, at a rate a surface base can use.',
    exit:
      'A 10 × 10 m pad at ≥5 cm in an analogue field test, then a flight opportunity.',
    needs: 'Estimate $5M+, partner-led: agency programme or a commercial lander/rover company.',
  },
];

export const experiments = [
  {
    id: '01',
    name: 'Melt depth vs bed',
    variable: 'Flux (iris) × dwell × bed: fines <1 mm vs chips 5–30 mm',
    measure: 'Sectioned melt depth; LWIR surface history',
    confirm: 'Coarse bed ≥1.5× deeper than fines at equal energy',
    kill: '≤1.2× gain: the heat-transfer argument fails; the approach reverts to PAVER-like depth',
  },
  {
    id: '02',
    name: 'Foaming vs preheat',
    variable: 'Preheat: none / 600 / 800 / 1,000 °C; basalt, LMS-1, MGS-1',
    measure: 'Coupon porosity, bubble count, mass loss, video',
    confirm: 'Preheat ≥800 °C brings porosity near the unfoamed basalt baseline',
    kill: 'MGS-1 still foams after 1,000 °C preheat: Mars needs a separate calcining step (Moon unaffected)',
  },
  {
    id: '03',
    name: 'Filler loading limit',
    variable: 'Filler fraction 0–80 % × filler at ambient vs ~1,000 °C',
    measure: 'Lockup point: rake force spike + pyrometer',
    confirm: 'Cold ≈30 %, preheated ≥60 % (theory ~70 %)',
    kill: 'Preheated filler locks up below ~40 %: the energy advantage roughly halves',
  },
  {
    id: '04',
    name: 'Cooling rate → microstructure',
    variable: 'Hood on / off; afterheat level',
    measure: 'LWIR cooling rate through 1,100 → 900 °C; crack census; hardness; XRD on selected coupons',
    confirm: 'Hooded coupons crystalline, fewer cracks, harder than bare',
    kill: 'No practical hood setting avoids glass: product is PAVER-like and the fracture argument fails',
  },
  {
    id: '05',
    name: 'Mush rheology',
    variable: 'Temperature × solids fraction',
    measure: 'Rake load cell force',
    confirm: 'A workable window ≥100 °C wide at ≥50 % solids',
    kill: 'Window <~30 °C: blading is impractical; V3 changes to pour-and-press',
  },
  {
    id: '06',
    name: 'Coupon properties',
    variable: 'Mush coupons vs full-melt glass controls from the same rig',
    measure: '3-point bend, tumble abrasion, LN₂ ↔ kiln thermal cycling',
    confirm: 'Mush coupons beat the glass controls in bend strength and cycling',
    kill: 'Mush coupons weaker than glass controls',
  },
  {
    id: '07',
    name: 'Blink-and-read pyrometry',
    variable: 'Iris closed ~50 ms vs open',
    measure: 'Pyrometer vs thermocouple; surface decay during the blink',
    confirm: 'Reflected-sun error removed; decay correction small and repeatable',
    kill: 'Engineering check, not a kill test: if the iris is too slow, add a small shutter at the sensor',
  },
];

export const risks = [
  {
    risk: 'Throughput',
    detail:
      'Even at the projected rate, a 10 m² collector places one 100 m² pad per 1.5–2.5 months of lunar sunlight. This builds pads, aprons and short haul roads, not highways.',
    response:
      'Beachhead is dust-mitigation landing pads. Rate scales with collector area and the number of heads.',
  },
  {
    risk: 'Air vs vacuum',
    detail:
      'In Earth air, FeO oxidizes, changing melt viscosity and crystallization. V1 results in air are process learning, not flight data.',
    response: 'Argon tent next, then vacuum at a partner facility (V2).',
  },
  {
    risk: 'Mars dust on optics',
    detail: 'Deposition and abrasion reduce concentration; global storms stop work for weeks.',
    response: 'Stow and cover optics; plan Mars duty cycle around storm season. Moon first.',
  },
  {
    risk: 'Blade life',
    detail: 'BN coatings are soft and oxidize in air and CO₂.',
    response: 'Replaceable edges; measure wear per metre in V1 and V2.',
  },
  {
    risk: 'Thermal cycling',
    detail:
      'The lunar surface swings ~300 K between day and night. Joints handle the first contraction; long-term fatigue is unknown.',
    response: 'LN₂ ↔ kiln cycling on V1 coupons; longer campaigns at a partner.',
  },
  {
    risk: 'Simulant fidelity',
    detail: 'Columbia River basalt has less iron than mare basalt; simulants are not regolith.',
    response: 'Validate every key result on LMS-1 and MGS-1.',
  },
  {
    risk: 'Team size',
    detail: 'One person today, across optics, materials, controls and robotics.',
    response: 'The collaborator list below is the mitigation.',
  },
];

export const partners = [
  {
    who: 'Optics / solar thermal',
    can: 'Flux-map the V1 spot; design the two-zone footprint (preheat annulus + melt core) and the off-axis flight dish; dust-tolerant optics.',
  },
  {
    who: 'Materials / ceramics',
    can: 'Set the cooling schedule; section coupons; XRD and SEM on 10–20 samples; interpret crystallization vs glass.',
  },
  {
    who: 'Controls / pyrometry',
    can: 'Review the two-colour pyrometry and blink-and-read timing; LWIR cooling-rate mapping; LinuxCNC/Python control loop.',
  },
  {
    who: 'Robotics',
    can: 'Screed and rake mechanisms, joint scorer, train kinematics, V2 payload integration.',
  },
  {
    who: 'Planetary science / geotechnics',
    can: 'Site selection (mare near ejecta, Mars rock cover), volatile budgets, simulant fidelity review.',
  },
  {
    who: 'Test facilities',
    can: 'Vacuum chambers, argon gloveboxes, solar furnaces (e.g. DLR Cologne, PROMES-CNRS Odeillo, Sandia NSTTF): host one melt campaign.',
  },
  {
    who: 'Rover and lander companies',
    can: 'V2 ride-along: a payload envelope (mass, power, volume) to design against.',
  },
  {
    who: 'Funders',
    can: 'V1 budget now; small-business or university partners for SBIR/STTR; programme sponsors for V2.',
  },
];

export const channels = [
  {
    name: 'NASA SBIR/STTR',
    note: '2026 BAA Appendix B includes LIVEI.1.S26B (surface dust mitigation) and LAND.1.S26B (regolith stability during landing). Phase I up to $225k.',
    ref: 'sbir2026',
  },
  {
    name: 'NASA MMPACT (Marshall)',
    note: 'Moon-to-Mars Planetary Autonomous Construction Technology: landing pads, roadways, berms, blast shields from regolith.',
    ref: 'mmpact',
  },
  {
    name: 'LSIC (Johns Hopkins APL)',
    note: 'Lunar Surface Innovation Consortium, Excavation & Construction focus area: monthly meetings where NASA construction stakeholders meet.',
    ref: 'lsic',
  },
  {
    name: 'ESA Open Space Innovation Platform',
    note: 'Open calls for ideas; PAVER itself was ESA-funded.',
    ref: 'osip',
  },
];

export const references: {
  id: string;
  text: string;
  url: string;
}[] = [
  {
    id: 'gines2023',
    text: 'Ginés-Palomares, J.-C. et al. (2023). Laser melting manufacturing of large elements of lunar regolith simulant for paving on the Moon. Scientific Reports 13, 15593.',
    url: 'https://www.nature.com/articles/s41598-023-42008-1',
  },
  {
    id: 'esa2023',
    text: 'ESA (2023). How to make roads on the Moon (PAVER project summary; 115-day pad estimate).',
    url: 'https://www.esa.int/Enabling_Support/Space_Engineering_Technology/How_to_make_roads_on_the_Moon',
  },
  {
    id: 'immer2011',
    text: 'Immer, C., Metzger, P. et al. (2011). Apollo 12 Lunar Module exhaust plume impingement on Lunar Surveyor III. Icarus 211, 1089–1102.',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S001910351000432X',
  },
  {
    id: 'watkins2021',
    text: 'Watkins, R. N., Metzger, P. T., Mehta, M. et al. (2021). Understanding and mitigating plume effects during powered descents on the Moon and Mars. Planetary Science Decadal Survey white paper.',
    url: 'https://arxiv.org/abs/2102.12312',
  },
  {
    id: 'eutit',
    text: 'EUTIT s.r.o. Cast basalt catalogue sheet E-01 (density 2,900–3,000 kg/m³; compressive 300–450 MPa; flexural ≥45 MPa; CTE 8–9 × 10⁻⁶/K).',
    url: 'https://m.eutit.com/files/ke_stazeni_aj/e01_basalt_en.pdf',
  },
  {
    id: 'eutit2',
    text: 'EUTIT. Cast basalt production (melted at 1,280 °C, cast, recrystallized in kilns).',
    url: 'https://www.eutit.com/clanky-cast-basalt.html',
  },
  {
    id: 'bouhifd2007',
    text: 'Bouhifd, M. A. et al. (2007). Thermochemistry and melting properties of basalt. Contrib. Mineral. Petrol. 153, 689–698.',
    url: 'https://link.springer.com/article/10.1007/s00410-006-0170-8',
  },
  {
    id: 'hayne2017',
    text: 'Hayne, P. O. et al. (2017). Global regolith thermophysical properties of the Moon from the Diviner Lunar Radiometer Experiment. JGR Planets 122.',
    url: 'https://arxiv.org/abs/1711.00977',
  },
  {
    id: 'chaste2025',
    text: 'Mathew, N., Durga Prasad, K. et al. (2025). Thermal conductivity of high-latitude lunar regolith measured by ChaSTE on Chandrayaan-3 (incl. Apollo comparison). Scientific Reports.',
    url: 'https://www.nature.com/articles/s41598-025-91866-4',
  },
  {
    id: 'carrier2003',
    text: 'Carrier, W. D. (2003/2005). Geotechnical properties of lunar soil (median grain size ~0.072 mm).',
    url: 'https://www.lpi.usra.edu/lunar/surface/carrier_lunar_soils.pdf',
  },
  {
    id: 'apollo12009',
    text: 'Experimental petrology of Apollo 12 basalts, part 1: sample 12009 (1971). Earth Planet. Sci. Lett. (olivine crystallizes from ~1,230 °C).',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/0012821X71901099',
  },
  {
    id: 'christensen1986',
    text: 'Christensen, P. R. (1986). The spatial distribution of rocks on Mars. Icarus 68, 217–238 (modal rock abundance 6 %).',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/0019103586900205',
  },
  {
    id: 'golombek2003',
    text: 'Golombek, M. et al. (2003). Rock size-frequency distributions on Mars and implications for MER landing safety (5–40 % at landing sites).',
    url: 'https://ntrs.nasa.gov/search.jsp?R=20030111177',
  },
  {
    id: 'appelbaum1989',
    text: 'Appelbaum, J. & Flood, D. (1989). Solar radiation on Mars. NASA TM-102299 (mean 590 W/m²; beam irradiance vs optical depth).',
    url: 'https://ntrs.nasa.gov/api/citations/19890018252/downloads/19890018252.pdf',
  },
  {
    id: 'jpl2018',
    text: 'NASA JPL (2018). Opportunity hunkers down during dust storm (τ = 10.8).',
    url: 'https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/',
  },
  {
    id: 'leshin2013',
    text: 'NASA (2013). Curiosity’s SAM instrument finds water and more in surface sample (~2 wt % water; heated to 835 °C). Leshin et al., Science 341.',
    url: 'https://www.nasa.gov/solar-system/curiositys-sam-instrument-finds-water-and-more-in-surface-sample/',
  },
  {
    id: 'sutter2021',
    text: 'Review of SAM evolved-gas laboratory analog work: oxychlorine O₂ release ~200–600 °C, HCl ~200–542 °C. Minerals 11, 475 (2021).',
    url: 'https://www.mdpi.com/2075-163X/11/5/475',
  },
  {
    id: 'lewis2015',
    text: 'Lewis, J. M. T. et al. (2015). Sulfate minerals: a problem for the detection of organic compounds on Mars? Astrobiology 15 (SO₂ onset: Fe sulfates ~500–550 °C, MgSO₄ ~780 °C, CaSO₄ >1,000 °C).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4363818',
  },
  {
    id: 'bn3m',
    text: '3M Boron Nitride Suspension Cast-C datasheet (application temperature 900 °C air, 1,400 °C vacuum).',
    url: 'https://5153b87275fc0b4f1c71-7ea54c4adfc1c34a6cf998da6839be7e.ssl.cf1.rackcdn.com/castcboronnitridesuspensioncastc1491982214830.pdf',
  },
  {
    id: 'azombn',
    text: 'AZoM. Boron nitride properties (h-BN not wetted by most molten metals, glasses and salts; coatings for glass-forming moulds).',
    url: 'https://www.azom.com/article.aspx?ArticleID=78',
  },
  {
    id: 'jacobson1999',
    text: 'Jacobson, N. et al. (1999). High-temperature oxidation of boron nitride: I, monolithic boron nitride. NASA/J. Am. Ceram. Soc.',
    url: 'https://ntrs.nasa.gov/citations/20010064405',
  },
  {
    id: 'lms1',
    text: 'UCF CLASS / Exolith Lab. LMS-1 lunar mare simulant (and LHS-1 highland simulant).',
    url: 'https://sciences.ucf.edu/class/simulant_lunarmare/',
  },
  {
    id: 'mgs1',
    text: 'UCF CLASS / Exolith Lab. MGS-1 Mars global simulant.',
    url: 'https://sciences.ucf.edu/class/simulant_marsglobal/',
  },
  {
    id: 'mmpact',
    text: 'NASA (2022). Moon-to-Mars Planetary Autonomous Construction Technology project: overview and status.',
    url: 'https://ntrs.nasa.gov/citations/20220013715',
  },
  {
    id: 'lsic',
    text: 'LSIC Excavation & Construction focus area (Johns Hopkins APL).',
    url: 'https://lsic.jhuapl.edu/Our-Work/Focus-Areas/index.php?fg=Excavation-and-Construction',
  },
  {
    id: 'sbir2026',
    text: 'NASA 2026–2027 SBIR/STTR BAA, Appendix B (26B) SBIR subtopics.',
    url: 'https://www.nasa.gov/wp-content/uploads/2024/01/nasa-2026-2027-sbir-sttr-baa-appendix-26b-i-sbir.pdf',
  },
  {
    id: 'osip',
    text: 'ESA Open Space Innovation Platform.',
    url: 'https://ideas.esa.int',
  },
];
