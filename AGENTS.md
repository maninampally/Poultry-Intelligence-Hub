# Poultry Intelligence Hub: project instructions for AI coding tools

## Product
Mobile-first app for Indian broiler farmers (contract and independent). Goal: turn farm data into clear, actionable decisions. The farmer should understand the flock situation within 5-10 seconds of opening the app. Show numbers with meaning (e.g. "4.2% above expected"), not raw statistics. Do not add decorative charts, gradients, glass effects, or fake-futuristic AI visuals.

## Stack
- React Native + Expo (managed) + TypeScript (strict), Expo Router
- NativeWind for styling; theme is in `tailwind.config.js` (token names mirror `design/pih-design-tokens.json`)
- Zustand (UI state), TanStack Query (server state), React Hook Form + Zod (forms)
- SQLite for offline storage with a sync queue
- Backend: Supabase (Auth, Postgres, RLS, Storage) + FastAPI for business logic

## Hard rules
1. **No hard-coded colors, sizes, or font sizes.** Use the theme tokens (`bg-surface-background`, `text-ink-primary`, `text-display`, etc.). If a token is missing, add it to the config and the tokens JSON, not inline.
2. **No hard-coded user-facing text.** Every string goes through the i18n layer (`t('key')`) with English in `locales/en.json`. English only for now, but must be translatable later.
3. **Layouts must grow.** Never fix label widths; allow text to wrap. Do not truncate important labels.
4. **Touch targets** are at least 48 px, primary actions 56 px.
5. **Status is never color alone.** Pair every status color with an icon and a word (Normal / Watch / Act).
6. **Offline first.** Writes go to local SQLite first and the sync queue second. Every record shows a sync state: saved on device, pending, syncing, synced, failed.
7. **Money is stored as integer paise,** formatted for display only (Indian grouping, e.g. 1,23,456).
8. **Calculations are deterministic code** (FCR, mortality %, growing charge, variance). The LLM may only explain results, never compute them.
9. **Plain language.** Short words: "Feed", "Deaths", "Weight". Explain FCR in one line the first time it appears.
10. **Accessibility:** every interactive element has an accessibility label; text contrast stays at WCAG AA or better.

## Structure
```
app/            Expo Router screens
components/ui/  generic components (Button, Card, Chip, Input)
components/poultry/  MetricCard, AlertCard, FlockStatusCard, SyncChip, ...
lib/            money.ts, fcr.ts, sync/, db/
locales/        en.json
design/         pih-design-tokens.json
```

## Working style
- Make small, reviewable changes. One component or one screen per task.
- Add a simple test for every pure calculation function.
- Before large changes, state a short plan and wait for approval.
- If a requirement is unclear or conflicts with these rules, ask instead of guessing.
- Never invent farm data in production code. Use clearly labeled fixtures in `__fixtures__/`.
