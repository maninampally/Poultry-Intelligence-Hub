# Poultry Intelligence
## Product & UI Direction

### 1. Product identity

The product is called **Poultry Intelligence**.

It is a modern poultry intelligence platform for Indian broiler farming. It should not feel like a generic farm-management ERP, a digital notebook, or an AI-generated demo application.

The core idea is:

> **Turn poultry-farm data into clear, actionable decisions.**

The platform combines:
- Farm and flock operations
- Cloud-based historical data
- Meaningful analytics
- Financial intelligence
- Lifting and settlement workflows
- AI-powered observations and questions
- Current operational alerts
- Historical batch comparison

---

## 2. Core UX principle

The farmer should understand the current situation within **5–10 seconds** after login.

The home screen should answer:

1. How is my current flock doing?
2. Is anything abnormal?
3. What needs my attention today?
4. What action should I take?
5. How is this batch performing compared with previous batches?

Do **not** display every available piece of data on the home screen.

The interface should be calm, practical, and decision-focused.

---

# 3. Post-login Home / Intelligence Dashboard

The primary screen should be an **Intelligence Dashboard**, not simply "Dashboard."

### Header

- Poultry Intelligence logo
- Farm name
- Current date
- Notifications
- User/farm profile

Example:

> Good morning  
> **Sri Lakshmi Poultry Farm**
>
> Here's what needs your attention today.

### Current Flock Card

Show the active flock prominently:

- Flock number
- Age in days
- Current bird count
- Average body weight
- Livability
- FCR
- Expected lifting window
- Overall status

Example:

> **Flock 08**
> Day 36 · 4,820 birds
>
> Avg. weight: 1.82 kg
> FCR: 1.58
> Livability: 96.4%
>
> **Performance: On track**
>
> Expected lifting: 4–6 days

---

# 4. Intelligence, not just statistics

Numbers should have context.

Instead of showing:

> Feed: 1,240 kg

show:

> **Feed consumption**
> 1,240 kg
> 4.2% above expected

Instead of:

> Mortality: 12

show:

> **Mortality**
> 12 birds today
> Within normal range

Instead of:

> Weight: 1.82 kg

show:

> **Average weight**
> 1.82 kg
> +3.1% vs target

The product should explain what a number means.

---

# 5. Meaningful graphs

Graphs should only appear when they answer a useful farming question.

### Weight vs Target

Question answered:

> Are the birds growing as expected?

Show:
- Actual weight
- Target weight
- Growth trajectory
- Current deviation

### FCR Trend

Question:

> Is feed efficiency improving or getting worse?

Show:
- Current flock FCR
- Target FCR
- Previous-batch comparison

### Mortality Trend

Question:

> Did mortality change unexpectedly?

Show:
- Daily mortality
- Normal range
- Abnormal spikes

### Feed Consumption

Question:

> Are birds consuming more or less feed than expected?

Show:
- Actual feed
- Expected feed
- Trend over time

### Financial Trend

Question:

> Where is the money going?

Show:
- Feed
- Chicks
- Medicine
- Labor
- Other costs
- Revenue
- Settlement
- Profit

### Batch Comparison

Question:

> How is this batch performing compared with previous batches?

Compare:
- FCR
- Mortality
- Average weight
- Feed cost/bird
- Production cost
- Revenue
- Profit/bird

Avoid decorative graphs with no decision value.

---

# 6. Alerts / Needs Attention

A dedicated section should surface important changes.

Examples:

### Feed alert
> Feed consumption is 7% above the recent expected level.

### Weight alert
> Average weight is below the target curve.

### Mortality alert
> Mortality increased compared with the recent flock trend.

### Environment alert
> Temperature has remained above the configured range.

### Lifting alert
> Flock 08 is approaching its planned lifting window.

Alerts should explain the reason and provide an action:

> **View trend**
> **Record observation**
> **Ask AI**

---

# 7. Quick Actions

Farmers should not have to navigate through multiple menus for common actions.

Primary actions:

- + Daily Record
- Mortality
- Feed
- Water
- Weight
- Medicine
- Expense
- Lifting

The exact actions can change based on the flock's current stage.

---

# 8. Flock lifecycle

A flock should move through clear states:

**Planned**
→ **Placed**
→ **Growing**
→ **Ready for Lifting**
→ **Partially Lifted**
→ **Final Lifting**
→ **Settlement**
→ **Completed**
→ **Archived**

The system should understand the lifecycle rather than treating each record independently.

---

# 9. Lifting workflow

"Lifting" is an important Indian broiler-farming workflow.

It means birds are collected/removed from the farm for sale or processing, usually near the end of the growing cycle.

The system should support multiple lifting events.

Example:

### Flock 07

Day 40:
- 2,000 birds lifted

Day 41:
- 1,800 birds lifted

Day 42:
- 1,020 birds lifted

After the final lifting, the flock becomes completed.

### Lifting screen

Show:

- Lifting date
- Buyer / integrator
- Vehicle number
- Number of birds lifted
- Average weight
- Total live weight
- Rate per kg
- Gross amount
- Adjustments
- Final settlement
- Payment status

The system should retain the complete lifting history.

---

# 10. Finance

Finance should not simply be an accounting ledger.

It should provide **financial intelligence**.

Important metrics:

- Total revenue
- Total production cost
- Feed cost
- Chick cost
- Medicine cost
- Labor cost
- Other expenses
- Gross settlement
- Net settlement
- Profit/loss
- Cost per bird
- Cost per kg live weight
- Profit per bird

### Batch comparison

Example:

| Metric | Current | Previous |
|---|---:|---:|
| Birds lifted | 4,820 | 4,610 |
| Avg. weight | 2.18 kg | 2.13 kg |
| FCR | 1.61 | 1.67 |
| Feed cost | ₹2.10L | ₹2.04L |
| Revenue | ₹11.35L | ₹10.41L |
| Profit | ₹82K | ₹76K |

Historical information should be surfaced here when it is useful for comparison.

---

# 11. Active vs historical data

Do not show old batch data constantly.

### Active data

The home screen should focus on:
- Current flock
- Current records
- Current alerts
- Current lifting status
- Current finances
- Recent trends

### Historical data

Completed batches should move into:

**Historical Batches / Archive**

The underlying data should not be deleted.

The system should retain:
- Daily records
- Feed records
- Water records
- Health records
- Medication
- Mortality
- Weight
- Expenses
- Lifting events
- Settlement
- Batch performance

However, the application should not load all historical detail into the main dashboard.

### Historical summaries

Important summarized metrics should remain available to analytics:

- Previous batch FCR
- Average mortality
- Average weight
- Cost/bird
- Profit/bird
- Revenue
- Feed efficiency
- Batch duration

This allows fast comparisons without clutter.

---

# 12. AI layer

AI should not be a decorative chatbot.

It should work across the farm's operational and historical data.

Examples:

> "How is my current flock performing?"

> "Compare this batch with my last five batches."

> "Why did Flock 05 make less profit?"

> "Which batch had the best feed efficiency?"

> "Is this flock ready for lifting?"

> "What changed in the last seven days?"

AI responses should reference actual farm data and clearly distinguish:
- Recorded facts
- Calculated metrics
- AI observations
- Recommendations

---

# 13. Main navigation

Recommended bottom navigation:

1. **Home**
2. **Flocks**
3. **Records**
4. **Insights**
5. **Finance**

Additional features can live under the profile/menu:

- Historical batches
- Farm settings
- Shed management
- Users
- Devices / IoT
- Cloud sync
- Reports
- AI assistant
- Account settings

---

# 14. Visual design direction

The application should look like a real production application, not an AI-generated concept.

### Design characteristics

- Clean Android/mobile-first interface
- Practical spacing
- Consistent typography
- Restrained use of color
- Cream/white backgrounds
- Deep agricultural green as the primary brand color
- Muted terracotta or amber for important states
- Natural farm photography only where useful
- Clear cards and sections
- Simple icons
- Realistic data density
- Strong hierarchy
- No excessive gradients
- No excessive glassmorphism
- No oversized decorative illustrations
- No fake futuristic AI effects
- No unnecessary 3D graphics

The UI should feel appropriate for a real Indian poultry operation.

---

# 15. Responsive / device considerations

The first experience should be optimized for Android phones because the farmer may be using a lower- or mid-range device.

Important considerations:
- Large touch targets
- Readable text
- Simple forms
- Minimal typing
- Fast loading
- Offline-friendly data entry
- Sync when connectivity returns
- Clear sync status
- Support for regional languages later
- Low-data usage
- Camera/photo capture where useful

---

# 16. Cloud architecture concept

The cloud layer should support:

**Farm**
→ **Sheds**
→ **Flocks**
→ **Daily records**
→ **Events**
→ **Lifting**
→ **Settlement**
→ **Financial summaries**
→ **Historical analytics**

Cloud storage should preserve historical data while the application presents only relevant active information.

---

# 17. Future IoT / sensor integration

Poultry Intelligence can eventually connect:

- Temperature sensors
- Humidity sensors
- Water meters
- Feed sensors
- Smart weighing systems
- Environmental monitoring
- Farm cameras

The dashboard should not show raw sensor streams unless useful.

Instead:

> **Environment: Normal**

with the ability to drill down into:

- Temperature
- Humidity
- Water
- Feed
- Air quality
- Ventilation

---

# 18. Overall product philosophy

Poultry Intelligence should answer:

> **What is happening?**
>
> **Why is it happening?**
>
> **Is it normal?**
>
> **What should I pay attention to?**
>
> **How does this compare with my previous batches?**
>
> **What does it mean financially?**

The goal is not to show the farmer more data.

The goal is to help the farmer **understand the right data at the right time.**

---

## Suggested first UI set

The initial product design should include these screens:

1. Login
2. Farm selection
3. Intelligence Home
4. Active Flock
5. Daily Record
6. Feed & Water
7. Weight Tracking
8. Health & Mortality
9. Medicine
10. Environment
11. Lifting Readiness
12. Lifting Event
13. Final Lifting
14. Settlement
15. Finance Dashboard
16. Batch Comparison
17. Historical Batches
18. Batch Detail
19. Insights
20. AI Farm Assistant
21. Reports
22. Farm/Shed Management
23. Notifications
24. Settings
25. Cloud Sync / Data Status

This document should be treated as the **UI/product direction document** for the next design and development stages.
