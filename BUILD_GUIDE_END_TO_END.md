# Poultry Intelligence Hub: end-to-end build guide

How to build the whole product with an AI coding tool (Kiro, Cursor, Copilot, Claude Code). Each phase has a goal, a prompt to paste, acceptance checks, and the work only you can do. Do the phases in order. Never start a phase until the previous one passes its checks.

Files you already have: `AGENTS.md`, `tailwind.config.js`, `design/pih-design-tokens.json`, `settlement_model_draft.sql`, `FIRST_PROMPT.md`, `SECOND_PROMPT.md`.

---

## How to work with the AI tool (applies to every phase)

1. **Rules file first.** `AGENTS.md` is loaded by the tool in every session (see the file location for your tool).
2. **Plan, approve, build.** Every prompt starts with "show me a plan and wait." Read the plan. Reject it if it breaks a rule.
3. **One slice at a time.** One screen, one table group, or one service per task. Stop for review after each.
4. **Verify yourself.** Run the app on a real low-end Android phone. Run the tests. Do not trust "it works" from the tool.
5. **Commit after each approved step.** Small commits make rollback easy.
6. **Fix the rules, not the chat.** If the tool repeats a mistake, add one line to `AGENTS.md`.
7. **Never paste secrets** (API keys, service-role keys) into the chat. Use environment files that are git-ignored.
8. **Review anything involving money, auth, or security by hand,** or ask a second tool to review it.

Prompt template for any new task:

```
Read AGENTS.md. Task: <one sentence>.
Context: <files/tables that already exist>.
Requirements: <numbered list>.
Out of scope: <what not to touch>.
Show a plan and the file list first. Wait for my approval. Then implement and stop for review.
Done when: <checks>.
```

---

## Phase 0: decisions and accounts (you, no AI)

Decide and write down before coding:
1. **Who is the first user:** contract growers, independent farmers, or both. This drives Phase 6.
2. **Breed targets:** get the published performance guide for the strain your pilot farmers use (weight and feed by day). The app's alerts depend on it.
3. **Alert thresholds:** with a poultry vet or experienced farmer, define what counts as Normal, Watch, and Act for feed, weight, and deaths.
4. **Settlement formulas:** collect 2-3 real contracts and settlement statements from growers. Use them to confirm how FCR and incentives are calculated.
5. **Login method:** phone number with one-time code is the usual choice for Indian farmers. Check SMS delivery and any registration requirements for sending SMS in India before committing.
6. **Business model:** farmer pays, integrator pays, or both (affects who owns the data and who sees what).
7. **Legal:** India's Digital Personal Data Protection Act applies to personal data you collect. Get a lawyer to review consent, retention, and data ownership before launch.

Accounts to create: GitHub, Expo (EAS), Supabase (check the region options; choose one close to India if available), Sentry, Google Play developer account, an SMS/OTP provider, an LLM provider for later.

You are done when the decisions above are written in a `DECISIONS.md` file.

---

## Phase 1: foundation and base components

**Goal:** a running Expo app with the theme, i18n, and four base components.
**Prompt:** use `FIRST_PROMPT.md` as is.
**Done when:** the preview screen shows MetricCard, AlertCard, StatusChip, SyncChip in every state on a real Android phone; no hex colors or raw strings in component files.
**You do:** compare the screens with your Figma design and fix the tokens, not the code, if they differ.

---

## Phase 2: offline core (Home and Daily Record)

**Goal:** a farmer can log a day with no internet and see the Home screen update.
**Prompt:** use `SECOND_PROMPT.md` as is.
**Done when:** airplane-mode test passes; same-day save updates instead of duplicating; metric tests pass.
**You do:** supply real target values to replace the placeholders; tune thresholds from Phase 0.

---

## Phase 3: backend, auth, and security

**Goal:** a cloud database with strict per-farm access, and login.

**Prompt:**
```
Read AGENTS.md and settlement_model_draft.sql. Task: set up the Supabase backend.
Requirements:
1. SQL migrations (in /supabase/migrations) for: farms, farm_members (role: owner/manager/worker), sheds, flocks, daily_records, medicine_records, vaccination_records, weight_records, expenses, counterparties, flock_agreements, agreement_rules, chick_placements, feed_receipts, feed_returns, lifting_events, settlements, settlement_lines, notifications, sync_log, and an audit log.
2. Every table has farm_id (directly or via flock) and created_at/updated_at. Use uuid primary keys that the app can generate offline.
3. Row Level Security on every table: a user can only read or write rows of farms they belong to; workers cannot see finance or settlement tables. Write RLS tests that try to break this.
4. Soft delete (deleted_at) instead of hard delete for farm data.
5. Storage buckets for photos with the same farm-level access rules.
6. Phone-number login in the app with a farm onboarding flow (create farm, add shed, add first flock).
Out of scope: sync engine, analytics.
Show a plan first. Wait for approval.
Done when: RLS tests prove a user from farm A cannot read farm B in any table.
```
**You do:** run the RLS tests yourself with two test accounts. Never expose the service-role key in the app.

---

## Phase 4: sync engine

**Goal:** offline data reaches the cloud reliably and conflicts are handled.

**Prompt:**
```
Read AGENTS.md. Task: build sync between local SQLite and Supabase.
Requirements:
1. Push: process sync_queue in order with retries and backoff; mark rows synced/failed; keep last_error.
2. Pull: fetch changes since the last sync timestamp per table; apply locally.
3. Conflict rule: last-write-wins per record using updated_at from the server, except daily_records where the same flock+date from two devices is merged field by field and flagged for review.
4. Idempotent: pushing the same queue item twice must not duplicate data.
5. Photos upload separately, resumable, only on request or Wi-Fi if a setting says so.
6. Sync status screen: pending count, last sync time, failed items with a retry button.
7. Triggers: app open, network regained, manual pull-to-refresh.
Out of scope: realtime subscriptions.
Show a plan first. Wait for approval.
Done when: tests cover offline create, edit on two devices, retry after failure, and duplicate push.
```
**You do:** test on a real phone with weak signal and airplane mode toggling. Try two devices on one farm.

---

## Phase 5: flocks and record modules

**Goal:** the full daily workflow beyond the first record.

**Prompt:**
```
Read AGENTS.md. Task: build flock lifecycle and record screens.
Requirements:
1. Flock lifecycle: Planned > Placed > Growing > Ready for Lifting > Partially Lifted > Final Lifting > Settlement > Completed > Archived. Enforce allowed transitions in one function with tests.
2. Flocks tab: list active flocks; create a flock (shed, date, birds placed, chick source).
3. Screens: Feed and Water, Weight tracking (sample weighing: enter several bird weights, compute the average), Health and Mortality (deaths with optional cause and photo), Medicine and Vaccination (given and upcoming schedule with reminders), Expense (category, amount, optional photo).
4. Quick actions on Home adapt to the flock stage.
5. Each screen works offline and shows sync state.
Out of scope: lifting, finance, analytics.
Show a plan first. Wait for approval.
Done when: a farmer can run a full growing cycle offline, and lifecycle tests pass.
```
**You do:** watch 3-5 real farmers use it for a day record and note where they hesitate.

---

## Phase 6: lifting and settlement

**Goal:** the part that earns farmer trust: record lifting, check the settlement.

**Prompt:**
```
Read AGENTS.md and settlement_model_draft.sql. Task: build lifting and settlement.
Requirements:
1. Chick placement and feed receipt screens that capture the integrator's billed figure, the farmer's own count or weight, and a slip photo. Highlight mismatches.
2. Lifting readiness screen: age, average weight, expected window.
3. Lifting event screen: date, counterparty, vehicle number, birds, average weight, total live weight, who weighed, slip photo, shrinkage. Support multiple events per flock; the last one is the final lifting.
4. Settlement calculator in lib/settlement/ as pure, tested functions:
   - independent: birds x weight x rate, minus adjustments
   - contract: base growing charge adjusted by the rules in agreement_rules (FCR and mortality bonuses or penalties)
   - FCR formula selectable per agreement
5. Settlement screen: the calculated result beside the amount the integrator paid (entered or photographed from the statement), the variance, and a status. A variance above a configurable amount raises an alert.
6. Every calculation shows its working step by step so the farmer can check it.
Use only the formulas confirmed in DECISIONS.md. Do not invent incentive rules.
Show a plan first. Wait for approval.
Done when: unit tests reproduce the real settlement statements you collected, to the rupee.
```
**You do:** this is the highest-risk phase. Have a real grower check three past batches against the app's numbers.

---

## Phase 7: analytics service, alerts, notifications

**Goal:** the intelligence layer, all deterministic.

**Prompt:**
```
Read AGENTS.md. Task: build the analytics service (FastAPI, Python, Pandas) and alerts.
Requirements:
1. Endpoints for flock metrics: FCR, livability, average weight vs target, feed vs expected, mortality trend with an abnormal-spike detector, projected lifting window.
2. Alert rules engine: each rule is a function with a threshold from config, a reason string, and suggested actions. Rules: feed deviation, weight below curve, mortality spike, heat risk (from weather forecast if configured), lifting window approaching, settlement variance.
3. Scheduled job (Redis worker) that evaluates alerts after sync and writes notifications.
4. Push notifications via Expo Notifications; an in-app notifications screen with read state.
5. Auth: verify the Supabase JWT; every query is farm-scoped.
6. Tests with fixture flocks for every rule, including edge cases (day 1, no data, missing days).
Out of scope: LLM features.
Show a plan first. Wait for approval.
Done when: each alert rule has passing tests and the app shows alerts with a reason and action.
```
**You do:** review each alert's wording with a vet; wrong or noisy alerts destroy trust fast.

---

## Phase 8: finance, comparison, history

**Goal:** profit clarity and old batches without clutter.

**Prompt:**
```
Read AGENTS.md. Task: build Finance, Batch Comparison, and Historical Batches.
Requirements:
1. Finance dashboard per flock: revenue, feed/chick/medicine/labor/other cost, net settlement, profit, cost per bird, cost per kg live weight, profit per bird.
2. Batch comparison: current vs previous and vs average of the last N batches for FCR, mortality, weight, cost per bird, profit per bird.
3. Completing a flock writes a batch summary row; comparisons read summaries, not raw records.
4. Historical Batches (archive): list, batch detail, all original records retained and viewable.
5. Money in paise, shown in Indian grouping.
Show a plan first. Wait for approval.
Done when: totals match a hand calculation for a real past batch.
```

---

## Phase 9: AI assistant

**Goal:** an assistant that answers from the farm's own data and never makes up numbers.

**Prompt:**
```
Read AGENTS.md. Task: build the AI farm assistant.
Requirements:
1. LangGraph agent behind a provider abstraction (swap LLMs by config).
2. Tools the agent can call (read-only, farm-scoped): get_flock_metrics, compare_batches, get_alerts, get_settlement, search_notes (pgvector over the farmer's notes and records).
3. The agent never calculates; it calls tools and explains. Every answer separates: recorded facts, calculated metrics, observations, recommendations.
4. No medical dosing or treatment advice; for disease signs it advises contacting the vet or integrator's field officer.
5. Suggested questions on screen ("How is my flock doing?", "Compare with my last batches", "Is my flock ready for lifting?").
6. Logging of questions and answers for review; a feedback thumbs up/down.
7. Evaluation set of 30+ questions with expected tool calls, run in CI.
Show a plan first. Wait for approval.
Done when: the evaluation set passes and no answer contains a number that did not come from a tool.
```
**You do:** have a poultry vet read 50 real answers before any farmer sees this.

---

## Phase 10: reports, settings, team

**Prompt:**
```
Read AGENTS.md. Task: build Reports, Farm settings, Shed management, Users, Notifications settings.
Requirements: batch report as PDF and shareable image (for WhatsApp); farm and shed CRUD; invite workers by phone with roles from farm_members; notification preferences; account and data export.
Show a plan first. Wait for approval.
Done when: a worker account cannot see Finance or Settlement.
```

---

## Phase 11: hardening and release readiness

**Prompt:**
```
Read AGENTS.md. Task: production hardening.
Requirements:
1. Tests: unit (calculations), integration (sync, RLS), end-to-end (Maestro or Detox) for the main flows.
2. Sentry for the app and backend, with PII scrubbing.
3. CI with GitHub Actions: lint, type-check, tests on every pull request; EAS builds for staging and production.
4. Three environments (local, staging, production) with separate Supabase projects and secrets.
5. Performance budget on a low-end Android: cold start, scrolling, and memory; reduce app size and image sizes; low-data mode.
6. Security review: dependency audit, no secrets in the repo, rate limits, input validation on the API.
7. Privacy: consent screen, data export and deletion, privacy policy text for lawyer review.
8. Backups and a restore test.
Show a plan first. Wait for approval.
Done when: CI is green, the restore test succeeds, and the app runs smoothly on your slowest test phone.
```

---

## Phase 12: pilot and release

1. Run a pilot with 5-10 farms (mix of contract and independent) for one full batch, about 6 weeks.
2. Visit them at the start. Watch them use it. Fix the top 5 friction points weekly.
3. At the end of the batch, compare the app's settlement numbers with what they were actually paid.
4. Track: daily records logged, share of days completed, sync failures, crashes, questions farmers ask.
5. Release to Google Play in a closed test first, then widen.
6. Support: a WhatsApp number or phone line for farmers; plan for it.

---

## Phase 13: later

- WhatsApp and voice entry for daily records.
- Local languages (the i18n layer from Phase 1 makes this a translation task).
- IoT: temperature, humidity, water meter, smart scales; show "Environment: Normal" with drill-down.
- Integrator dashboards, if that is your business model.
- Camera-based monitoring.

---

## Master checklist

- [ ] Phase 0 decisions written
- [ ] Phase 1 foundation and components
- [ ] Phase 2 offline Home and Daily Record
- [ ] Phase 3 backend, RLS, login
- [ ] Phase 4 sync
- [ ] Phase 5 flocks and records
- [ ] Phase 6 lifting and settlement validated on real batches
- [ ] Phase 7 analytics and alerts
- [ ] Phase 8 finance, comparison, history
- [ ] Phase 9 AI assistant evaluated by a vet
- [ ] Phase 10 reports, settings, team
- [ ] Phase 11 hardening
- [ ] Phase 12 pilot and release

## Top risks

1. **Wrong settlement numbers.** Validate against real statements before showing any farmer.
2. **Noisy or wrong alerts.** Vet review of every rule.
3. **Sync bugs losing data.** Test offline and two devices heavily.
4. **AI inventing numbers.** Tools only, evaluation set, vet review.
5. **Farmers not logging.** Keep the daily record under a minute; watch real usage in the pilot.
6. **Integrator resistance.** Decide the business model early.
7. **Privacy and legal exposure.** Lawyer review before launch.
