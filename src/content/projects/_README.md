# Project research-log entries

Each `.md`/`.mdx` file in this folder (except files starting with `_`) is one
research-log entry. Entries with `project: 'sintering-bricks'` appear on
`/construction/sintering-bricks`, newest first.

## Adding a new entry

Create a new `.mdx` file here:

```mdx
---
title: 'First Successful Sinter'
description: 'One-line summary shown under the entry title.'
pubDate: 2026-08-15
project: 'sintering-bricks'
tags: ['sintering', 'solar']
videos:
  - src: '/videos/sintering/first-sinter.mp4'
    caption: 'Focal spot reaching temperature on the packed mold.'
    poster: '/videos/sintering/first-sinter-poster.jpg' # optional
images:
  - src: '/images/sintering/brick-01.jpg'
    alt: 'First sintered MGS-1 brick'
    caption: 'Brick after cooling.' # optional
---

Write the entry body here in Markdown — headings, lists, links, tables all work.
```

## Adding videos

Put video files in `public/videos/sintering/` and reference them by URL path
(`/videos/sintering/<file>.mp4`). MP4 (H.264) plays everywhere. Keep files web
sized (roughly under ~50 MB); host longer footage on YouTube/Vimeo and embed it
with an iframe in the entry body instead.

Set `draft: true` in the frontmatter to keep an entry off the site while it's
in progress.
