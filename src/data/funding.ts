// Fundraising settings for /support. Update `raised` by hand after checking the
// Stripe dashboard; the progress bar and copy read from here.
export const fundingGoal = {
  goal: 2500,
  raised: 0,
  updated: '2026-10-25',
  campaign: 'Fall 2026 research sprint',
};

// The pay-what-you-want link lets donors enter any amount, so suggested amounts
// fall back to it until a fixed-price link exists for that amount.
export const customAmountLink = 'https://buy.stripe.com/bJe7sKdfb8wS46lexm63K00';

export type GivingTier = { amount: number; label: string; buys: string; link?: string };

export const oneTimeTiers: GivingTier[] = [
  { amount: 25, label: 'Supporter', buys: 'About 1 kg of crushed basalt test bed plus thermocouple wire.' },
  { amount: 100, label: 'Experimenter', buys: 'A day of cloud compute for a batch of debris-mitigation runs.' },
  { amount: 250, label: 'Builder', buys: 'A Fresnel lens stage or a set of ceramic crucibles for melt tests.' },
  { amount: 500, label: 'Mission sponsor', buys: 'One complete published simulation study, from setup to open data.' },
];

// Monthly giving needs a recurring-price Stripe Payment Link per tier. Tiers
// without a link render as "opening soon" rather than sending donors to a
// one-time checkout.
export const monthlyTiers: GivingTier[] = [
  { amount: 5, label: 'Orbiter', buys: 'Keeps the simulators online for a day each month.' },
  { amount: 15, label: 'Lander', buys: 'Covers a month of data storage for published runs.' },
  { amount: 50, label: 'Rover', buys: 'Funds one new scenario in OrbitFleet every quarter.' },
];

// Planned use of the $2,500 goal. Amounts must sum to fundingGoal.goal.
export const budget = [
  {
    item: 'Three-body launch and transfer simulations',
    amount: 600,
    detail:
      'Compute and validation for Earth–Moon and Earth–Mars trajectory studies in the circular restricted three-body problem, including cycler and low-energy transfers, published with inputs and code.',
  },
  {
    item: 'Debris-mitigation studies',
    amount: 600,
    detail:
      'New OrbitFleet scenarios for laser ablation, collision buffers and deorbit planning, with reproducible run manifests and open data exports.',
  },
  {
    item: 'Solar regolith paving bench tests',
    amount: 650,
    detail:
      'Basalt and MGS-1 simulant, thermocouples, a two-colour pyrometer and optics for the first V1 melt-depth coupons.',
  },
  {
    item: 'Mars relay and autonomy simulator',
    amount: 350,
    detail:
      'Hosting and development time for the Mars mission-control console: delayed-command scenarios and surface link coverage.',
  },
  {
    item: 'Open publishing',
    amount: 300,
    detail: 'Hosting, data storage and write-ups so every result is free to read and reuse.',
  },
];
