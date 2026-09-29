# Solar regolith paving — visuals on the project page

## Hero film (in production)
- Files: `/videos/sintering/regolith-paver-film.webm` (VP9) and `.mp4` (H.264), poster `/videos/sintering/regolith-paver-poster.jpg`.
- Spec: 1920 × 1080, 24 fps, ~77 s, silent autoplay loop on the page (muted, playsinline). The page pauses it and shows controls for visitors with reduced-motion enabled.
- Content: a V3 concept of the five-car paving train on Mars (grade, preheat/degas, melt, screed, anneal), a schematic sequence, and the V1 Earth test head. Plates are generated footage; labels, numbers and the schematic are drawn in code and match the design on the page. It is a concept film, not footage of hardware.
- Wiring: the page emits `<source>` tags only for files that exist in `public/` at build time. Until the poster exists, it uses the concept image below. Drop the files in `public/videos/sintering/` and rebuild.

## Paving-train schematic
- Component: `src/components/sintering/PavingTrainSchematic.astro` (inline SVG).
- Style: 1970s technical cutaway — thin off-white leader lines, uppercase labels, numbered stations, phantom (dashed) lines for cut-away parts, temperature profile on the same x-axis.
- The temperatures are design targets, not measurements.

## Concept image (earlier design)
- File: `/images/sintering/autonomous-solar-cell.webp` (1672 × 941) and an 840-px variant.
- AI-generated concept of a compact solar materials cell making pavers/bricks, from the project's earlier brick phase. Now shown in the "later research threads" section and as the temporary film poster.
