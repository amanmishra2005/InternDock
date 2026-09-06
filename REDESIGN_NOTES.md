Q# InternDock — UI Redesign Notes

## What was actually wrong
The React components (Header, Footer, Home, DomainCard, dashboards, admin
panels, auth pages, etc.) were already well built — good structure, real
framer-motion animations, sensible layout. But `src/styles/index.css`, the
one global stylesheet the whole app depends on, only defined a handful of
the CSS variables and utility classes every component was actually using
(things like `--border-color`, `--text-muted`, `--radius-md`, `.btn`,
`.glass-card`, `.badge-pill`, `.input-field`, `.gradient-text`, etc. were
referenced everywhere but never defined). That's why the UI looked broken —
almost the entire design system was missing, not the markup.

## What changed

- **`src/styles/index.css`** — rewritten as a complete design system:
  brand colors (indigo → violet primary, cyan/emerald/amber accents),
  typography (Outfit for headings, Inter for body), radii, shadows,
  buttons, glass cards, badge pills, status pills, form fields, tables,
  stat cards, spinners, modals, and shared keyframe animations
  (`fadeInUp`, `floatY`, `pulseDot`, `gradientShift`). This one file is
  what makes every page — landing, features, steps-to-apply, domains,
  contact, dashboards, admin, auth, verification — render consistently.
- **`src/components/Logo.jsx`** (updated) — a crisp inline SVG brand
  mark: an "ID" monogram resting on a small dock/pier glyph, indigo →
  violet → cyan gradient. Earlier drafts stacked a full anchor icon,
  code brackets, and the "ID" letters together, which read as three
  competing symbols; this fuses them into one glyph. The static
  `logo.png`, `favicon.png`, `apple-touch-icon.png`, and `og-image.png`
  in `/public` were regenerated to match this mark (the OG image is now
  the correct 1200×630 instead of a reused square icon).
- **`src/components/Header.jsx`** — now uses the new logo, and the nav
  links to all the requested sections: Features, How it Works (steps to
  apply), Domains, Verification, and Contact (desktop + mobile menu).
- **`src/components/Footer.jsx`** — new logo, added an explicit "Contact
  Us" link alongside the existing support/social links.
- **`src/pages/Home.jsx`** — added the `id="features"` anchor so the new
  header nav can jump straight to it (Hero, Features, Steps, Domains
  slider, and Contact form were already built here — they just needed
  the stylesheet fix above).
- Removed `src/components/Navbar.jsx` — unused dead code from an earlier
  version of the app (had the wrong old brand name and wasn't imported
  anywhere).

## Before you run it

`node_modules/` was stripped out of this zip to keep it small. From each
of `frontend/` and `backend/`, run:

```
npm install
npm run dev      # frontend (Vite)
npm run dev       # or `node server.js` — check backend/package.json
```

Note: the frontend's `node_modules` in the environment I worked in had a
platform-mismatched native `rollup`/`esbuild` binary (from being
zipped/unzipped across machines), so I verified every `.jsx`/`.js` file
parses cleanly with Babel and hand-checked the CSS for balanced syntax,
but I could not run a full `vite build` end-to-end. A fresh `npm install`
on your machine will pull the correct native binaries and it should build
normally — if anything looks off, it's worth a quick `npm run build` check
first.
