# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Install deps: `npm install` (CI uses `bun install --frozen-lockfile` — `bun.lock` is the lockfile of record, keep it in sync even if you use npm locally)
- Dev server: `npm run dev`
- Build: `npm run build` (outputs to `dist/`)
- Type check / lint: `npm run lint` (runs `tsc --noEmit`; there is no separate ESLint config)
- Clean build output: `npm run clean`

There is no test runner configured in this repo (no test script, framework, or test files present).

## Architecture

**Client-only, no backend.** This started as an Express + `data/events.json` app but was migrated to a pure static SPA (see commit history: "Transition to local storage"). GitHub Pages only serves static files, so `src/lib/localEventStore.ts` re-implements the old REST endpoints as functions that read/write a single `localStorage` key (`gathertime_events_db`). `src/lib/api.ts` is a thin `async` wrapper around that store — it's async only so call sites wouldn't need to change if a real backend is added later. There is no cross-device sync; each browser has its own independent data.

**Two separate UI trees, not responsive breakpoints.** `src/App.tsx` calls `useViewport()` (`src/lib/useViewport.ts`, a `max-width: 767px` media query) and renders either the desktop tree (`src/components/*`) or the entire `src/mobile/*` tree (`MobileApp` → `CreateWizard` / `EventScreen` / …). These two trees are largely independent implementations sharing only `src/types.ts` and `src/lib/*` — a change to one (e.g. `ShareModal`) does not automatically apply to the other; there's a `ShareModal.tsx` and `Toast.tsx` in both `src/components/` and `src/mobile/`.

**No router.** Single-page state is driven entirely by `window.location.hash` (`#event=<id>&hostToken=<token>&tab=<tab>`), parsed/written manually in `App.tsx` via a `hashchange` listener. `skipNextHashLoadRef` exists to prevent a redundant re-fetch immediately after local event creation.

**Data model** (`src/types.ts`) is the single source of truth for both UI trees: `EventData` holds slots, participant `availability` responses, comments, and lifecycle `status` (`active` / `finalized` / `cancelled`).

**Event lifecycle logic is centralized** in `src/lib/eventStatus.ts`: voting-open checks, link-expiry (finalized events 404 seven days after the meetup date), and the derived `LifecycleStatus` labels used across both UIs. Slot/time formatting helpers live in `src/lib/slots.ts`.

**Styling**: design tokens are CSS custom properties in `src/design-system/tokens/*.css` (colors, spacing, typography), consumed directly via inline `style={{ ... }}` with `var(--color-*)` etc. throughout both UI trees, rather than through the small `src/design-system/components/` set or Tailwind utility classes (Tailwind is imported in `src/index.css` but lightly used).

**Deploy**: GitHub Actions (`.github/workflows/deploy-pages.yml`) builds with `bun` and deploys `dist/` to GitHub Pages. `vite.config.ts` sets `base: '/That-is-so-sweet/'` — this must match the actual GitHub Pages repo path or all built asset URLs break.

**Unused leftovers from the original AI Studio scaffold**: `.env.example` references `GEMINI_API_KEY`/`APP_URL`, but no code in `src/` calls the Gemini API — these predate the local-storage migration and can be ignored unless AI features are reintroduced.

## OpenSpec

`openspec/config.yaml` is present but the workflow is not yet in use (no `openspec/specs/` or `openspec/changes/` directories exist).
