// Single source for the brand name and contact details used across the site.
export const SITE_NAME = 'Population Mars';
export const SITE_TAGLINE = 'Independent research toward settling Mars, from regolith paving to orbital operations.';
export const SITE_EMAIL = 'info@populationmars.com';
export const ORBITFLEET_URL = 'https://orbitfleet.populationmars.com';

export const mailto = (subject: string) => `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}`;

export const founder = {
  name: 'Benjamin Cox',
  role: 'Founder & editor',
  location: 'Bainbridge Island, Washington',
  github: 'https://github.com/ZuchGuillotine',
  bio: [
    'Benjamin Cox is a software engineer and field operations project manager who works where physical operations meet the data systems that run them. He founded Population Mars in 2025 and built OrbitFleet, its fleet-operations simulator with delayed commands, anomaly scenarios and human approval gates, using Orekit, Basilisk, Three.js, Python and TypeScript.',
    'He has shipped production iOS and web software on AWS and PostgreSQL, and is building HAIDAA, a provenance-backed memory service for autonomous agents. Alongside the software, he manages property development and commercial landscaping projects up to $500,000: crews, civil drawings, grading and earthwork from survey data, heavy equipment and materials logistics. That ground-level construction experience feeds directly into the regolith paving work.',
    'Before that he spent fifteen years leading kitchen and field teams of up to 14 people, with responsibility for hiring, training, procurement and profit and loss.',
  ],
};
