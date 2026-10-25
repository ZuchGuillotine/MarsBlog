// Single source for the brand name and contact details used across the site.
export const SITE_NAME = 'Population Mars';
export const SITE_TAGLINE = 'Independent research toward settling Mars, from regolith paving to orbital operations.';
export const SITE_EMAIL = 'info@populationmars.com';
export const ORBITFLEET_URL = 'https://orbitfleet.populationmars.com';

export const mailto = (subject: string) => `mailto:${SITE_EMAIL}?subject=${encodeURIComponent(subject)}`;
