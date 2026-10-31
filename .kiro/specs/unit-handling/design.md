# Design Document — Unit Handling

## Overview

A general, reusable unit system so farmers can enter and view quantities in their
preferred unit (feed in **bags** or **kg**; bird weight in **g** or **kg**) while
the store keeps one **canonical unit per quantity kind**. Display/entry units are
a boundary concern; all deterministic math (feed stock, runway, FCR) keeps running
on canonical values untouched.

Key reality driving the design: **bag size is not fixed** (50/25/70/75 kg seen in
practice, and it changes between deliveries). Therefore bag size is stored **per
feed entry**, defaulted from a farm-wide setting captured at onboarding — never a
single global constant that would retroactively corrupt history.

Scope this pass: build the units foundation; apply it to **feed** end to end
(onboarding question → settings → entry form → display); make **bird weight**
expressible on the same foundation. Water/medicine/area are out of scope but must
fit the same module without rework. Local prototype only — no backend/sync.

## Grounding (verified in code)

- Feed records store canonical `kg` on `FeedMovement.kg`; `direction: 1|-1`.
- All feed math already uses `movement.kg`: `feedStockKg` (calc.ts:26),
  `recentDailyFeedKg`, `feedRunwayDays` (calc.ts:54), `estimatedFcr` (calc.ts:64).
  **None of these change** — units are added only at the edges.
- Bird weight stores canonical `WeightSample.totalGrams`.
- `FarmSettings` currently `{ farmName, location, notifications, timezone }`.
- Persistence: `loadState()` accepts `version: 1` and backfills missing fields;
  we keep version 1 and add additive backfill (same approach as onboarding).

## Units module (`src/domain/units.ts`) — new, pure

```ts
export type QuantityKind = "mass" | "weight" | "volume" | "count"

export interface UnitContext { bagSizeKg?: number } // for variable-factor units

// canonical: mass→kg, weight→gram, volume→litre, count→unit
export function toCanonical(value: number, unit: string, kind: QuantityKind, ctx?: UnitContext): number
export function fromCanonical(canonical: number, unit: string, kind: QuantityKind, ctx?: UnitContext): number
export function isValidUnit(unit: string, kind: QuantityKind): boolean
```

Fixed factors (no context): `mass`: kg=1, tonne=1000, quintal=100; `weight`:
gram=1, kg=1000, lb=453.592. Variable factor: `mass` unit `bags` requires
`ctx.bagSizeKg > 0`; `toCanonical(bags) = bags * bagSizeKg`,
`fromCanonical(kg, "bags") = kg / bagSizeKg`. Missing/non-positive bag size →
throw (caught by form validation). No rounding inside conversions; rounding is a
display concern (format helpers).

Display helpers (extend `domain/format.ts`): `formatFeed(kg, feedUnit, bagSizeKg)`
→ e.g. `"3.5 bags"` or `"175 kg"` (always includes the unit word; never a bare
number; `null` stays "Not recorded", never 0).

## Data model changes (additive, backfilled on load)

### FarmSettings
```ts
interface FarmSettings {
  farmName: string
  location: string
  notifications: boolean
  timezone: string
  feedUnit: "kg" | "bags"      // NEW, default "kg"
  defaultBagKg: number | null  // NEW, required when feedUnit==="bags", else null
}
```

### FeedMovement — add Entry_Context (canonical `kg` stays authoritative)
```ts
interface FeedMovement {
  // ...existing incl. kg (canonical)...
  enteredUnit?: "kg" | "bags"   // NEW — how the user typed it
  enteredValue?: number         // NEW — the number they typed (e.g. 10)
  bagSizeKg?: number            // NEW — bag size used for THIS record (bags only)
}
```
`kg` is computed once at save (`enteredValue * bagSizeKg` for bags) and never
recomputed when settings change. Entry context is for honest display + edit
round-trip only.

### Onboarding draft
Extend `OnboardingDraft.farm` with `feedUnit` and `defaultBagKg` (string in draft,
parsed at commit). The onboarding commit writes them into `FarmSettings`.

### Migration-on-load (inside the existing version===1 branch)
- `settings.feedUnit ??= "kg"`; `settings.defaultBagKg ??= null`.
- `createEmptyWorkspace`: `feedUnit: "kg"`, `defaultBagKg: null`.
- Existing feed records: leave as-is (canonical kg, no entry context → treated as
  kg with no original-unit metadata).

## Onboarding integration

Add the feed-unit question to Step 1 (Farm) — it's a farm identity/preference,
fits there without adding a step. UI:

```
How do you measure feed?
( ) Kilograms (kg)
( ) Bags
    Default bag size  [ 50 ] kg      // shown only when Bags selected
```
Validation: if `bags`, `defaultBagKg` must be a positive number. Draft persists
across refresh like the rest of the wizard. Review step shows "Feed unit: Bags
(50 kg)" or "Feed unit: Kilograms".

## Settings integration

In the Settings page (`more.tsx`), add a "Feed unit" control mirroring the
onboarding question (radio kg/bags + bag-size field) wired to `update-settings`.
Changing it never rewrites stored records (R1.5); it only changes defaults and
display.

## Feed entry form integration

The feed entry forms (`farm-work.tsx` FeedPage, and any feed row in daily-round)
get a reusable `FeedQuantityField`:
- A bags/kg toggle defaulting to `settings.feedUnit`.
- When `bags`: a quantity input + an editable Bag size field pre-filled from
  `settings.defaultBagKg`; shows a live "= N kg" helper.
- When `kg`: a single kg input.
- On save: compute canonical kg via `toCanonical`; store `kg` plus
  `enteredUnit/enteredValue/bagSizeKg` when bags.
- `h-12` controls, unit word beside the field (aria-hidden suffix + aria-label
  carries it), accessible errors, tokens only. Zod validates (positive numbers;
  positive bag size when bags).

No change to `calc.ts`/`metrics.ts` — they keep consuming `movement.kg`.

## Feed display integration

Where feed appears (Today stock/runway cards, feed tables, batch detail),
format via `formatFeed(kg, settings.feedUnit, settings.defaultBagKg)`:
- bags mode → "X bags" (converted with default bag size); if a record has its own
  `bagSizeKg`, its original "10 bags @ 50 kg" can be shown in detail views.
- A record shown in bags using the farm default (no per-record size) is marked as
  using the default size (R6.4).
- `null` feed stays "Not recorded".

## Bird weight

`units.ts` supports g↔kg as fixed factors; `WeightSample.totalGrams` stays
canonical. This pass wires the module and a `formatWeight(grams, unit)` helper;
switching the weight display unit in the UI can be enabled now or next pass, but
the foundation is in place (R7).

## Reducer / actions

No new actions strictly required: onboarding commit already writes settings;
`update-settings` already patches `FarmSettings`; feed entry uses the existing
`add-feed`. We only widen the payloads (settings gains feedUnit/defaultBagKg;
feed movement gains optional entry-context fields).

## Validation (Zod)

- Onboarding feed-unit: `feedUnit ∈ {kg,bags}`; if bags, `defaultBagKg` positive number.
- Settings: same.
- Feed entry: quantity ≥ 0 (per existing feed rules); if bags, bagSize positive.
- `toCanonical` throws on bags without positive bag size; forms prevent that state.

## Testing strategy

Static gates: `tsc -b`, `oxlint`, `vite build`. Manual acceptance:
1. Onboarding kg → no bag question; settings show kg.
2. Onboarding bags → bag size required; rejected if missing/non-positive.
3. Feed entry in bags @ 50 → stored kg = value×50; switching farm unit later does
   not change stored kg (stock/FCR unchanged).
4. Feed entry bag-size override (25) on one delivery stores correct kg.
5. Stock/runway display converts to bags with the unit word; null stays Not recorded.
6. Existing demo feed still loads and displays (kg, or bags-by-default with the
   default-size indication).
7. Bird weight still stored in grams; g↔kg conversion is exact.

## Limitations (explicit)

- Local prototype only — no backend, cloud, or sync; nothing labeled "Synced".
- Changing farm feed unit/default bag size affects only defaults and display, never
  stored canonical values or history.
- Records entered before this feature have no original-unit metadata; shown in bags
  they use the current default bag size, flagged as such.
- Water/medicine/area units are not implemented this pass (foundation supports them).
- Per-user unit preference is out of scope (farm-wide only, by decision).
