# ai-pulse-web

React + ECharts dashboard for [AI Pulse](https://github.com/ronniechong/ai-pulse-data),
deployed on Vercel. Fetches versioned JSON snapshots at runtime from the
`ai-pulse-data` repo — no rebuild needed when the data updates.

Stack: Vite 7 (rolldown-vite) + React + TypeScript, Tailwind v4 + shadcn/ui,
ECharts via a custom thin wrapper hook, design tokens as CSS variables
feeding a generated ECharts theme.

Planning, architecture, and decision log are tracked outside this repo.
