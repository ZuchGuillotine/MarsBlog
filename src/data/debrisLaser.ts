// Content and figures for /projects/debris-remediation (the SLP-5 laser payload).
//
// Scope rule for this file and the page it feeds: the laser payload only.
// Nothing about the tracking, pointing or beam-delivery system belongs here,
// and neither does a parts-level materials list. Cost figures are kept at
// stage and category level for the same reason.

export type Kind = 'target' | 'calculated' | 'estimate' | 'reference' | 'assumption';

export const kindLabel: Record<Kind, string> = {
  target: 'Design target',
  calculated: 'Calculated',
  estimate: 'Estimate',
  reference: 'Reference',
  assumption: 'Assumption',
};

export const glance: { k: string; v: string }[] = [
  { k: 'Output', v: '5.0 J, 5 ns pulses at 355 nm (ultraviolet)' },
  { k: 'Firing pattern', v: '10 Hz for 300 s, once per orbit' },
  { k: 'Payload', v: '19.65 kg in 560 × 380 × 165 mm' },
  { k: 'Host', v: 'ESPA-class small satellite, 700–800 km orbit' },
  { k: 'Bus power', v: '43 W orbit average at 28 V DC' },
];

export const heroNumbers: { value: string; label: string; kind: Kind }[] = [
  { value: '5.0 J', label: 'per pulse at 355 nm, 1.0 GW peak', kind: 'target' },
  { value: '3,000', label: 'shots per orbit in one 300 s burst', kind: 'target' },
  {
    value: '0.75 N·s',
    label: 'impulse per burst if every pulse couples at 50 µN·s/J',
    kind: 'calculated',
  },
  { value: '19.65 kg', label: 'laser payload mass, before growth allowance', kind: 'target' },
];

// ---- How it works ---------------------------------------------------------
export const steps: { n: string; title: string; body: string; stat: string }[] = [
  {
    n: '01',
    title: 'Seed',
    body: 'A continuous seed diode locks a small Nd:YAG ring oscillator to a single frequency. A Pockels cell releases its stored energy as one clean 5 ns pulse.',
    stat: '10 mJ · 1064 nm · single longitudinal mode',
  },
  {
    n: '02',
    title: 'Shape and pre-amplify',
    body: 'The pulse passes an isolator, is reshaped from a narrow round beam into a square flat-top, and makes two passes through a diode-pumped Nd:YAG slab.',
    stat: '0.8 J · 15 × 15 mm flat-top',
  },
  {
    n: '03',
    title: 'Power amplifier',
    body: 'Two zig-zag Nd:YAG slabs, pumped by 885 nm diode stacks, amplify the pulse on the way to a phase-conjugate mirror and again on the way back. The mirror returns a wavefront-reversed beam, so distortion picked up in the hot slabs on the first pass is undone on the second.',
    stat: '10 J · 1064 nm · 4.4 J/cm²',
  },
  {
    n: '04',
    title: 'Convert to ultraviolet',
    body: 'Two lithium triborate (LBO) crystals double part of the infrared to green, then mix green and infrared to 355 nm. A dichroic mirror sends the ultraviolet onward and the unconverted light to a beam dump.',
    stat: '5.0 J · 355 nm · 50% conversion',
  },
  {
    n: '05',
    title: 'Condition and hand off',
    body: 'A 1.33× expander brings the beam to 20 mm, lowering the fluence on the last optics. It leaves the sealed cavity through a Brewster-angle window behind a protective shutter.',
    stat: '20 mm flat-top · 1.59 J/cm²',
  },
  {
    n: '06',
    title: 'Recover',
    body: 'A 300 s burst leaves 165 kJ of heat in a block of paraffin wax held in copper foam, which melts at 28 °C. Over the remaining 93 minutes of the orbit the wax refreezes through heat pipes to the radiator and the energy buffer recharges.',
    stat: '5.1% duty · 43 W from the bus',
  },
];

export const whyChoices: { title: string; body: string }[] = [
  {
    title: 'Why ultraviolet',
    body: 'A 355 nm beam diffracts a third as much as the 1064 nm fundamental, so the same optics put nine times the fluence on a distant target. Metals, paint, carbon-fibre composite and polyimide film all absorb it strongly.',
  },
  {
    title: 'Why nanosecond pulses',
    body: 'Ablation needs a threshold fluence delivered faster than heat can soak into the surface. Short pulses reach that threshold with joules; a continuous beam of the same average power would only warm the target.',
  },
  {
    title: 'Why bursts',
    body: 'Firing continuously would need about 600 W of electrical power and a radiator for 550 W of heat. Firing for 5% of the orbit lets a 43 W bus feed and a small radiator do the same job through an energy buffer and a thermal capacitor.',
  },
];

// ---- Specifications -------------------------------------------------------
export const specGroups: { title: string; rows: [string, string, string?][] }[] = [
  {
    title: 'Optical output',
    rows: [
      ['Wavelength', '355 nm', 'Third harmonic of 1064 nm Nd:YAG'],
      ['Pulse energy', '5.0 J'],
      ['Pulse width', '5.0 ns FWHM', 'Single longitudinal mode'],
      ['Peak power', '1.0 GW'],
      ['Repetition rate', '10 Hz', 'Externally triggered'],
      ['Average optical power', '50 W during a burst', '2.5 W averaged over the orbit'],
      ['Beam profile', 'Super-Gaussian flat-top, order 6', 'Linear polarization, > 100:1'],
      ['Beam quality', 'M² ≤ 1.3'],
      ['Exit beam', '20 mm diameter', '1.59 J/cm² mean fluence'],
    ],
  },
  {
    title: 'Operation',
    rows: [
      ['Orbit', '700–800 km low Earth orbit', '99–101 minute period'],
      ['Burst', '300 s, 3,000 shots', 'Once per orbit, 5.1% duty'],
      ['Recovery', '93 minutes', 'Thermal bleed and buffer recharge'],
      ['Design life', '> 10⁸ shots', 'About six years at one burst per orbit'],
    ],
  },
  {
    title: 'Power',
    rows: [
      ['Burst electrical draw', '600 W', '572 W to pump diodes, 28 W drive and control'],
      ['Energy per burst', '180 kJ (50 Wh)', 'Supplied by the internal buffer'],
      ['Orbit-average bus power', '43 W at 28 V DC', '30.6 W recharge, 12.4 W standby'],
      ['Wall-plug efficiency to 355 nm', '8.3%', '50 W ultraviolet from 600 W'],
      ['Pump', '885 nm diode stacks, 124 kW peak', '230 µs pulses at 10 Hz'],
    ],
  },
  {
    title: 'Thermal',
    rows: [
      ['Waste heat in a burst', '550 W, 165 kJ', 'Diodes 286 W, slabs 186 W, beam dump 50 W, drivers 28 W'],
      ['Thermal capacitor', 'n-octadecane in copper foam', 'Melts at 28 °C, 195 kJ latent capacity'],
      ['Radiator bleed', '28.1 W continuous', 'About 0.12 m² of radiator at 25 °C'],
    ],
  },
  {
    title: 'Physical',
    rows: [
      ['Mass', '19.65 kg', 'Laser payload only'],
      ['Envelope', '560 × 380 × 165 mm', '35 litres, two decks'],
      ['Optical bench', 'Reaction-bonded silicon carbide', 'On three titanium bipod flexures'],
      ['Cavity atmosphere', '40 Pa dry oxygen', 'Hermetic, with a 50 g make-up reserve'],
      ['Host spacecraft', '150–250 kg small satellite', 'Regulated 28 V bus, radiator interface'],
    ],
  },
];

export const energyLadder: { stage: string; energy: string; wavelength: string; beam: string }[] = [
  { stage: 'Master oscillator', energy: '10 mJ', wavelength: '1064 nm', beam: '2 mm round' },
  { stage: 'Pre-amplifier', energy: '0.8 J', wavelength: '1064 nm', beam: '15 × 15 mm flat-top' },
  { stage: 'Power amplifier', energy: '10 J', wavelength: '1064 nm', beam: '15 × 15 mm, 4.4 J/cm²' },
  { stage: 'Harmonic generation', energy: '5.0 J', wavelength: '355 nm', beam: '15 × 15 mm, 2.2 J/cm²' },
  { stage: 'Output', energy: '5.0 J', wavelength: '355 nm', beam: '20 mm, 1.59 J/cm²' },
];

// ---- Survivability --------------------------------------------------------
export const survivability: { n: string; problem: string; numbers: string; response: string }[] = [
  {
    n: 'A',
    problem: 'Laser-induced contamination',
    numbers:
      'In vacuum, ultraviolet nanosecond pulses crack trace hydrocarbons outgassed by adhesives, wiring and insulation, and deposit carbon on whatever surface the beam crosses. The deposit absorbs the next pulses, heats, and the optic eventually fails. ESA’s Aeolus wind lidar ran its ultraviolet laser in a few tens of pascals of oxygen for this reason.',
    response:
      'The optical bench sits in a hermetic housing filled with 40 Pa of dry oxygen. Under ultraviolet light the oxygen burns carbon off as it forms. Optics are held by springs or brazed joints; there is no epoxy or silicone inside the cavity.',
  },
  {
    n: 'B',
    problem: 'The exit window faces space',
    numbers:
      'The last surface is outside the oxygen atmosphere and exposed to atomic oxygen, thruster plumes and micrometeoroids.',
    response:
      'A Brewster-angle window of ultraviolet-grade fused silica, with a hard ion-beam-sputtered silica and alumina coating. A fail-safe shutter covers it whenever the laser is not firing.',
  },
  {
    n: 'C',
    problem: 'A narrow pump line and warm diodes',
    numbers:
      'Nd:YAG absorbs 885 nm pump light across only about 2.5 nm, and diode wavelength drifts about 0.3 nm per °C.',
    response:
      'Diode stacks and slabs mount on the wax-and-copper-foam cold plate, which holds its temperature at the 28 °C melting point for the whole burst with no pumps or chillers.',
  },
  {
    n: 'D',
    problem: 'Launch loads and radiation',
    numbers: 'Launch vibration of 14 g rms, then years of proton and gamma dose that darken ordinary glass.',
    response:
      'The silicon carbide bench hangs on three titanium bipod flexures that isolate it from bus distortion. All ultraviolet optics are high-purity synthetic fused silica.',
  },
];

// ---- Roadmap and cost -----------------------------------------------------
// Labour is engineers × years × the rate below. Hardware is estimated per
// subsystem from the internal materials list and reported here by stage only.
export const ENGINEER_RATE = 400_000; // USD per engineer-year, fully loaded
export const CONTINGENCY = 0.3;

export interface Stage {
  v: string;
  title: string;
  status: string;
  months: number;
  engineers: number;
  hardware: number; // USD
  test: number; // USD
  build: string[];
  proves: string;
  exit: string;
  hardwareNote: string;
}

export const stages: Stage[] = [
  {
    v: 'V1',
    title: 'Ground test prototype',
    status: 'Next',
    months: 18,
    engineers: 6,
    hardware: 1_100_000,
    test: 200_000,
    build: [
      'Full optical train on an open laboratory bench, in air',
      'Commercial-grade crystals, diode stacks and drivers',
      'Laboratory cooling in place of the thermal capacitor',
    ],
    proves:
      'That the amplifier chain extracts 10 J with the beam quality the harmonic stage needs, and what the real conversion and wall-plug efficiencies are.',
    exit: '5 J at 355 nm, 10 Hz, sustained for 300 s bursts, with measured efficiency at each stage.',
    hardwareNote: 'Optics and crystals, commercial pump diodes and drivers, diagnostics and laser-safe lab fit-out.',
  },
  {
    v: 'V2',
    title: 'Vacuum engineering model',
    status: 'Planned',
    months: 18,
    engineers: 10,
    hardware: 2_600_000,
    test: 900_000,
    build: [
      'Flight form factor: silicon carbide bench, sealed housing, oxygen system',
      'Wax thermal capacitor, heat pipes, custom diode drivers and energy buffer',
      'Commercial electronic parts, flight-like layout',
    ],
    proves:
      'That the laser runs sealed in vacuum on its own stored energy and stored cold, and that the optics stay clean.',
    exit: 'Orbit-like burst cycles in a thermal-vacuum chamber, and a contamination life test of at least 10⁷ shots with no loss of output.',
    hardwareNote: 'First flight-geometry structure, conductively cooled diode stacks, custom power electronics, vacuum test rigs.',
  },
  {
    v: 'V3',
    title: 'Qualification model',
    status: 'Planned',
    months: 18,
    engineers: 12,
    hardware: 4_200_000,
    test: 1_800_000,
    build: [
      'Flight design built with screened, flight-grade parts',
      'Parallel life-test benches for diodes and ultraviolet optics',
    ],
    proves: 'That the design survives launch and the orbital environment for its design life.',
    exit: 'Vibration at 14 g rms, shock, thermal-vacuum cycling, electromagnetic compatibility, radiation lot tests, and 10⁸ shots on life-test hardware.',
    hardwareNote: 'Screened diodes, damage-tested optics lots, radiation-tolerant electronics, qualification test campaigns.',
  },
  {
    v: 'V4',
    title: 'Flight model',
    status: 'Planned',
    months: 15,
    engineers: 12,
    hardware: 4_800_000,
    test: 1_500_000,
    build: [
      'Flight unit and a kit of critical spares',
      'Acceptance testing, integration with the host spacecraft, launch campaign',
    ],
    proves: 'A fully operational, deployable payload.',
    exit: 'Accepted flight unit delivered and commissioned on orbit.',
    hardwareNote: 'Flight unit, spares, acceptance testing and integration support.',
  },
];

export const stageCost = (s: Stage) => {
  const labour = s.engineers * (s.months / 12) * ENGINEER_RATE;
  return { labour, hardware: s.hardware, test: s.test, total: labour + s.hardware + s.test };
};

export const costExclusions: string[] = [
  'The tracking and beam-delivery system',
  'The host spacecraft and launch',
  'Ground segment and mission operations',
  'Licensing and regulatory work',
  'Facilities, management and company overhead beyond the loaded labour rate',
];

// ---- Open engineering items ------------------------------------------------
export const openItems: { item: string; detail: string; closes: string }[] = [
  {
    item: 'Working spot size',
    detail:
      'Efficient coupling on metals needs several joules per square centimetre at this pulse length, so a 5 J pulse must arrive in a spot about a centimetre across. That fixes how close the craft has to work, and it is the main limit on what this laser can do.',
    closes: 'System design',
  },
  {
    item: 'Efficiency chain',
    detail:
      'The 8.3% wall-plug figure needs 50% diode efficiency, 35% extraction from pump light and 50% conversion to ultraviolet, all at once. Each is near the best reported. The ultraviolet laser on Aeolus converted 1–2% of its electrical input, and flown green and infrared lidar lasers reached 4–7%. At 6% the burst draw rises to about 830 W and every power and thermal number scales with it.',
    closes: 'V1',
  },
  {
    item: 'Burst energy buffer',
    detail:
      'A 50 Wh buffer is fully drained by every 50 Wh burst, about 5,300 times a year. Cells cycled that often are normally kept to a fraction of their capacity, which points to a buffer several times larger and heavier.',
    closes: 'V2',
  },
  {
    item: 'Pulse capacitor bank',
    detail:
      'Each pump pulse draws 57 J from a 60 J bank, which would collapse the bank voltage within the pulse. Holding the diode current flat needs several times that stored energy.',
    closes: 'V1',
  },
  {
    item: 'Pump diode derating',
    detail:
      'The pump budget runs each diode bar at 320 W peak. Commercial bars are rated at 100–300 W, and flown lasers have run theirs at 50–100 W for lifetime, which means several times more bars. Wavelength-locked stacks are also needed to hold the narrow 885 nm line while the diode warms within each pulse.',
    closes: 'V2',
  },
  {
    item: 'Phase-conjugate mirror energy',
    detail:
      'Solid fused-silica phase-conjugate mirrors have been demonstrated without damage at a few hundred millijoules per pulse. This design returns several joules from one. It may need the beam split across several cells, or a different conjugating medium.',
    closes: 'V1',
  },
  {
    item: 'Beam format',
    detail:
      'The amplifiers carry a square beam and the output is specified as round. Clipping a square to a circle discards about a fifth of the energy, so either the output stays square or the infrared energy goes up.',
    closes: 'V1',
  },
  {
    item: 'Ultraviolet optics lifetime',
    detail:
      'Internal optics see 1.6 to 2.2 J/cm² at 355 nm for 10⁸ shots. Coatings that survive a short test at several times that fluence can still degrade over a long one, particularly in vacuum.',
    closes: 'V2–V3',
  },
  {
    item: 'Mass growth',
    detail:
      'The 19.65 kg figure is a bottom-up sum with no growth allowance. New designs at this stage typically grow by a quarter or more, and the buffer, capacitor and diode items above all add mass.',
    closes: 'V2',
  },
];

// ---- References -----------------------------------------------------------
export const references: { id: string; text: string; url: string }[] = [
  {
    id: 'phipps2012',
    text: 'Phipps, C. R. et al., “Removing orbital debris with lasers,” Advances in Space Research 49 (2012). Optimum fluence and coupling coefficients.',
    url: 'https://arxiv.org/abs/1110.3835',
  },
  {
    id: 'ladroit',
    text: 'Phipps, C. R., “L’ADROIT: a spaceborne ultraviolet laser system for space debris clearing,” Acta Astronautica 104 (2014).',
    url: 'https://www.photonicassociates.com/documents/LADROIT.pdf',
  },
  {
    id: 'odc2023',
    text: 'Second International Orbital Debris Conference (2023), paper 6041: effective coupling across a real beam profile.',
    url: 'https://www.hou.usra.edu/meetings/orbitaldebris2023/pdf/6041.pdf',
  },
  {
    id: 'lux2024',
    text: 'Lux, O. et al., Applied Optics 63, 9319 (2024): in-orbit performance of the ALADIN ultraviolet laser on Aeolus, including its oxygen purge.',
    url: 'https://elib.dlr.de/207938/1/Lux%20-%20ALADIN%20laser%20performance_2024.pdf',
  },
  {
    id: 'esaaeolus',
    text: 'ESA, “Laser battle that gave Europe our Aeolus wind-mapper.”',
    url: 'https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Laser_battle_that_gave_Europe_our_Aeolus_wind-mapper',
  },
  {
    id: 'riede',
    text: 'Riede, W. et al., “Optics qualification for space” (DLR): laser damage and contamination of coatings in vacuum.',
    url: 'https://elib.dlr.de/62186/1/SPIE_Newsroom_Article_Optics_Qualification_for_Space_Riede.pdf',
  },
  {
    id: 'lavi2000',
    text: 'Lavi, R. and Jackel, S., “Thermally boosted pumping of neodymium lasers,” Applied Optics 39, 3093 (2000). The 885 nm absorption band.',
    url: 'https://opg.optica.org/abstract.cfm?URI=ao-39-18-3093',
  },
  {
    id: 'nasadiode',
    text: 'NASA, guidelines for high-power laser diode arrays in space flight (2006). Derating practice.',
    url: 'https://nepp.nasa.gov/docuploads/B19AD2D1-FA12-4FD1-B11F2596C29F9475/HighPowerLDGuidelines20061.pdf',
  },
  {
    id: 'faden2019',
    text: 'Faden, M. et al., “Review of thermophysical property data of octadecane for phase-change studies,” Materials 12 (2019).',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6766243',
  },
  {
    id: 'nasa2023',
    text: 'NASA Office of Technology, Policy and Strategy, “Cost and Benefit Analysis of Orbital Debris Remediation” (2023).',
    url: 'https://www.nasa.gov/wp-content/uploads/2023/03/otps_-_cost_and_benefit_analysis_of_orbital_debris_remediation_-_final.pdf',
  },
];
