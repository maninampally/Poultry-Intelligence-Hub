# Poultry Intelligence — Mobile App

Offline-first mobile app for Indian broiler farmers, built fresh from the
product mockups. Expo + TypeScript + Expo Router + NativeWind.

> Note: the source mockups show the legacy "Murgi Mitra" wordmark. Per the
> product-direction docs the product is renamed **Poultry Intelligence**, which
> is what the UI uses.

## Stack

- **Expo SDK 51** + React Native 0.74
- **Expo Router** (file-based navigation, bottom tabs)
- **NativeWind** (Tailwind CSS for React Native) — brand palette in `tailwind.config.js`
- **react-native-svg** — lightweight custom line/bar charts (no heavy chart dep)
- **@expo/vector-icons** (Ionicons)
- Local demo data (offline-first); structured so a backend/sync layer drops in later

## Getting started

```bash
cd apps/mobile
npm install

# Start the dev server (choose a target from the Expo CLI menu)
npm start

# Or launch directly:
npm run android   # Android device / emulator
npm run ios       # iOS simulator (macOS only)
```

Scan the QR code with the **Expo Go** app, or press `a`/`i` in the terminal to
open an emulator.

## Verify

```bash
npm run typecheck   # tsc --noEmit  (passes with 0 errors)
npx expo export --platform android   # full Metro bundle (sanity build)
```

## Project structure

```
apps/mobile/
├── app/                        # Expo Router routes (file-based)
│   ├── _layout.tsx             # Root stack + global.css + SafeAreaProvider
│   ├── index.tsx               # Redirects to /login
│   ├── login.tsx               # B.1 Login
│   ├── daily-record.tsx        # B.4 Add Daily Record (modal)
│   ├── flock/[id].tsx          # B.3 Flock Details (Overview/Growth/Records)
│   ├── (tabs)/                 # Bottom tab bar
│   │   ├── _layout.tsx         # Home · Flock · Records · Reports · More
│   │   ├── index.tsx           # B.2 Home / Dashboard
│   │   ├── flock.tsx           # Flock calendar
│   │   ├── records.tsx         # Add & Manage hub
│   │   ├── reports.tsx         # B.8 Reports & Analytics
│   │   └── more.tsx            # Profile & Farm Setup + menu
│   ├── records/
│   │   ├── feed-water.tsx      # B.5 Feed & Water
│   │   ├── health.tsx          # B.6 Health & Mortality
│   │   └── medicine.tsx        # B.7 Medicine & Vaccination
│   └── more/
│       ├── finance.tsx         # B.9 Finance / Batch Comparison
│       ├── history.tsx         # B.10 Historical Batches
│       ├── ai.tsx              # B.11 AI Assistant
│       └── cloud.tsx           # B.12 Cloud & Security
├── src/
│   ├── components/ui/          # Design system (Button, Card, Badge, MetricCard,
│   │                           #   AlertBanner, ScreenHeader, SegmentedControl,
│   │                           #   LineChart, BarChart, ProgressBar, Logo, Input)
│   ├── data/                   # models.ts (types) + demo.ts (mockup-exact data)
│   └── theme/                  # tokens.ts (colors/tones/spacing) + global.css
├── tailwind.config.js          # Brand palette: green #2e7d52, cream, amber, red
├── app.json  babel.config.js  metro.config.js  tsconfig.json
```

## Design language (from the mockups)

- Deep agricultural **green** `#2e7d52` brand color
- Cream / white cards on a `#faf8f3` background
- **Amber** for "needs attention", **red** for mortality/critical, calm **green**
  for healthy/normal
- Contextual metrics ("+8% vs yesterday", "Expected: 1,180") over bare numbers
- Android-first, large touch targets, bottom tab navigation

## Screens implemented

All 12 application screens from Mockup B, plus the flock calendar and profile
screens from Mockup A — Login, Home Dashboard, Flock Details, Daily Record,
Feed & Water, Health & Mortality, Medicine & Vaccination, Reports & Analytics,
Finance / Batch Comparison, Historical Batches, AI Assistant, Cloud & Security.

## Next steps (not in this pass)

- Wire screens to the FastAPI backend + Supabase (`/auth`, `/batches`, `/sync`)
- SQLite local store + sync outbox (offline-first persistence)
- Zustand + TanStack Query for state/server-cache
- React Hook Form + Zod validation on the entry forms
- Lifting & settlement workflow surfaced in Flock Details / Finance
