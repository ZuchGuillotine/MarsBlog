// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Netlify sets URL to the production URL at build time; set SITE_URL to
// override elsewhere. Canonical/OG URLs and the sitemap all derive from this.
const site =
  process.env.URL || process.env.SITE_URL || 'http://localhost:4321';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [react(), tailwind({
    applyBaseStyles: false,
  }), mdx(), sitemap()],
});