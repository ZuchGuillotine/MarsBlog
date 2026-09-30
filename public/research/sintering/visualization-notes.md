# Solar regolith paving — visuals on the project page

## Hero film — "Sun-paved" (Sept 2026)
- Files: `/videos/sintering/regolith-paver-film.mp4` (H.264, ~2 Mbps, 20 MB), poster `/videos/sintering/regolith-paver-poster.jpg`. 1920 × 1080, 24 fps, 76.8 s.
- Page behaviour: muted autoplay loop with controls; paused for visitors with reduced motion.
- Structure (100 BPM, cuts on the bar): landing plume and stalled wheels → title → the train arrives and deploys its dish and iris → side-elevation schematic of all five stations with the temperature profile → one close-up per station (grade, preheat/degas, melt, filler metering, screed, joint scoring, anneal) → finished road, crew rover, landing pad → the planned V1 Earth rig → V1/V2/V3 roadmap card.
- Picture: stills from Grok Imagine Image 2.0, animated with Grok Imagine Video 1.5 (image-to-video, 1080p). Every train prompt carries the same written machine description so the five cars, dish, blade and hood stay consistent. Prompts and picks are kept in the project's `film-work/` folder (`prompts.json`, `picks*.json`, `gen-log.jsonl`).
- Graphics: labels, numbers, the schematic and the title/end cards are drawn in code (canvas in headless Chromium) on the music grid; stations, temperatures and numbers match this page.
- Score: original, synthesized in code (numpy); no samples.
- It is a concept film of the V3 design, not footage of hardware.

## Paving-train schematic
- Component: `src/components/sintering/PavingTrainSchematic.astro` (inline SVG).
- Style: 1970s technical cutaway — thin off-white leader lines, uppercase labels, numbered stations, phantom (dashed) lines for cut-away parts, temperature profile on the same x-axis.
- The temperatures are design targets, not measurements.

## Concept image (earlier design)
- File: `/images/sintering/autonomous-solar-cell.webp` (1672 × 941) and an 840-px variant.
- AI-generated concept of a compact solar materials cell making pavers/bricks, from the project's earlier brick phase. Now shown in the "later research threads" section and as the temporary film poster.
