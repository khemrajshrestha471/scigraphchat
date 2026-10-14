# sciflowdiagram

An interactive map of how SciGraphChat works, in the same spirit as the
[ArDoCo SANDMAN architecture map](https://ardoco.de/sandman/): click any box
to read what it does, see what it talks to and what depends on it, or pick a
step to follow a question end-to-end through the system. Every box can also
be dragged around freely — your layout is remembered between visits.

Plain Vite + TypeScript + [D3](https://d3js.org/) — no React/Vue/etc., and no
build-time dependency on the rest of this repo. Visual theme (teal accent,
gray scale, fonts, light/dark toggle) matches `implementation/frontend`
exactly.

Below ~860px wide, the draggable canvas switches to a plain stacked list
(no drag, no SVG lines — a vertical list of category sections, each node
showing a short "→ talks to" line instead) since there's no room left for a
free-form 2D canvas. The detail panel becomes a bottom sheet at the same
breakpoint.

Available in English and German — the EN/DE toggle in the topbar shows both
options and the current selection; the choice is remembered (`localStorage`)
between visits. All diagram, panel, stepper, and glossary content is
translated; see `src/data/types.ts` (the `LocalizedString`/`t()` helper) and
`src/data/ui.ts` (UI chrome strings) when adding new content.

Selecting a box also updates the URL hash to that box's `slug` (e.g.
`#answer-generator`) via `history.replaceState` — copy the address bar at
any point and sharing that link reopens the page with the same box selected.
The slug (not the, possibly translated, title) is used so links stay valid
across a language switch.

## Running it locally

```bash
cd sciflowdiagram
npm install
npm run dev       # opens a dev server with hot reload
```

Or with Docker:

```bash
cd sciflowdiagram
docker build -t sciflowdiagram .
docker run --rm -p 8080:80 sciflowdiagram
# open http://localhost:8080
```

## Before you publish: please check this by hand

I built and wired this without access to a real browser in my environment —
I verified the logic with a headless DOM test (`npm test`, see below), which
covers click-selection, highlighting, the detail panel, the step-through
narrator, and drag itself (simulated mouse events actually move a node and
redraw its edges). **That's a strong signal the logic is correct, but it is
not the same as seeing it render.** Before you publish, please at least:

- Run `npm run dev`, open it, and confirm it *looks* right — spacing,
  colors, text wrapping, both light and dark mode.
- Drag a few boxes around and confirm it feels smooth (this was the one
  feature I couldn't watch happen myself).
- Scroll the page — it should scroll vertically as one normal page (not a
  clipped inner box), while the wide diagram area scrolls left-right on its
  own.
- Hover/focus a box — its connections should appear as curved arrows (with
  arrowheads) pointing in the right direction; nothing should be visible
  before that. Click it, then click elsewhere to deselect — the arrows
  should disappear again.
- Check whether the full 4-column grid now fits your screen width without
  horizontal scrolling. I shrank fonts/spacing to target a typical
  ~1366px-wide laptop (canvas + panel ≈ 1274px) — if your screen is smaller
  than that, or it still doesn't fit, tell me your resolution and I'll tune
  it further.
- Shrink the window below ~860px — it should switch to the stacked list
  layout (no drag, no horizontal scroll needed), step buttons should wrap
  onto multiple lines, and clicking a row should draw a curved arrow (with
  arrowhead) to its connected rows, not just the text hint.
- Check the glossary at the bottom: each term should be a bordered card; the
  ones with a teal "show in diagram" link should scroll back up and select
  the matching box when clicked.
- Try tabbing through the page with just the keyboard — focus should reach
  every box and button, and clicking/activating a box should visibly move
  focus to its detail panel.

If anything looks off, tell me what and I'll fix it before you publish.

## Accessibility

Targets WCAG 2.x AA (WCAG 3.0 is still an unfinished W3C draft with no
stable success criteria to test against — this follows the stable baseline
it's expected to carry forward, same approach used for the main app). What's
in place: a single `<h1>`, `<h2>` headings for every category/panel/glossary
section, `<header>`/`<main>`/`<section>` landmarks, the detail panel is a
`role="region"` with `aria-live="polite"` so screen readers hear it update,
selecting a box moves keyboard focus to its panel heading, the step buttons
expose `aria-pressed`, the glossary is a real `<dl>`/`<dt>`/`<dd>` list, and
every interactive element is keyboard-reachable with a visible focus ring.
One real bug this caught: the "muted" text color measured 2.5:1 contrast in
light mode and 3.7:1 in dark mode against its background — both fail the
4.5:1 WCAG AA minimum for normal text. Fixed by swapping to the nearest gray
step that actually passes (4.8:1 / 7:1). Verified via `npm test`
(structure/ARIA/focus) plus manual contrast-ratio calculation (color, not
something a DOM test can check) — not an automated accessibility scanner
(e.g. axe or Lighthouse), so a real audit pass is still worth doing before
you consider this a compliance claim rather than a good-faith pass.

## Project structure

```
src/
  data/
    types.ts        — the data shapes (Category, FlowNode, FlowStep)
    categories.ts    — the 10 functional groupings shown as boxes
    nodes.ts          — the ~21 components; this is almost all the content
    steps.ts           — the 8-step "follow a question" walkthrough
    edgeStyles.ts        — which connections render dashed vs solid
    glossary.ts            — plain-language term definitions
  render/
    layout.ts        — computes the default (non-dragged) grid position of every box
    geometry.ts        — rectangle/line math for where an arrow touches a box's edge
    diagram.ts           — the main renderer: canvas mode (D3 drag, curved SVG
                            edges, click/hover highlighting) + stacked mode
                            (narrow screens), switching at the 860px breakpoint
    panel.ts                — the right-hand (or bottom-sheet) detail panel
    stepper.ts                — the step-through narrator bar
    glossary.ts                 — renders the glossary section
    icons.ts                      — lucide icon lookup
    theme.ts                        — light/dark toggle (mirrors the main app's ThemeContext)
  style.css          — Tailwind + theme tokens + the component classes the
                        render/ modules apply via classList
  main.ts           — wires the above together (topbar, intro, stepper,
                        diagram + panel, glossary)
smoke-test.ts   — a headless logic test (not part of the production build)
Dockerfile, nginx.conf, .dockerignore   — builds + serves the static site
```

## Updating the content (adding/editing a component)

This is almost always the only thing you need to touch:

1. Open `src/data/nodes.ts`. Each entry is one box: `id`, `title`, `slug`
   (shown as a small technical label), which `categoryId` it belongs to, an
   `icon` (see `src/render/icons.ts` for the names currently imported — add
   a new lucide icon import there if you need one not already listed),
   `summary`/`description`/`howItFits` (what the detail panel shows), and
   `talksTo` (the ids of other nodes this one calls — the reverse "used by"
   list is computed automatically, never entered twice). `title`/`summary`/
   `description`/`howItFits` are `{ en, de }` objects (see
   `LocalizedString` in `src/data/types.ts`) — always fill in both
   languages; `id`, `slug`, `categoryId`, `icon`, `talksTo`, and
   `technicalDetails` stay plain strings since they're referenced by id, not
   displayed as translatable prose.
2. If it's a new category, add it to `src/data/categories.ts` and give it a
   `{ col, row }` slot in the `GRID` constant at the top of
   `src/render/layout.ts`.
3. If a new connection should render dashed instead of solid (cross-cutting
   / background / aggregating, rather than a direct call), add its
   `"source-id->target-id"` to `src/data/edgeStyles.ts`.
4. If it's relevant to the question-answering flow, consider adding it to a
   step in `src/data/steps.ts` too.
5. Run `npm test` (see below) — it will catch a typo'd id immediately,
   before you ever load the page.

## Testing

```bash
npm test
```

Runs `smoke-test.ts` in a headless DOM (jsdom), without opening a real
browser. It checks:

- **Data integrity** — every `talksTo`/`steps` id actually refers to a real
  node, no category is empty, no stale `edgeStyles.ts` entries.
- **Layout** — no `NaN` coordinates, every node starts inside its own
  category box.
- **Interaction (canvas mode)** — clicking a node selects it, highlights
  exactly its real neighbors (not unrelated nodes), opens the detail panel
  with the right content, panel links navigate correctly, the
  technical-details section toggles, the stepper activates/deactivates and
  highlights the right chain, drag actually moves a node and redraws its
  edges, and a dragged position survives a simulated page reload
  (localStorage).
- **Interaction (stacked mode)** — the same selection/highlight/panel
  behavior, verified again against the separate narrow-screen rendering
  path, which shares none of canvas mode's drag/SVG code.

This is a maintenance tool, not a deployed part of the site — it's excluded
from `npm run build`.

## Publishing to GitHub Pages

**This repository's remote is GitLab**, not GitHub — so the included
workflow (`.github/workflows/sciflowdiagram-pages.yml`, at the repo root)
sits dormant until this code actually lives in a GitHub repository. Two ways
to get there:

**Option A — mirror this repo to GitHub.** Push (or mirror) this whole
repository to a new GitHub repo. The workflow activates automatically on the
next push to `main` that touches `sciflowdiagram/**`, builds it, and deploys
to GitHub Pages. Then in that GitHub repo: **Settings → Pages → Source:
"GitHub Actions"**.

**Option B — a dedicated repo just for this site.** Create a new, empty
GitHub repo and copy the contents of this `sciflowdiagram/` folder into its
root (so `index.html`, `package.json`, etc. are at the new repo's top
level — not nested). Move `.github/workflows/sciflowdiagram-pages.yml` into
that repo too, and simplify it: remove `working-directory:
sciflowdiagram`, `cache-dependency-path: sciflowdiagram/...`, and the
`sciflowdiagram/` prefix on the final `path:` line, since everything is now
at the repo root. Same Settings → Pages step as above.

Either way, `vite.config.ts` uses a **relative base path** (`base: './'`),
so the built site works correctly whether it ends up served at a GitHub
project page (`you.github.io/repo-name/`), a GitHub user/org page
(`you.github.io/`), or a custom domain — no config changes needed per
destination.

If you'd rather publish by hand once, without any CI: `npm run build`
produces a plain static site in `sciflowdiagram/dist/` — upload that folder
to any static host (GitHub Pages' "deploy from branch → /docs" option, a
GitLab Pages job, Netlify, Cloudflare Pages, anything that serves static
files).
