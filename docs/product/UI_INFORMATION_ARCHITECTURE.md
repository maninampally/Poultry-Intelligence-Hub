# UI information architecture — current vs target

> Plan only (Phase U). Aligns with `AGENTS.md`: flock situation in **5–10 seconds**,
> numbers with meaning, offline-first sync chips, status = icon + word
> (Normal / Watch / Act), plain language for Indian broiler farmers.

**Surfaces:** Mobile (primary field tool) · Web app (manager/demo today) · Marketing (separate).

---

## 1. External references (what works for farmers)

| Source | Takeaway for PIH |
|--------|------------------|
| [GSMA AgriTech UX Guidebook](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/wp-content/uploads/2025/10/AgriTech-UX-Design-Guidebook.pdf) | Few steps; stay logged in; offline capture + clear local vs synced state |
| [Gapsy — Agriculture app design](https://gapsystudio.com/blog/agriculture-app-design/) | Task-oriented flows (not dense dashboards); 48dp+ targets; one-hand lower third; high contrast for sun |
| [Farm MGT offline-first (Vetra)](https://vetrasystems.com/blog/offline-first-android-design/) | Never block UI on network; queue + sync indicator; photos lower priority |
| [RNF — what farmers adopt](https://www.rnftechnologies.com/blog/agriculture-app-development) | Ease beats cleverness; typing is the enemy; honest sync state |
| [KodiBook](https://kodibook.com/) (Indian poultry) | Morning log = deaths + feed; live FCR / cost/kg / profit; age-aware alerts; offline |
| [Fasal UX case study](https://medium.com/fasalapp/helping-horticulture-farmers-to-analyze-farm-data-and-take-better-decisions-a-ux-case-study-e69b2a35b72a) | Large type; side-by-side compare; explain what a metric means on tap |
| [JioKrishi / Outgrow case studies](https://gauravjha.framer.website/smartfarm) | Prioritized **recommendations** over raw sensor dumps; field-tested prototypes |
| FarmRise (Bayer) research | Landing must make benefit obvious in first screen or users bounce |

### Customer-satisfaction themes (synthesized)

1. **Tell me what to do today** — not “here are 12 KPIs.”  
2. **Two numbers to log in the morning** — deaths + feed (optional water/weight).  
3. **Meaning, not stats** — “Mortality 4.2% — 1.1 pts above target → Act.”  
4. **Trust sync** — Saved on phone / Waiting to send / Sent / Failed.  
5. **Sun + gloves** — large type, high contrast, big taps.  
6. **Local language later** — i18n now; voice input later.  
7. **Charts only when they answer a question** — trend vs target, not decoration.

---

## 2. Current design (as-built web)

### Navigation (too wide for field use)

| Group | Routes today |
|-------|----------------|
| Today | Dashboard, Daily round, Alerts, Tasks |
| Farm work | Mortality, Feed, Water, Weight, Health, Biosecurity, Maintenance |
| Batches | Active, Placement, Dispatch, Closeout, Compare |
| Business (owner) | Finance, Sales, Suppliers, Buyers, Plans, Reports |
| More | Farms, Team, SOPs, Export, Settings, Help |
| Marketing | Landing, Features, Pricing, etc. |

Mobile tabs: Today · Record · Batches · Tasks.

### What data shows where (today)

| Page | Data / UI | Issues vs farmer UX |
|------|-----------|---------------------|
| **Dashboard (`/dashboard`)** | Health score, round status, runway, mortality, feed/water bar trend, alerts, tasks, sync pending, some finance | Busy; decorative gradients; many cards compete; not “5–10s one flock answer” |
| **Daily round** | Feed, water, deaths, weight, notes | Closer to KodiBook morning log — keep, simplify |
| **Alerts / Tasks** | Severity lists | Split across two places; should surface on Home first |
| **Farm work pages** | Separate silos for mortality/feed/water… | High nav cost; workers won’t hunt 7 menus |
| **Batches** | Live, placed, coverage; detail with metrics/tabs | Useful for managers; naming “batch” vs product “flock” |
| **Business** | Finance cards, sales, suppliers… | Owner-only OK; demo localStorage — not API |
| **Charts** | Custom bar/growth SVG with gradients | Conflicts with AGENTS “no decorative gradients”; prefer simple meaning charts |
| **Mobile Expo** | Mostly component preview + SQLite save | Not a full farmer IA yet |
| **Maps** | None | No shed map / farm layout yet |

### Structural gaps

- Web is **demo localStorage**, not FastAPI-backed (by design for now).  
- Nav mirrors a full ERP, not a shed-floor morning routine.  
- Status sometimes color-heavy without consistent icon+word.  
- Hard-coded palette classes (`bg-sky-50`, etc.) vs design tokens.  
- No single “Act now” strip; alerts buried.  
- Charts without an explicit question (“vs breed standard?”, “7-day deaths?”).

---

## 3. Target IA — roles and jobs

| Role | Primary job | Device |
|------|-------------|--------|
| **Shed worker** | Log today’s deaths + feed in &lt;60s | Phone |
| **Farm manager** | See which flock needs Act; assign follow-up | Phone / tablet |
| **Owner** | Cost/kg, settlement, multi-farm glance | Phone / web |
| **Visitor (marketing)** | Understand value; request demo | Web |

**Home rule:** Opening the app answers: *Is this flock Normal, Watch, or Act — and what should I do next?*

---

## 4. Target pages, data, and components

### A. Field app (mobile-first) — proposed tabs

| Tab | Purpose | Data on screen | Primary components |
|-----|---------|----------------|--------------------|
| **1. Today** | 5–10s flock status | Active flock name, day #, birds live, status chip, **one** top alert + CTA, today’s round complete?, sync chip | `FlockStatusCard`, `AlertCard`, `SyncChip`, one primary button “Log morning round” |
| **2. Record** | Morning entry | Deaths, feed (bags/kg), optional water/weight; big steppers; save → local + queue | Large numeric steppers, presets, success toast with sync state |
| **3. Flock** | Performance story | Mortality %, FCR (explained once), weight vs standard, feed runway, 7-day mini trend | `MetricCard` ×3–4, **one** small trend chart (deaths or feed), link “Full history” |
| **4. More** | Secondary | Switch flock/farm, alerts list, tasks, settings, help | Simple list rows |

Owner-only under More or a 5th tab later: **Money** (cost/kg, expenses, settlement summary).

### B. Detail pages (push from Today/Flock — not top-level clutter)

| Page | When shown | Data |
|------|------------|------|
| **Alert detail** | Tap alert | What happened, why it matters, suggested action, link to record |
| **Mortality history** | From Flock | Daily deaths table + 14-day bar (actual only) |
| **Feed & stock** | From Flock / runway Act | Issued, stock estimate, runway days |
| **Weight** | From Flock | Samples vs breed curve (standard line + actual dots) |
| **Lifting / dispatch** | Near harvest | Birds lifted, weight, rate (manager) |
| **Settlement** | Closeout | Itemized paise lines from API `compute_settlement` |
| **Farm map / sheds** *(phase later)* | Multi-shed farms | Shed cards on simple schematic — **not** GIS unless GPS exists; color = Normal/Watch/Act |

### C. Manager web (slim, not ERP)

Keep marketing site separate. For app web:

| Page | Data | Charts |
|------|------|--------|
| **Home** | Same Today semantics as mobile (responsive) | At most one 7-day trend |
| **Round** | Same Record form | None |
| **Flocks** | List: status, day, live birds, completeness | None on list |
| **Flock detail** | Metrics + history tabs | Weight vs standard; mortality trend |
| **Money** (owner) | Cost/kg, expenses list, settlement | Optional cost breakdown — only if it answers “where did money go?” |
| **Team / settings** | Farms, sheds, members | None |

**Deprecate from primary nav (move to Settings or remove from demo):** Biosecurity, Maintenance, SOPs, Purchase plans, Buyers/Suppliers as top-level — or hide behind “Advanced.”

---

## 5. Visual system: cards · charts · text · maps

### Cards

| Pattern | Use | Content rules |
|---------|-----|---------------|
| **Status card** | Home hero | Flock name, day, birds, **Normal/Watch/Act** + icon |
| **Metric card** | Flock | Label, value, **vs expected** one line, status |
| **Alert card** | Home + Alerts | Severity word + icon, plain action |
| **Sync chip** | Everywhere records show | saved / pending / syncing / synced / failed |

Avoid: rainbow stat grids, glass, gradient fills as decoration.

### Charts (allowed set)

| Chart | Question it answers | Where |
|-------|---------------------|-------|
| 7–14 day **deaths** bars | “Is mortality rising?” | Flock |
| 7-day **feed issued** bars | “Are we overfeeding?” | Flock / Feed |
| **Weight vs breed standard** line | “Are birds on track?” | Weight |
| Avoid | Pie charts, 3D, sparkline spam, dual-axis clutter | — |

Every chart title = the question. Empty state = “No weight yet — log on Record.”

### Text

- Prefer: Deaths, Feed, Weight, Birds left, Day 18.  
- FCR: first use show one-line gloss (“Feed ÷ weight gain; lower is better”).  
- Money: ₹ with Indian grouping; never show paise integers to users.  
- All strings via i18n keys (AGENTS).

### Maps

| Phase | Approach |
|-------|----------|
| Now | **No geo map.** Shed list with status chips is enough. |
| Next | Static **shed layout** (boxes) colored by flock status — tap shed → flock Today. |
| Later | Optional GPS farm pin for multi-site owners — not for daily round. |

---

## 6. Current → target change map

| Area | Current | Target change |
|------|---------|---------------|
| Home | Many colored stats + finance + charts | One status + one alert + round CTA + sync |
| Nav | ~25 destinations | 4 tabs (+ Money for owner) |
| Farm work | 7 top-level pages | Nested under Flock detail |
| Daily round | Exists | Become the #1 habit; 2 required fields |
| Charts | Gradient bars on Home | One meaning chart on Flock only |
| Alerts | Separate + weak on Home | Top of Home always |
| Sync | Pending count on Home | Chip on every saved record |
| Tokens | Ad-hoc Tailwind colors | Design tokens only |
| Web vs API | localStorage demo | Keep demo label; mobile = API source of truth |
| Naming | Batch vs flock | Prefer **Flock** in UI (batch = internal synonym) |
| Maps | Absent | Shed status board before GIS |

---

## 7. Delivery plan (UI phases)

### U0 — Spec freeze (this doc)
- Agree Home / Record / Flock / More IA.  
- Mark web nav items Advanced vs Primary.  
- **Status:** Doc landed; decisions defaulted for U1 (web first, flock wording on Home/Record, Money deferred, shed board later).

### U1 — Home + Record redesign (highest ROI)
- Rebuild Today to status-first layout (web + mobile shell).  
- Simplify Daily Round: deaths + feed required; rest optional.  
- Wire sync chip states to queue (mobile already has queue).  
- **Status:** In progress on `feat/ui-u1-home-record` (web Today + Record).

### U2 — Flock performance page
- Metric cards with vs-expected.  
- Replace decorative Home charts; add allowed charts on Flock.  
- Align copy to Normal / Watch / Act.

### U3 — Trim nav + manager Money
- Collapse Farm work into Flock.  
- Owner Money page from settlement/expenses APIs.  
- Settings holds farms/team/advanced.

### U4 — Shed board + polish
- Simple shed map/cards.  
- Sunlight contrast pass; 56px primary actions.  
- Field test with 3–5 broiler farmers (task: log morning round; find flock status).

---

## 8. Success metrics (customer satisfaction)

| Metric | Target |
|--------|--------|
| Time to understand flock status on Home | ≤ 10 seconds |
| Time to complete morning round | ≤ 60 seconds |
| Task success (log deaths+feed offline) | ≥ 90% in moderated test |
| “I know if data is on the phone vs sent” | ≥ 80% correct in quiz |
| SUS or 5-point ease rating | ≥ 4 / 5 after U2 |

---

## 9. Decisions to confirm with you

1. **Primary surface for U1:** Mobile Expo first, or web demo first as visual prototype?  
2. **Rename Batch → Flock** in all user-facing strings now?  
3. **Owner Money tab** in v1 or defer until settlement API is wired to UI?  
4. **Shed board** in U2 or U4?

Once you pick those, implementation can start on a `feat/ui-u1-home-record` branch.
