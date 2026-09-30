# CallHero Morning Brief

A front-end prototype that turns 31 weekend calls into a prioritised Monday action plan for Harbourside Dental.

## Stack

- React and TypeScript
- Vite
- Tailwind CSS
- Vitest
- ESLint and Prettier

No backend is required. The application reads `weekend-calls.json` and keeps prototype interactions in browser state.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Project boundaries

```text
src/
  data/                  JSON adapter and derived dashboard model
  features/
    shell/               Page composition
    summary/             Top summary metrics
    calendars/           Patient and front-desk calendar lanes
    actions/             Action queue and filters
    action-dialog/       Selected-action workflow
  state/                 Shared prototype state
  types/                 Shared contracts
```

See `CONTRIBUTING.md` for the four-person branch plan and merge workflow.

## Important data note

The scenario describes Friday 14 November through Monday 17 November, but those weekdays match 2025 rather than the `2026` values in the JSON. The product should treat the weekday labels as needing confirmation.
