# Product Requirements Document (PRD)

**Project Title:** Terraforming Mars – Interactive Exploration Website
**Version:** v1.0
**Last Updated:** 22 June 2025
**Owner:** Benjamin Cox / StackTracker Labs

---

## 1 — Purpose & Vision

Create a visually stunning yet technically lightweight public‑facing website that allows anyone to **explore Mars in 3‑D and learn about the science, engineering, and ethics of terraforming.** The site should inspire curiosity, surface authoritative resources, and galvanise support (via donations) for ongoing research and open‑source projects.

---

## 2 — Success Metrics

| Goal        | Metric                                          | Target                |
| ----------- | ----------------------------------------------- | --------------------- |
| Engagement  | Avg. session duration                           | ≥ 3 min               |
| Exploration | % visitors who click ≥ 3 locations on the globe | ≥ 40 %                |
| Knowledge   | Blog article scroll‑through rate                | ≥ 60 %                |
| Support     | Stripe donation conversion                      | ≥ 2 % of unique users |
| Performance | Largest Contentful Paint (desktop)              | < 2.5 s               |

---

## 3 — Target Audience

* Space‑enthusiasts & STEM students (age 15‑35).
* Journalists & educators covering planetary science.
* Philanthropists interested in long‑horizon research.

---

## 4 — Key Features & Requirements

### 4.1 Landing Hero – Rotating Globe

* **Hyper‑realistic 3‑D globe** of Mars renders immediately in the hero viewport.
* Globe spins slowly around its axis and subtly tilts toward the user while **following cursor movement**.
* On initial load, short intro tagline fades in: "Terraforming Mars: Map the Future."

### 4.2 Interactive 3‑D Map

| #                                                      | Requirement                                                                                                  | Priority |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------- |
|  F‑1                                                   | Users can **click** or **tap** on any point; selected coordinates highlight.                                 | Must     |
|  F‑2                                                   | Pre‑defined locations (Olympus Mons, Valles Marineris, proposed colony sites, etc.) have **hover hotspots**. | Must     |
|  F‑3                                                   | Hover/selection populates a side info panel with:                                                            |          |
|   • Name & elevation                                   |                                                                                                              |          |
|   • Rationale for terraform (e.g., water ice deposits) |                                                                                                              |          |
|   • Links to external studies                          |                                                                                                              |          |
|   • "Read blog section" deep‑link                      | Must                                                                                                         |          |
|  F‑4                                                   | Map should load **offline‑cacheable static assets** (textures, height‑map).                                  | Should   |
|  F‑5                                                   | Globe supports **pinch‑zoom** on mobile and two‑finger rotate.                                               | Should   |
|  F‑6                                                   | Graceful degradation to a 2‑D canvas on low‑end devices.                                                     | Could    |

### 4.3 Blog / Knowledge Hub (Gwern‑inspired)

* Markdown‑driven content compiled at build‑time.
* **Collapsible sections** implemented with `<details>/<summary>` for lightweight JS.
* Automatic **wiki‑style bidirectional links** between articles.
* Footnotes, citations pop‑ups on hover, and **in‑page mini‑TOC** on scroll.
* Code snippets, charts, and images lazy‑loaded.
* Built‑in **full‑text search** (lunr .js static index).

### 4.4 Stripe Donation Flow

1. "Support Terraforming Research" CTA present in navbar and article footers.
2. Clicking opens **Stripe Checkout** in a new tab (fixed USD tiers + custom amount).
3. After success, Stripe redirects to `/thank‑you` page that triggers a confetti animation and offers share buttons.
4. Minimal backend: a **serverless endpoint** signs & returns the Checkout session.

### 4.5 General Site Requirements

* **Static‑first**: all HTML generated at build; only client‑side JS for globe, collapsibles, analytics, and Stripe.
* Responsive (mobile, tablet, desktop) with preference for **dark theme**.
* Accessible (WCAG 2.1 AA). Keyboard navigation for globe hotspots via hidden focus outlines.
* SEO: OpenGraph tags, structured data for articles, pre‑rendered critical CSS.

---

## 5 — Tech Stack

| Layer                 | Choice                                             | Rationale                                                         |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Static Site Generator | **Astro**                                          | Island architecture: zero JS by default, opt‑in for globe island. |
| 3‑D / WebGL           | **Three.js** + React‑Three‑Fiber (as Astro island) | Mature, vast Mars texture demos, fits with static deployment.     |
| State Management      | React local state / Zustand (globe island only)    | Lightweight.                                                      |
| Styling               | **Tailwind CSS** + vanilla CSS variables           | Rapid theming + Gwern‑style typography tweaks.                    |
| Markdown Engine       | Astro MDX                                          | Allows React components inside blog posts.                        |
| Search                | **Lunr.js** static index                           | No backend needed.                                                |
| Hosting / CDN         | **Netlify** (or Vercel) static deploy              | Free tier, built‑in serverless functions for Stripe.              |
| Payments              | **Stripe Checkout** via Netlify Function           | PCI handled by Stripe.                                            |
| Analytics             | Plausible (self‑hosted) or Netlify Analytics       | Privacy‑respecting.                                               |

---

## 6 — System Architecture

```
┌─────────────────────┐     Build Time      ┌──────────────────┐
│   Markdown + MDX    │ ───────────────▶   │   Astro Static   │
│   /content/blog/*   │                    │    HTML/CSS      │
└─────────────────────┘                    │  + JS islands    │
                                           └──────┬───────────┘
                                                  │ deploy
                                     ┌────────────▼─────────┐
                                     │  Netlify (Edge CDN)  │
                                     ├──────────┬───────────┤
                                     │  /         (HTML)    │
                                     │  /api/stripe  (Fn)   │
                                     └──────────┴───────────┘
```

### Data Flow – Globe Interaction

1. User loads static HTML; JS island mounts `MarsGlobe.tsx`.
2. Globe fetches `mars‑tiles/{z}/{x}/{y}.jpg` + `elevations.bin` from CDN.
3. Ray‑caster detects hover → emits `onSiteHover(id)`; side panel component receives info JSON.
4. Click emits `onSiteSelect(id)` → navigates to `/sites/{slug}` article.

---

## 7 — User Stories

1. **Explorer (desktop):** "I land on the page, tilt the 3‑D Mars under my mouse, click Valles Marineris, and instantly learn why it matters for terraforming."
2. **Student (mobile):** "On my phone, I pinch‑zoom on Olympus Mons and bookmark the related blog deep‑dive."
3. **Donor:** "After reading, I decide to chip in \$20 via a secure one‑page checkout in under 30 seconds."

---

## 8 — UX / UI Guidelines

* Typography: Inter display for headings, serif (ET Book‑like) for body.
* Colour palette: Rust‑red accents, muted greys, beige paper background (Gwern aesthetic).
* Shadows & depth to mirror Martian terrain topography.
* Hover tool‑tips follow cursor; info panel slides in from right.
* Collapsible blog sections use custom arrows that rotate on open/close.

---

## 9 — Non‑Functional Requirements

* **Performance:** < 200 KB initial JS, Gzip; images lazy‑loaded; use `prefer‑reduced‑motion`.
* **Scalability:** Static hosting scales via CDN; only serverless Stripe function must handle spikes (<= 100 req/s).
* **Security:** HTTPS enforced; CSP with `script‑src self stripe.com`; no 3rd‑party cookies.
* **Privacy:** IP anonymisation in analytics; comply with GDPR/CCPA.

---

## 10 — SEO & Social

* Pre‑rendered OG images per article via `@astrojs/image`.
* JSON‑LD `Article` schema; `SiteNavigationElement` for menu links.
* Twitter card summarising article + dynamic altitude & coordinates from site metadata.

---

## 11 — Open Questions

1. Should the globe cache tiles in IndexedDB for true offline revisit?
2. Do we need comment threads (e.g. giscus) or skip for v1?
3. Should donation tiers offer membership perks (newsletter, early posts)?

---

## 12 — Timeline (MVP)

| Phase              | Duration    | Milestones                                             |
| ------------------ | ----------- | ------------------------------------------------------ |
|  0 Planning        | 1 wk        | Finalise PRD, pick palette, collect Mars data          |
|  1 Build & Infra   | 2 wks       | Astro scaffolding, Netlify pipeline, Stripe Fn working |
|  2 Globe Alpha     | 3 wks       | Basic rotate + hotspot JSON, mobile gestures           |
|  3 Blog Alpha      | 1 wk        | MDX layout, collapsible sections, search               |
|  4 Polish & Launch | 1 wk        | A11y audit, SEO, performance budget hit                |
| **Total**          | **8 weeks** | Public launch & donation campaign                      |

---

## 13 — Acceptance Criteria (MVP)

* Lighthouse scores ≥ 90 across PWA, Performance, Accessibility.
* All priority hotspots have accurate metadata and deep‑links.
* Stripe donations reach the thank‑you page with correct metadata.
* Content team can add new articles via markdown without editing code.

---

## 14 — Stakeholders

* **Product & Content:** Benjamin Cox
* **Design:** Freelance UI/UX (TBD)
* **Engineering:** 1 Frontend (React + Three.js), 1 Full‑stack (Astro + Netlify).
* **Community / Outreach:** Volunteer moderators.

---

*End of Document*