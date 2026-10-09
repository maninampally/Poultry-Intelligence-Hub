# Second task prompt: Home screen + Daily Record (offline)

Read AGENTS.md first. Components from task 1 (MetricCard, AlertCard, StatusChip, SyncChip) already exist and must be reused, not rewritten. Show me a short plan and wait for approval before coding.

## Part A: local data layer (do this first)

Use expo-sqlite. Create `lib/db/` with migrations and typed query functions.

Tables (local):
- `flocks`: id, name, placed_on, birds_placed, status ('growing' | 'ready_for_lifting' | 'completed')
- `daily_records`: id (uuid generated on device), flock_id, record_date, feed_kg, water_l, deaths, avg_weight_kg (nullable), notes (nullable), photo_uri (nullable), created_at, updated_at, sync_status ('saved' | 'pending' | 'syncing' | 'synced' | 'failed')
- `sync_queue`: id, entity, entity_id, operation, payload (json), attempts, last_error, created_at
- Unique constraint: one daily record per flock per date. Saving again for the same date updates it.

Rules: every save writes the record AND a sync_queue row in one transaction. Sync itself is out of scope for this task; just leave the queue filled and show the state as 'pending'.

## Part B: calculations (pure functions in `lib/metrics/`, with tests)

- `ageInDays(placedOn, today)`
- `currentBirds(placed, totalDeaths)` and `livabilityPct`
- `deviationPct(actual, expected)`
- `statusFromDeviation(deviation, thresholds)` returning 'normal' | 'watch' | 'act'
- `mortalityPct(deaths, currentBirds)`

Expected values (target weight, expected feed per day) must come from a config table `config/targets.ts` keyed by day. I will supply the real breed-standard numbers. For now fill it with clearly labeled PLACEHOLDER values and add a comment at the top saying they are not real standards. Thresholds also live in config, not inline.

## Part C: Home (Intelligence Dashboard) at `app/(tabs)/index.tsx`

From top to bottom:
1. Header: greeting, farm name, today's date, notifications icon.
2. Active flock card: flock name, day number, current birds, average weight, livability, status.
3. "Needs attention" section: AlertCards generated from the data (e.g. feed above expected by more than the threshold, deaths above the recent average). Each alert shows the reason and actions. If there are none, show a calm "Nothing needs attention today" state.
4. Today's numbers: MetricCards for feed, deaths, weight, each with a meaning line.
5. Quick actions: Daily Record, Deaths, Feed, Medicine. Large buttons, 56 px high.
6. Bottom tab bar: Home, Flocks, Records, Insights, Finance (only Home needs to work; others can be placeholder screens).

Read from the local database. Use fixtures only when the database is empty and label them clearly. Do not add charts in this task.

## Part D: Daily Record form at `app/records/new.tsx`

Fields: date (default today), feed (kg), water (litres), deaths, average weight (kg, optional), photo (optional), notes (optional).
- Use number steppers with a numeric keypad fallback, not free text.
- Show the expected value beside each field when targets exist.
- Validate with Zod (no negative numbers, deaths not above current birds, weight in a plausible range). Error messages are short and plain.
- Show a SyncChip on the form and on saved items.
- Works fully with no network.
- After saving, return to Home, which must reflect the new record immediately.

## Rules for this task
- Follow every rule in AGENTS.md. All text through i18n, tokens only, 48 px targets, wrapping layouts, accessibility labels.
- Deterministic logic only in `lib/metrics/`. The UI contains no calculations.
- Stop after each part for review.

## Done when
- With airplane mode on, I can add a record and see Home update.
- Saving a second time on the same date updates, not duplicates.
- Unit tests pass for every function in `lib/metrics/`.
- Searching for hex colors and hard-coded strings in screens finds nothing.
