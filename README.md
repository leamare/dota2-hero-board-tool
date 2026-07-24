# Hero Grid Tool

A web app for building, saving and sharing custom Dota 2 hero grids.
Rebuilt from scratch in TypeScript + React (the original was AngularJS).

## Features

- Categories of heroes **and** items, with coloured labels, preset names, or a
  hero/item icon as the label.
- Multiple portrait styles (wide, tall, square icons, item icons, badges) set
  per board or overridden per category.
- Alternate hero portraits (personas, arcanas) per placed hero.
- Custom widths, forced row breaks and dashed separators to line categories up.
- Drag-and-drop reordering of categories and of portraits within/between them.
- **Share links** that pack the whole grid into a compact binary blob encoded as
  URL-safe base64 — a typical grid fits in ~100 characters, no server needed.
- Saved layouts in local storage, plus JSON export/import.

## Data sources

Nothing is bundled or downloaded at build time — everything is referenced live:

- **Metadata** (hero/item names, alticons): the spectral LRG2 API.
- **Images** (portraits, icons, items): the spectral courier CDN.

## Tech

- Vite + React + TypeScript
- zustand for state (with local-storage persistence)
- dnd-kit for drag and drop
- react-router (hash routing, static-host friendly)

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run test` — unit tests (share encode/decode round-trip)
- `npm run typecheck` — type-check only

## Styling

The visual style is derived from the spectral-main site theme: the design tokens
in `src/styles/theme.css` are ported from it and extended with grid- and
label-specific variables.
