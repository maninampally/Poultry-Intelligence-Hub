# First task prompt (paste into Kiro / Cursor / Copilot chat)

Read AGENTS.md and design/pih-design-tokens.json first. Do not write code until you have shown me a short plan and I approve it.

## Task: project foundation and first four components

1. Initialize an Expo + TypeScript (strict) project with Expo Router and NativeWind. Use the provided `tailwind.config.js` as-is.
2. Set up the i18n layer with `locales/en.json`.
3. Build these components in `components/poultry/`, each with a preview screen at `app/dev/components.tsx` showing every state:

**MetricCard**
- Props: label, value, unit, status ('normal' | 'watch' | 'act'), meaning (short sentence, e.g. "4.2% above expected").
- Shows label, large value (text-display), unit, and the meaning line. Status chip includes icon + word.

**AlertCard**
- Props: severity, title, reason, actions (array of {label, onPress}).
- Reason text is always visible. Up to 3 action buttons (e.g. View trend, Record observation, Ask AI), each 48 px high or more.

**StatusChip**
- Props: status. Variants Normal / Watch / Act, each with icon, word, and its fg/bg token colors.

**SyncChip**
- Props: state ('saved' | 'pending' | 'syncing' | 'synced' | 'failed').
- Distinct icon and word per state; 'failed' includes a retry affordance.

## Rules for this task
- Follow every rule in AGENTS.md, especially: theme tokens only, no hard-coded strings, wrapping layouts, 48 px touch targets, status never by color alone.
- Include accessibility labels.
- Use fixture data from `__fixtures__/` for the preview screen.
- Show me the file list and plan first. Then implement one component at a time and stop after each for review.

## Done when
- The app runs on an Android device or emulator.
- The preview screen shows every component in every state.
- No hex colors or raw pixel font sizes appear in component files (search to confirm).
