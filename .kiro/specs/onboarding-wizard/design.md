# Design Document — Onboarding Wizard

## Overview

The onboarding wizard is a guided, three-step farm setup presented at `/onboarding`:
**Farm → Sheds → First batch**, with an in-step Review before commit. It is a
local-prototype feature built entirely on the existing `Farm_Store`
(`src/store/farm-store.tsx`) and its `localStorage` persistence. No backend,
Supabase, auth provider, DB migration, or network sync is introduced.

The intended feel is "a practical farm notebook made digital": calm, readable,
one decision at a time — not a corporate ERP or a chart-heavy dashboard. It
reuses the auth page's tokens and typography rather than introducing a second
design system.

This document covers both the UI/interaction design (the farmer-facing wizard)
and the technical design (store/type/persistence changes) derived from
`requirements.md`.

## Requirements reconciliation note

`requirements.md` R7.1 states "exactly two explicit choices" (now / later) with
R7.3 then splitting *now* into planned vs confirmed. The approved UI design
collapses this into **three explicit radio choices** on Step 3:

1. Plan a batch (chicks not arrived)
2. Record an existing placement (chicks already placed)
3. I'll add a batch later

This is behaviourally equivalent (now→planned, now→confirmed, later) and is the
cleaner presentation. R7 should be refined to read "three explicit choices." All
other requirements are unchanged.

---

## Verified codebase mechanics (grounding)

These were confirmed against the live code and drive the technical design:

- **Storage key:** `STORAGE_KEY = "poultry-intelligence-demo-v1"`.
- **Load path:** `loadState()` returns `createSeed()` when there is no saved blob
  OR when the parsed blob fails the guard `parsed.version === 1 && Array.isArray(batches) && Array.isArray(rounds)`.
  Therefore **we must not bump `version` to a value the guard rejects** — doing so
  would silently reset every existing demo workspace to seed. New fields are
  backfilled inside the existing `version === 1` branch (migration-on-load).
- **Persistence:** `FarmProvider` writes the whole `FarmState` to `localStorage`
  on every change via `useEffect`.
- **Hook shape:** `useFarm()` returns `{ ...state, ...buildMetrics(state), currentUser, dispatch, state }`.
  State collection for members is `state.team`.
- **Active-batch selection:** `buildMetrics(state, batchId = state.activeBatchId)`
  does `state.batches.find(id === batchId) ?? state.batches[0]`. The `?? batches[0]`
  fallback means an empty/unknown `activeBatchId` would surface a seed batch. The
  dashboard empty state (R8) must therefore key off "no real batch in this
  workspace," and a fresh owner workspace must contain **no** seed batches.

---

## Data model changes

All additive; backfilled on load so existing `version: 1` blobs keep working.

### FarmSettings
```ts
interface FarmSettings {
  farmName: string
  location: string
  notifications: boolean
  timezone: string // NEW — default "Asia/Kolkata"
}
```

### Shed
```ts
interface Shed {
  id: string
  name: string
  placedBirds: number
  capacity: number // NEW — configured capacity, distinct from placedBirds
}
```

### Batch allocations
```ts
interface BatchAllocation { shedId: string; count: number } // NEW

interface Batch {
  // ...existing fields...
  shedIds: string[]                 // kept; derived from allocations for compatibility
  allocations: BatchAllocation[]    // NEW — per-shed bird distribution
}
```
A batch is never permanently attached to one shed; `shedIds` is derived as
`allocations.map(a => a.shedId)`.

### Onboarding status (workspace-scoped)
```ts
type OnboardingStatus = "not_started" | "in_progress" | "completed"

interface OnboardingDraft {
  draftId: string            // stable; basis for idempotent commit
  step: 1 | 2 | 3
  farm: { farmName: string; location: string; timezone: string }
  sheds: { draftId: string; name: string; capacity: string }[]
  batchMode: "planned" | "placed" | "later" | null
  batch: {
    draftId: string
    code: string
    breed: string            // may be the "not known yet" sentinel
    breedUnknown: boolean
    supplier: string
    date: string             // expected (planned) or actual (placed)
    placedCount: string      // placed mode only
    allocations: { shedDraftId: string; count: string }[]
  } | null
}

interface FarmState {
  version: 1
  // ...existing...
  onboarding: { status: OnboardingStatus; draft: OnboardingDraft | null } // NEW
}
```

### Migration-on-load (backfill)
Inside the existing `version === 1` branch of `loadState()`:
- `settings.timezone ??= "Asia/Kolkata"`
- each `shed.capacity ??= shed.placedBirds || 0`
- each `batch.allocations ??=` derived from `shedIds` (even split or single shed → `placed`)
- `onboarding ??= { status: "completed", draft: null }` for the **existing demo
  blob** (so a returning demo user is not forced into onboarding), because the
  demo workspace is already "set up."
- `createSeed()` (the demo workspace) sets `onboarding: { status: "completed", draft: null }`.

### Fresh owner workspace
A new helper `createEmptyWorkspace()` returns a FarmState with the **same shape**
as seed but **no** sheds, batches, rounds, mortality, finance, or demo team — only
the newly signed-up owner in `team`, empty settings, `activeBatchId: ""`, and
`onboarding: { status: "not_started", draft: null }`. This keeps Seed_Data
separate (R16) and prevents demo leakage (R8.3 / R16.3).

---

## Store actions

```ts
| { type: "onboarding-start" }
| { type: "onboarding-save-draft"; draft: OnboardingDraft }
| { type: "onboarding-complete"; commit: OnboardingCommit }
```
Where `OnboardingComplete` is a single coordinated **Final_Commit** payload:
```ts
interface OnboardingCommit {
  draftId: string
  settings: { farmName: string; location: string; timezone: string }
  sheds: Shed[]                         // stable ids derived from shed draftIds
  batch:
    | null                              // "later"
    | { kind: "planned"; batch: Batch } // status "setup", no live birds, activeBatchId untouched
    | { kind: "placed"; batch: Batch }  // status "active", sets activeBatchId
}
```

### Reducer behaviour
- `onboarding-start`: if `status === "not_started"`, set `in_progress`. No-op otherwise.
- `onboarding-save-draft`: replace `onboarding.draft` (idempotent overwrite).
- `onboarding-complete` — **idempotent Final_Commit**:
  - If `onboarding.status === "completed"`, **no-op** (guards double-click / re-entry).
  - Otherwise: `upsert` each shed and the batch by **stable id** (ids derived from
    draftIds), so a repeated commit resolves to the same records (no duplicates).
  - Apply settings via the same merge as `update-settings` (current workspace only).
  - Set `activeBatchId` only for a `placed` batch.
  - Set `onboarding = { status: "completed", draft: null }`.
  - Never clears existing collections (R16.2).

Stable ids: `shed.id = "shed-" + shedDraftId`, `batch.id = "batch-" + batchDraftId`.
Because `upsert` matches on `id`, committing twice updates in place rather than
appending.

### Failure handling
Validation (Zod) runs before dispatch. If the final validation/commit throws, the
wizard catches it, leaves `status` at `in_progress`, keeps the draft, and shows a
retryable error (R15.2–15.3). (In the local prototype a dispatch does not throw,
so "failure" is modeled as a pre-commit validation failure that blocks the commit.)

---

## Routing & entry

- New route `"/onboarding"` under `RequireAuth` (reachable only when signed in),
  rendering outside `AppShell` (full-screen wizard like the auth page).
- **After owner sign-up** (`auth.tsx` `signUp`): create the owner into a fresh
  workspace, dispatch `onboarding-start`, navigate to `/onboarding`.
- **Invited members** (manager/worker sign-up/sign-in): unchanged — no
  `onboarding-start`, straight to `/dashboard` (R3).
- **Guard on `/onboarding`:** if `onboarding.status === "completed"` or the current
  user is not an owner, redirect to `/dashboard`. Otherwise render the wizard,
  restoring the draft and resuming at `draft.step` (R2).
- A completed owner never sees onboarding on subsequent logins (R1.2).

---

## UI design

### Visual tokens
Warm off-white background, white form surface with subtle border, deep forest
green primary (`bg-primary`), charcoal text, amber (icon + word) warnings. All
controls `h-12`, large labels, generous spacing. Reuse `Input/Label/Select/Button`.
No decorative illustration.

### Layout
- **Mobile:** full-width page; compact header ("Poultry Intelligence" / "Set up
  your farm"); horizontal step indicator `① Farm — ② Sheds — ③ Batch` (completed
  steps show a check + word); scrollable step body; sticky bottom action bar with
  Back (hidden on step 1) and the primary action (Continue → / Review → / Finish).
- **Desktop:** two-column — left rail with the step list (icon + word, check when
  done) and a live setup summary; right column with the current step form and the
  action row.

### Step 1 — Farm
Heading "Let's set up your farm"; sub "Add your farm details. You can add sheds
and batches next." Fields: Farm name (required), Location (required), Farm
timezone (Select, default India — Asia/Kolkata). Helper: "You can change these
later." Explicitly **not** here: supplier, finance, GST, performance.

### Step 2 — Sheds
Heading "Where will your birds be housed?" Repeatable shed cards ("Shed 1", "Shed
2", …), each with Shed name (required) and Bird capacity (required positive
integer, `birds` suffix) plus the helper "Capacity is not the number of birds
currently placed." "＋ Add another shed" adds a card; each card past the first has
a labelled Remove action. Running summary "N sheds · X total capacity." Entered
values are preserved on Back (held in the draft).

### Step 3 — First batch
Heading "Ready to add your first batch? You can also do this later." Three radio
cards: **Plan a batch** / **Record an existing placement** / **I'll add a batch
later**.

- **Record an existing placement (confirmed):** reveal Batch name/code, Breed/strain
  (with a "Not known yet" toggle/option), Supplier (optional), Actual placement
  date (not in the future), Total chicks placed, and an allocation list over the
  sheds from step 2:
  ```
  Chicks placed                       8,000
  Allocate to sheds
  ☑ Shed A   Capacity 5,000  [4,000]
  ☑ Shed B   Capacity 5,000  [4,000]
  ✓ 8,000 of 8,000 birds allocated
  ```
  Inline messages: "N birds still need a shed allocation" when sum < placed; an
  over-allocation message when sum > placed; an amber per-row "Over capacity"
  flag when an allocation exceeds that shed's capacity (blocks commit, R10.5).
- **Plan a batch (planned):** same fields minus actuals — labelled expected /
  planned, no placed count, no live-bird counts. Expected date should be today or
  later.
- **I'll add a batch later:** no batch fields; proceeds to Review.

### Review (within Step 3)
```
Review your setup
Farm        Edit      <name> / <location>
Sheds       Edit      <shed · capacity> ...
First batch Edit      <code · Already placed/Planned/none>
[ Finish setup → ]
```
Each Edit jumps back to the relevant step with values intact. If batch skipped:
"No batch added yet. You can create one from your dashboard." On successful local
save: "Your farm setup is saved on this device." + "Go to dashboard." Never
"Synced" / "Saved to cloud" (R17.3).

### Dashboard empty state (skip path)
When the workspace has no real batch, the Today dashboard shows a "Create your
first batch" empty state and renders flock values as not-recorded indications,
never seed bird counts (R8.2–8.3).

---

## Validation (Zod)

- **Step 1:** farmName trimmed non-empty; location trimmed non-empty; timezone
  non-empty.
- **Step 2:** ≥1 shed; each name trimmed non-empty; capacity a positive integer;
  no duplicate names after trim + case-fold.
- **Step 3 (placed):** code trimmed non-empty; placedCount positive integer; every
  selected shed allocation a positive integer; sum(allocations) === placedCount;
  no allocation > that shed's capacity; date ≤ today.
- **Step 3 (planned):** code trimmed non-empty; expected date today-or-later;
  allocations optional and never written as live birds.
- Final commit re-validates the whole draft before dispatching `onboarding-complete`.

---

## Testing strategy

Manual verification against the 11 acceptance tests (no automated test harness is
set up for the web app; `tsc -b`, `oxlint`, and `vite build` are the gates):
1. Owner completes farm + sheds, skips batch → dashboard empty state, no seed birds.
2. Planned batch → status `setup`, no live-bird counts, `activeBatchId` unchanged.
3. Confirmed batch across two sheds → status `active`, allocations persisted.
4. Capacity stored on `Shed.capacity`, separate from `placedBirds`/placed count.
5. Allocation sum ≠ placed and future date are rejected with accessible errors.
6. Refresh mid-wizard resumes at the saved step with draft intact.
7. Double-click Finish / re-enter → no duplicate sheds/batches (upsert by stable id + completed no-op).
8. Completed owner logging in again is not routed to onboarding.
9. Invited manager/worker does not create a farm and is not routed to onboarding.
10. New owner dashboard shows no demo workspace data.
11. Existing demo workspace records remain unchanged after migration-on-load.

## Limitations (explicit)

- Local prototype only: no backend security, no cloud persistence, no real sync —
  not implemented and not claimed.
- Role selection is UI state, not production authorization.
- "Final commit failure" is modeled as pre-commit validation failure; a localStorage
  write is effectively synchronous and not treated as a network operation.
- Persisted-state additions are backfilled on load within the `version: 1` guard;
  a corrupted/hand-edited blob falls back to the demo seed per existing behaviour.
- Converting a planned batch into a placed one later is handled by the existing
  Placement flow, not by onboarding.
