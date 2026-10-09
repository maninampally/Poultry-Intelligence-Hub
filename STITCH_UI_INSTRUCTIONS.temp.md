# Google Stitch — UI Generation Instructions
## Poultry Intelligence (Murgi Mitra) — Mobile App

> **Temporary working file.** Paste these prompts into Google Stitch (https://stitch.withgoogle.com) to generate the mobile UI. Start with the **Global Design System** block (Section 1), then generate each screen (Section 3) one at a time. Every screen prompt is self-contained — it repeats the critical style rules so Stitch stays consistent even across separate generations.

---

## 0. How to use this file

1. In Stitch, choose **Mobile** mode.
2. First message: paste **Section 1 (Global Design System)** verbatim. This primes the look and feel.
3. Then, for each screen, paste the matching prompt from **Section 3**. Generate one screen per prompt.
4. If a screen drifts off-style, re-paste the "Style reminder" line at the top of Section 2 before regenerating.
5. Keep the device frame at a standard Android phone size (e.g. 360–412 dp wide). This is a **phone-first** app for mid-range Android devices.

**Tool note:** Stitch generates one screen per prompt and does not maintain long cross-screen memory reliably. That is why each screen prompt below restates the palette, type scale, and layout rules.

---

## 1. Global Design System (paste first)

```
Design a mobile app design system for "Poultry Intelligence", a decision-support app for Indian broiler poultry farmers. It must look like a real, calm, practical production app — NOT an AI-generated concept, NOT a generic farm ERP, NOT a digital notebook.

Platform: Android-first mobile phone, portrait. Clean, high-contrast, data-dense but uncluttered.

COLOR PALETTE (use these exact values):
- Brand green (primary): #2E7D52 ; dark #256541 ; light #4FA172 ; soft tint #E7F4EC
- App background (cream): #FAF8F3
- Card surface: #FFFFFF
- Border / hairline: #E8E6E0
- Text primary (ink): #1F2723
- Text muted: #6B746E
- Text faint: #9AA19C
- Status NORMAL / OK: text #256541 on background #E7F4EC
- Status WATCH / WARNING (amber): text #B06A17 on background #FDF3E6
- Status ACT / CRITICAL (red/terracotta): text #B23333 on background #FBEAEA
- Info (blue): text #2B5FA1 on background #E9F0FB

TYPOGRAPHY: clean sans-serif (Inter or system) with clear numerals.
- Display (big metric numbers): 28px / bold
- Title: 20px / semibold
- Body: 16px / regular
- Label: 14px / medium
- Caption: 12px / regular

SHAPE & SPACING:
- Card radius 16px, control radius 10px, pills fully rounded.
- Base spacing scale: 4, 8, 12, 16, 24, 32.
- Cards are white on a cream background, with a 1px #E8E6E0 border and very soft (or no) shadow. No heavy drop shadows.
- Minimum touch target 48px; primary buttons 56px tall.

ICONS: simple line icons (Ionicons style — outline). No illustrations, no 3D, no mascots.

STATUS RULE (critical): status is NEVER color alone. Always pair a status color with BOTH an icon AND a word (Normal / Watch / Act). Example chip: a small colored dot + "Normal" text.

HARD "DO NOT" LIST:
- No gradients, no glassmorphism, no blur panels.
- No fake-futuristic AI visuals, no glowing orbs, no neon.
- No decorative charts — a chart only appears when it answers a real farming question.
- No oversized hero illustrations.
- No purple/indigo "tech startup" palette. Stay in green + cream + earthy accents.

CURRENCY & NUMBERS: Indian formatting. Money shown as ₹ with Indian digit grouping (e.g. ₹1,23,456 and ₹4,25,000; large sums as ₹2.10L). Weights in kg, feed in kg, water in L.

TONE: the farmer should understand their flock's situation within 5–10 seconds. Numbers must carry meaning ("4.2% above expected"), not raw stats.

Produce: a reusable component sheet showing — top app bar, bottom tab bar (5 tabs), primary/secondary buttons, status chips (Normal/Watch/Act), a MetricCard (icon + label + big value + context line + status chip), an AlertBanner (amber), a progress bar, a line chart card, and a bar chart card.
```

---

## 2. Shared layout rules (reference)

**Style reminder (paste at top of any screen if it drifts):**
> Poultry Intelligence style: cream #FAF8F3 background, white cards with #E8E6E0 border and 16px radius, brand green #2E7D52, Inter-style font. Status = color + icon + word. No gradients, no glassmorphism, no decorative charts. Android phone, portrait.

**Bottom tab bar (same on all 5 main screens):** white bar, top hairline border, 5 tabs with outline icons and 11px labels, active tab tinted brand green #2E7D52, inactive #9AA19C:
1. **Home** (home icon)
2. **Flock** (egg icon)
3. **Records** (clipboard icon)
4. **Reports** (bar-chart icon)
5. **More** (ellipsis icon)

**Top app bar (content screens):** small brand logo or back chevron on the left; screen title; a notification bell (with a small red dot when unread) and a circular profile avatar with brand-green tint on the right.

**Sync status chip (reusable):** small pill shown on records/forms. States and colors:
- "Saved on device" — neutral grey
- "Sync pending" — amber (Watch)
- "Syncing…" — info blue
- "Synced" — green (Normal)
- "Sync failed" — red (Act), tappable to retry

**Sample data to use across screens (keep consistent):**
- Farm: **Sri Venkateshwara Poultry Farm**, Tamil Nadu, India. Owner: **Ravi Kumar** (Owner). 2 sheds, 10,000 capacity.
- Active flock: **Flock 01** · Broilers · Day 24 of ~30 · 4,820 of 5,000 birds · Avg weight 2.18 kg · FCR 1.62 · Livability 96.4% · Mortality 180 (3.6%) · Cost/bird ₹17.51 · Feed today 1,240 kg · Water today 3,420 L.
- Today's record: Feed 1,240 kg (expected 1,180) · Water 3,420 L (expected 3,350) · Mortality 12 (normal range 10–15) · Avg weight 2.18 kg (target 2.10).
- Finance (current vs previous): Revenue ₹4,25,000 vs ₹4,02,000 · Feed cost ₹2,10,000 vs ₹2,04,000 · Profit ₹82,400 vs ₹76,200 · Profit/bird ₹17.10 vs ₹16.52 · FCR 1.62 vs 1.67.
- Historical: Flock 07 (FCR 1.62, profit ₹82,400), Flock 06 (FCR 1.67, ₹76,200), Flock 05 (FCR 1.71, ₹68,900).

---

## 3. Screen-by-screen prompts

> Order mirrors the app's real navigation + the product direction doc. Generate top to bottom.

### 3.1 Login
```
Design a mobile LOGIN screen for "Poultry Intelligence", an Indian broiler-farm app. Cream #FAF8F3 background, white card, brand green #2E7D52, Inter-style font, Android phone portrait.
Content: centered brand logo (a simple green mark + "Poultry Intelligence" wordmark), a short tagline "Turn your farm data into clear decisions." Below: a phone-number input (country prefix +91) OR email/password, label-above-field style, 10px radius inputs, 48px tall. A full-width primary button "Continue" in brand green, 56px tall, white text. A secondary text link "Use demo mode (no account)". Small "Works offline" note with a cloud-off icon at the bottom.
No gradients, no glassmorphism, no illustrations. Large touch targets, minimal typing.
```

### 3.2 Farm selection
```
Design a mobile FARM SELECTION screen for Poultry Intelligence. Cream background, white cards with #E8E6E0 border and 16px radius, brand green #2E7D52.
Top bar: title "Select Farm". A list of farm cards; each card shows farm name (e.g. "Sri Venkateshwara Poultry Farm"), location "Tamil Nadu, India", a small meta row "2 sheds · 10,000 birds capacity", and a chevron. The user's current farm card has a thin brand-green left border and a small green "Active" chip. At the bottom a secondary outline button "+ Add new farm".
Status chips use color + word. No gradients. Android phone portrait.
```

### 3.3 Intelligence Home (TAB 1 — the hero screen)
```
Design the HOME / INTELLIGENCE DASHBOARD screen for Poultry Intelligence (Indian broiler-farm app). This is the most important screen: a farmer must understand their flock in 5–10 seconds.
Style: cream #FAF8F3 background, white cards (#E8E6E0 border, 16px radius), brand green #2E7D52, Inter-style font, Android phone portrait. Status = color + icon + word. No gradients, no glassmorphism, no decorative charts.

Top app bar: small brand logo left; notification bell with a small red dot and a circular green-tinted profile avatar right.
Greeting block: "Good morning, Ravi" + muted subtitle "Here's how your farm is doing today."

ACTIVE FLOCK CARD (prominent): a round egg icon in a soft-green circle, "Flock 01", meta "Day 24 · 4,820 birds", a green "Healthy" status chip (dot + word), chevron. Below, a thin progress bar at 80% with right-aligned caption "80% completed".

"Today" section: a 2x2 grid of MetricCards. Each card = small icon, label, big value, and a status chip or context line:
- Feed — 1,240 kg — green chip "Normal"
- Water — 3,420 L — green chip "Normal"
- Birds dead — 12 — context "0.25%"
- Cost / bird — ₹17.51 — context "Avg. weight 2.18 kg"

NEEDS ATTENTION banner (amber #FDF3E6 bg, #B06A17 text): warning icon + title "Needs Attention" + message "Feed consumption is 8% higher than yesterday (1,240 kg vs 1,150 kg)." with small text actions "View trend" and "Ask AI".

QUICK ACTIONS row: 4 square tiles (white, border, brand-green outline icons + 11px labels): "Daily Record", "Mortality", "Feed", "Medicine".

Bottom tab bar: Home (active, green), Flock, Records, Reports, More.
```

### 3.4 Active Flock detail (TAB 2 / flock/[id])
```
Design the ACTIVE FLOCK DETAIL screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Status = color + icon + word; no decorative charts.
Top bar: back chevron + title "Flock 01" + a green "Growing" lifecycle chip.
Header card: breed "Broilers", "Day 24 of 30", placed date, expected market date; progress bar 80%.
KEY METRICS grid (2 columns) with context lines:
- Avg weight 2.18 kg — "+3.1% vs target" (green)
- FCR 1.62 — "Better than last batch 1.67" (green)
- Livability 96.4% — "Normal" (green)
- Mortality 180 (3.6%) — "Within range" (green)
A horizontal segmented control: "Overview | Weight | FCR | Mortality | Feed".
Below the control, a single meaningful LINE CHART card titled "Weight vs Target" showing actual vs target curves (actual slightly above target), x-axis Day 1/7/14/21/24, with a caption "On track — currently +3.1% above target".
A "Lifecycle" row of small stage pills: Planned → Placed → Growing(active) → Ready → Lifted → Settlement.
Bottom tab bar with Flock active.
```

### 3.5 Daily Record (form)
```
Design the DAILY RECORD entry screen for Poultry Intelligence (offline-first farm app). Cream background, white cards, brand green #2E7D52, Android phone portrait. Big touch targets, minimal typing.
Top bar: back chevron + title "Daily Record" + date pill "Today, 26 Sep". A small sync chip "Saved on device" (neutral grey).
Form sections as cards, each with a large labeled numeric input and a hint showing the expected value:
- Feed given (kg): input 1,240 — hint "Expected ~1,180 kg"
- Water (L): input 3,420 — hint "Expected ~3,350 L"
- Mortality (birds): input 12 — hint "Normal range 10–15"
- Average weight (kg): input 2.18 — hint "Target 2.10 kg"
- Notes (optional multiline) + a "Add photo" button with a camera icon.
Use large steppers (– / +) next to numeric inputs for low-typing entry.
Sticky bottom: full-width primary button "Save record" (brand green, 56px). A caption under it: "Saved on your device first, then synced when online."
No gradients. Labels wrap, never truncate.
```

### 3.6 Feed & Water
```
Design the FEED & WATER screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Charts only when meaningful.
Top bar: back + title "Feed & Water".
Two summary MetricCards at top: "Feed today 1,240 kg — 4.2% above expected" (amber Watch chip) and "Water today 3,420 L — Normal" (green chip).
BAR CHART card "Feed consumption (last 7 days)": bars for Sep 20–26 rising 980→1,240 kg, with a faint target line; caption "Rising with bird age — expected".
BAR CHART card "Water consumption (last 7 days)": 2,800→3,420 L.
A small "Feed stock runway" card: "Approx. 3 days of feed left" with amber chip "Watch" and a text action "Record feed purchase".
Bottom tab bar.
```

### 3.7 Weight Tracking
```
Design the WEIGHT TRACKING screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Weight".
Header MetricCard: "Average weight 2.18 kg" big, context "+3.1% vs target (2.10 kg)" in green, and "Daily gain 1.05 kg/day".
LINE CHART card "Weight vs Target": two lines (actual above target), x-axis Day 1/7/14/21/24, legend swatches "Actual" (brand green solid) and "Target" (grey dashed). Caption "Birds are growing slightly ahead of the target curve."
A "Record new weight sample" primary button (brand green). Below, a small list of recent samples with date + value + sync chip.
No decorative charts, no gradients.
```

### 3.8 Health & Mortality
```
Design the HEALTH & MORTALITY screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Status = color + icon + word.
Top bar: back + title "Health & Mortality".
Top: a status card "Flock health: Healthy" with green chip, plus "Cumulative mortality 180 birds (3.6%) — within normal range".
BAR CHART card "Daily mortality (last 7 days)" with a shaded normal-range band (10–15); today = 12 (inside band). Caption "No abnormal spike detected."
"Record mortality" primary button (uses the red/Act accent for the icon only, button stays brand green).
A recent entries list: date, count, cause (optional), sync chip. Append-only note: a tiny caption "Entries are kept as history; corrections add a new entry."
```

### 3.9 Medicine
```
Design the MEDICINE screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Medicine".
"Ongoing courses" section — cards each with medicine name, date range, and a progress bar for the course:
- Amoxicillin — Sep 20 to Sep 27 — "Day 6 of 7" progress ~85% — green "Ongoing" chip
- Vitamin C — Sep 15 to Sep 22 — "Day 3 of 7" progress ~43% — green "Ongoing" chip
"Upcoming vaccinations" section — list rows:
- Newcastle Disease — Oct 5, 2025 — amber "Upcoming" chip
- Gumboro — Oct 12, 2025 — amber "Upcoming" chip
Primary button "+ Add medicine / vaccination". No gradients.
```

### 3.10 Environment (IoT-ready)
```
Design the ENVIRONMENT screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Convert sensor data into useful STATES, not raw streams.
Top bar: back + title "Environment".
Hero status card: "Environment: Normal" with green chip and subtitle "All readings within configured range."
A 2x2 grid of drill-down cards (each a state + a small current value): Temperature "Normal · 31°C", Humidity "Normal · 65%", Air quality "Normal", Ventilation "On". If one needs attention, show it in amber with "Watch" and a reason line, e.g. Temperature "Watch · above range 45 min".
A small "No sensors connected? This updates when IoT devices are added." empty-state hint with a device icon.
No neon, no futuristic visuals — calm and practical.
```

### 3.11 Lifting Readiness
```
Design the LIFTING READINESS screen for Poultry Intelligence (Indian broiler farm — "lifting" = birds collected for sale). Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Lifting Readiness".
Hero card: "Flock 01 — approaching lifting window" with amber chip "Watch", subtitle "Estimated lifting in 4–6 days", current avg weight 2.18 kg vs typical market weight 2.2–2.4 kg, a progress bar toward target weight.
A readiness checklist card: Avg weight on target (green check), FCR healthy (green check), Mortality normal (green check), Buyer confirmed (amber pending).
Primary button "Schedule lifting" (brand green). Secondary "Ask AI: is this flock ready?".
```

### 3.12 Lifting Event (form)
```
Design the LIFTING EVENT entry screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Supports multiple partial lifting events per flock.
Top bar: back + title "Record Lifting" + sync chip "Saved on device".
Form cards:
- Lifting date (date picker, "Day 40")
- Buyer / integrator (text)
- Vehicle number (text)
- Birds lifted (numeric, large steppers) e.g. 2,000
- Average weight (kg) e.g. 2.20
- Total live weight (auto-calculated, read-only) e.g. 4,400 kg
- Rate per kg (₹) e.g. ₹118
- Gross amount (auto-calculated, read-only) e.g. ₹5,19,200
Caption under auto fields: "Calculated automatically." Sticky bottom primary button "Save lifting event".
Indian number formatting. Labels wrap.
```

### 3.13 Final Lifting / Lifting history
```
Design the FINAL LIFTING / LIFTING HISTORY screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Lifting — Flock 07".
A timeline list of lifting events (most recent first), each a card:
- Day 42 — 1,020 birds — 2.18 kg avg — ₹... — "Final lifting" red/terracotta chip
- Day 41 — 1,800 birds — 2.16 kg avg — partial
- Day 40 — 2,000 birds — 2.14 kg avg — partial
A summary card at top: "Total lifted 4,820 birds · Total live weight 10,480 kg · Gross ₹...". A primary button "Proceed to settlement".
Status chips use color + word. No gradients.
```

### 3.14 Settlement
```
Design the SETTLEMENT screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Deterministic numbers, Indian currency formatting.
Top bar: back + title "Settlement — Flock 07".
A breakdown card (right-aligned amounts): Gross amount ₹..., Adjustments −₹..., Net settlement ₹... (emphasized). A payment status chip: "Paid" green / "Partially paid" amber / "Pending" red.
A second card "Profit for this batch": Revenue ₹4,25,000, Total cost ₹2,60,000, Profit ₹82,400 (big, green), Profit/bird ₹17.10.
Primary button "Mark as settled & complete batch". Caption "Completing moves this flock to Historical Batches (data is kept)."
```

### 3.15 Finance Dashboard
```
Design the FINANCE DASHBOARD screen for Poultry Intelligence — financial intelligence, not an accounting ledger. Cream background, white cards, brand green #2E7D52, Android phone portrait. Indian currency formatting (₹1,23,456).
Top bar: back + title "Finance".
Hero card: "Current batch profit ₹82,400" big in green, context "+8.1% vs previous batch", with "Profit / bird ₹17.10".
COST BREAKDOWN card: a simple horizontal bar or stacked bar for Feed ₹2,10,000, Medicine ₹18,000, Other ₹32,000 — plus a legend. Caption "Feed is 78% of total cost."
A 2-column mini metric row: "Cost / bird ₹17.51", "Cost / kg live weight ₹...".
A link row "Compare with previous batches →" to Batch Comparison.
No decorative charts; the breakdown must answer "where is the money going?".
```

### 3.16 Batch Comparison
```
Design the BATCH COMPARISON screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Batch Comparison".
A segmented control to pick batches: "Current (Flock 07)" vs "Previous (Flock 06)".
A comparison TABLE card with 3 columns (Metric | Current | Previous), right-aligned numbers, rows:
Birds sold 4,820 / 4,610 · Avg weight 2.18 kg / 2.13 kg · FCR 1.62 / 1.67 · Feed cost ₹2.10L / ₹2.04L · Revenue ₹4,25,000 / ₹4,02,000 · Profit ₹82,400 / ₹76,200 (highlighted green row) · Profit/bird ₹17.10 / ₹16.52.
Small up/down indicators (▲ green / ▼ red) next to each current value showing better/worse. Caption "This batch is more feed-efficient than the last."
Table text wraps; no truncation. No gradients.
```

### 3.17 Historical Batches (archive list)
```
Design the HISTORICAL BATCHES screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Historical Batches" + a search icon.
A list of completed-flock cards, each: flock name, date range, a grey "Completed" chip, and a compact stats row "FCR 1.62 · 4,820 birds · Profit ₹82,400":
- Flock 07 — Oct 15 – Nov 26, 2025 — FCR 1.62 — ₹82,400
- Flock 06 — Sep 10 – Oct 21, 2025 — FCR 1.67 — ₹76,200
- Flock 05 — Jul 02 – Aug 11, 2025 — FCR 1.71 — ₹68,900
Caption at top: "Archived batches keep all their records." Tapping a card opens Batch Detail. No gradients.
```

### 3.18 Batch Detail (historical)
```
Design the BATCH DETAIL screen (a completed/archived flock) for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Flock 06" + grey "Completed · Archived" chip.
Summary card: date range, duration "41 days", birds placed/sold, final avg weight, FCR 1.67, livability, profit ₹76,200.
Tabs/segmented control: "Summary | Records | Finance | Lifting".
Under Summary: a 2x2 metric grid (FCR, Mortality %, Avg weight, Cost/bird) and one small LINE CHART "Weight vs Target" for that batch.
A note "Full daily records retained — open Records tab to view history." No gradients.
```

### 3.19 Insights (TAB 4 content / Reports)
```
Design the INSIGHTS / REPORTS screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Only meaningful charts.
Top bar: title "Insights".
A stack of question-led chart cards, each titled with the farming question it answers:
1. "Are the birds growing as expected?" — LINE CHART Weight vs Target (actual slightly above target).
2. "Is feed efficiency improving?" — LINE CHART FCR trend 1.82→1.62 over W1–Now with a target line.
3. "Did mortality change unexpectedly?" — BAR CHART daily mortality with normal-range band.
4. "Where is the money going?" — bar breakdown Feed/Medicine/Other.
Each card has a one-line plain-language takeaway caption in muted text. Bottom tab bar with Reports active.
```

### 3.20 AI Farm Assistant
```
Design the AI FARM ASSISTANT screen for Poultry Intelligence. It is a grounded data assistant, NOT a decorative chatbot. Cream background, white cards, brand green #2E7D52, Android phone portrait. No glowing orbs, no futuristic AI visuals.
Top bar: back + title "Ask about your farm".
Chat area:
- User bubble (right, soft green): "How is my current batch performing compared to my last 5 batches?"
- Assistant answer (left, white card): "Your current Flock 07 is more feed-efficient than your previous 5 batches." Below the text, a small GROUNDED FACTS box with labeled rows: "Current FCR 1.62" and "Previous 5-batch average 1.68", each tagged as a verified metric (small check icon).
- A subtle legend/footnote distinguishing: Recorded facts · Calculated metrics · AI observation.
Suggested-question chips above the input: "Which batch made the most profit?", "Why was Flock 05 profitable?", "Is this flock ready for lifting?".
Bottom input bar: rounded text field + brand-green send button. Calm, trustworthy, plain language.
```

### 3.21 Reports (export)
```
Design the REPORTS screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: title "Reports".
A list of report-type cards with icons: "Batch performance report", "Financial summary", "Mortality & health report", "Feed efficiency report". Each card has a short description line and a "Generate PDF" outline button.
A "Date range / batch" selector card at top (segmented or dropdown). Caption "Reports use your recorded data and calculated metrics." No gradients.
```

### 3.22 Farm / Shed Management
```
Design the FARM & SHED MANAGEMENT screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Farm & Sheds".
Farm card: "Sri Venkateshwara Poultry Farm", location "Tamil Nadu, India", owner "Ravi Kumar (Owner)", "2 sheds · 10,000 capacity", an "Edit" text action.
Sheds list: each shed card shows shed name, capacity, current occupancy (e.g. "Shed A — 5,000 cap — Flock 01 (4,820 birds)"), status chip. Primary button "+ Add shed".
A "Team / Users" link row with roles (Owner / Admin / Worker). No gradients.
```

### 3.23 Notifications
```
Design the NOTIFICATIONS screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait. Actionable, not spammy.
Top bar: back + title "Notifications".
A grouped list (Today / Earlier) of notification rows, each with a left status icon, title, message, time, and an inline action link:
- Mortality Alert (red/Act) — "Flock 01 mortality above recent trend" — "View trend"
- Lifting Reminder (amber/Watch) — "Flock 01 is approaching its lifting window" — "View readiness"
- Vaccination Reminder (amber) — "Newcastle Disease vaccination scheduled tomorrow" — "Mark done"
- Sync Alert (info/blue) — "8 records could not be synced" — "Retry"
Unread rows have a small brand-green dot. No gradients.
```

### 3.24 Settings
```
Design the SETTINGS screen for Poultry Intelligence. Cream background, white cards, brand green #2E7D52, Android phone portrait.
Top bar: back + title "Settings".
Grouped list cards with rows + chevrons:
- Account: Profile, Phone number, Role
- Farm: Farm & sheds, Users & roles
- App: Language (English, "regional languages coming soon"), Units, Notifications
- Data: Cloud sync & data status, Historical batches, Export data
- About: Help, Privacy, App version
A "Sign out" row in red/Act at the bottom. Clean list style, 48px rows, no gradients.
```

### 3.25 Cloud Sync / Data Status
```
Design the CLOUD SYNC / DATA STATUS screen for Poultry Intelligence (offline-first app). Cream background, white cards, brand green #2E7D52, Android phone portrait. Sync status must be crystal clear.
Top bar: back + title "Cloud Sync".
Hero status card: "All data synced" with green chip and "Last synced: Today, 08:25". If offline, show amber "Working offline — 8 changes waiting to sync" with a "Sync now" button.
A SYNC QUEUE list: each pending record row shows what it is (e.g. "Daily record · Flock 01"), time, and a sync-state chip (Saved on device / Sync pending / Syncing / Synced / Sync failed→Retry).
A legend card explaining the 5 sync states with their colors + words.
A storage/data card: "Local data 4.2 MB · Cloud backup on". No gradients. Reassure: "Your records are never lost — saved on device first."
```

---

## 4. Generation checklist

- [ ] Section 1 pasted first (design system primed)
- [ ] Home (3.3) looks calm and readable in <10s — this is the make-or-break screen
- [ ] Every status uses color **+ icon + word** (never color alone)
- [ ] All money uses ₹ with Indian grouping
- [ ] No gradients / glassmorphism / neon / decorative charts anywhere
- [ ] Bottom tab bar consistent across Home, Flock, Records, Reports, More
- [ ] Charts only appear with a plain-language takeaway caption
- [ ] Touch targets look ≥48px; primary buttons full-width ~56px
- [ ] Labels wrap, never truncated

## 5. Notes & provenance

- Palette, type scale, radii, and spacing are taken from this repo's real design tokens (`pih-design-tokens.json`, `apps/mobile/tailwind.config.js`, `apps/mobile/src/theme/tokens.ts`).
- Navigation (Home · Flock · Records · Reports · More) matches `apps/mobile/app/(tabs)/_layout.tsx`.
- Sample data matches `apps/mobile/src/data/demo.ts` so generated screens line up with the running demo.
- Screen list and product rules follow `Poultry_Intelligence_Production_Product_Direction.md` (Section 19 screen set) and `AGENTS.md` hard rules (no hard-coded colors, status never color-only, offline sync states, Indian paise/formatting, plain language).
- This is a scratch file (`*.temp.md`); delete it once the Stitch designs are generated.
