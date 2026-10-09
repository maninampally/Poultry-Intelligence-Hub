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
>
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

# 19. Suggested first UI set

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

---

# 20. Production Technology Stack

The following is the **exact initial production stack** for Poultry Intelligence.

The architecture should remain a modular monolith initially. Do not introduce microservices unless actual scale or operational requirements justify them.

## 20.1 Mobile application

### Primary stack

- **React Native**
- **Expo**
- **TypeScript**
- **Expo Router**

The mobile application is the primary farmer experience.

Android should be the first production target, while maintaining a shared codebase that can support iOS.

### UI

- **NativeWind**
- Custom Poultry Intelligence design system
- Reusable components
- Accessible touch targets
- Consistent typography and spacing

### Client state

- **Zustand** for local application state
- **TanStack Query** for server state, caching, retries, and synchronization

### Forms and validation

- **React Hook Form**
- **Zod**

---

# 21. Offline-first architecture

Offline operation is a core product requirement because farm connectivity may be unreliable.

The farmer must be able to record operations without an internet connection.

Examples:

- Mortality
- Feed
- Water
- Weight
- Medicine
- Vaccination
- Expenses
- Lifting

## Local database

Use:

**SQLite**

The mobile app should maintain a local operational database.

Core local entities include:

- Farms
- Sheds
- Flocks
- Daily records
- Feed records
- Water records
- Weight records
- Mortality records
- Medicine records
- Vaccination records
- Lifting events
- Expenses
- Pending sync operations

## Sync model

```text
Farmer enters record
        ↓
Write to local SQLite
        ↓
Show "Saved on device"
        ↓
Add operation to sync queue
        ↓
Connectivity returns
        ↓
Sync with backend
        ↓
Server validates
        ↓
Record acknowledged
        ↓
Local sync status updated
```

The app should clearly show:

- Saved on device
- Sync pending
- Syncing
- Synced
- Sync failed

Offline data should never silently disappear.

---

# 22. Backend platform: Supabase

**Supabase is the initial backend platform.**

Supabase provides:

- Authentication
- PostgreSQL
- Row Level Security
- Storage
- Realtime capabilities
- Database management
- Database migrations
- Server-side functions where appropriate

Supabase is the backend platform; PostgreSQL is the database engine underneath it.

Do not run a separate PostgreSQL installation alongside Supabase for the initial production system.

---

# 23. PostgreSQL database

PostgreSQL is the **source of truth** for cloud application data.

The relational model is important because Poultry Intelligence contains strongly connected entities.

Core database domains:

```text
Organization
    ↓
Farm
    ↓
Shed
    ↓
Flock
    ↓
Daily Records
    ├── Feed
    ├── Water
    ├── Weight
    ├── Mortality
    ├── Medicine
    └── Vaccination
    ↓
Lifting Events
    ↓
Settlement
    ↓
Finance
    ↓
Batch Summary
```

### Initial core tables

- organizations
- users / profiles
- farms
- farm_members
- sheds
- flocks
- flock_status_history
- daily_records
- feed_records
- water_records
- weight_records
- mortality_records
- health_records
- medicines
- medicine_records
- vaccinations
- buyers
- lifting_events
- settlements
- expenses
- expense_categories
- batch_summaries
- financial_summaries
- notifications
- ai_insights
- ai_conversations
- sync_metadata

Table names may be adjusted during schema design, but the domain boundaries should remain clear.

---

# 24. Authentication and security

### Authentication

Use:

**Supabase Auth**

Possible initial authentication methods:

- Phone authentication
- Email/password
- Magic link where appropriate

### Authorization

Use:

**PostgreSQL Row Level Security (RLS)**

The system should enforce tenant isolation.

Conceptually:

```text
User
  ↓
Organization
  ↓
Farm
  ↓
Shed
  ↓
Flock
  ↓
Records
```

A user should only access data belonging to farms and organizations they are authorized to access.

Security must be enforced at the database layer, not only in the mobile UI.

---

# 25. File and document storage

Initial file storage:

**Supabase Storage**

Potential files:

- Feed invoices
- Medicine invoices
- Settlement documents
- Farm photographs
- Medicine label photographs
- Receipts
- Supporting documents

Later, large-scale object storage can move or expand to:

**AWS S3**

when there is a real cost, scale, or processing requirement.

---

# 26. Python backend and API layer

Use:

**Python + FastAPI**

for business logic and intelligence services that should not live directly in the mobile application.

### Backend libraries

- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL driver
- pytest
- HTTP client libraries as required

### Example API domains

```text
POST /flocks
GET  /flocks/{id}

POST /daily-records
GET  /flocks/{id}/records

POST /lifting-events
GET  /flocks/{id}/lifting

GET  /flocks/{id}/performance
GET  /flocks/{id}/profitability

GET  /analytics/farm
GET  /analytics/batches

POST /ai/ask
POST /ai/insights
```

The API structure should remain domain-oriented rather than becoming one large generic endpoint.

---

# 27. Analytics engine

Analytics should be deterministic and separate from LLM reasoning.

Use:

- **Python**
- **Pandas**
- **NumPy**
- PostgreSQL queries/materialized summaries where appropriate

The analytics engine calculates metrics such as:

### Mortality

```text
Mortality % =
Dead birds / Birds placed × 100
```

### Livability

```text
Livability % =
Birds sold / Birds placed × 100
```

### Average weight

```text
Average weight =
Total live weight / Birds sold
```

### FCR

```text
FCR =
Feed consumed / Live weight gain
```

### Financial metrics

- Cost per bird
- Cost per kg
- Revenue per bird
- Profit per bird
- Total production cost
- Gross settlement
- Net settlement

The analytics engine produces trusted metrics.

AI then interprets those metrics.

---

# 28. AI architecture

AI is an intelligence layer on top of the operational data.

Use:

- **LangGraph**
- Provider abstraction for LLMs
- OpenAI
- Anthropic
- Gemini
- PostgreSQL + pgvector for retrieval

The system should not allow an LLM to independently calculate critical farm metrics when deterministic calculations are available.

### AI flow

```text
Farmer question
       ↓
Intent / task detection
       ↓
Retrieve relevant farm data
       ↓
Run deterministic analytics
       ↓
Retrieve historical context
       ↓
Retrieve knowledge with RAG when needed
       ↓
LLM reasoning
       ↓
Validation / response formatting
       ↓
Farmer-friendly answer
```

Example:

> "Why is Flock 07 performing worse than my previous batches?"

The system should gather:

- Current flock metrics
- Previous batch metrics
- Feed consumption
- Weight trajectory
- Mortality
- Production costs
- Relevant target values

Then generate an explanation based on those verified inputs.

---

# 29. Vector search and RAG

Use:

**pgvector in PostgreSQL**

for the initial vector-search system.

Do not introduce a separate vector database at the beginning.

Potential RAG sources:

- Poultry operating guidance
- Farm SOPs
- Uploaded documents
- Medicine information
- Vaccination documentation
- Historical AI reports
- Farm-specific knowledge

The AI should distinguish between:

- Farm-recorded facts
- Calculated metrics
- Retrieved knowledge
- AI interpretation

---

# 30. Background jobs and asynchronous processing

Use:

**Redis + background workers**

when tasks should not block the farmer's request.

Potential background tasks:

- Nightly analytics
- Batch summaries
- AI insight generation
- Document processing
- OCR processing
- Notification scheduling
- Large report generation
- Data synchronization processing

Redis should be used for queues/cache where appropriate.

Redis should **not** become the source of truth for farm records.

---

# 31. Notifications

Use:

- Expo Notifications
- Firebase Cloud Messaging for Android
- APNs for iOS

Notification examples:

```text
Mortality Alert
Flock 12 mortality is above its recent trend.
```

```text
Lifting Reminder
Flock 08 is approaching its expected lifting window.
```

```text
Vaccination Reminder
Vaccination is scheduled for tomorrow.
```

```text
Sync Alert
8 records could not be synchronized.
Tap to retry.
```

Notifications should be actionable and not become notification spam.

---

# 32. Charts and visualization

Use a React Native-compatible chart library.

Charts should support:

- Line charts
- Bar charts
- Comparison charts
- Target vs actual
- Trend visualization
- Simple financial breakdowns

Charts should be driven by meaningful questions.

Avoid decorative charts.

---

# 33. Lifting and settlement data model

Lifting is a first-class domain.

A flock can have multiple lifting events.

```text
Flock
  ↓
Partial Lifting
  ↓
Partial Lifting
  ↓
Final Lifting
  ↓
Settlement
  ↓
Completed
```

Each lifting event should capture:

- Date
- Buyer/integrator
- Vehicle
- Birds lifted
- Average weight
- Total live weight
- Rate/kg
- Gross amount
- Adjustments
- Net amount
- Payment status

The complete lifting history remains available after the flock is archived.

---

# 34. Historical data architecture

Archived does not mean deleted.

The lifecycle is:

```text
Active
  ↓
Completed / Partially Lifted
  ↓
Archived
```

Historical data should remain available for:

- Batch comparison
- Financial analysis
- AI questions
- Reporting
- Operational learning

The home screen should query active data by default.

Historical analytics should use optimized summary data where possible.

### Important distinction

**Archive** is a product/data-access state.

**Backup** is disaster recovery.

They are not the same thing.

---

# 35. Finance architecture

Finance should connect operational records to actual business outcomes.

```text
Chicks
   +
Feed
   +
Medicine
   +
Labor
   +
Other expenses
   ↓
Production cost
   ↓
Lifting
   ↓
Revenue
   ↓
Adjustments
   ↓
Settlement
   ↓
Profit / Loss
```

Financial calculations should be deterministic.

AI can explain financial changes, but should not be the accounting engine.

---

# 36. Web / Admin application

Build later using:

- **Next.js**
- **TypeScript**
- Same backend APIs
- Supabase authentication/authorization

Potential functions:

- Organization administration
- Farm administration
- User management
- Analytics
- Reports
- Support
- AI monitoring
- Configuration
- Device / IoT management

The farmer's primary interface remains the mobile application.

---

# 37. Future IoT architecture

The platform can eventually support:

- Temperature sensors
- Humidity sensors
- Water meters
- Feed sensors
- Smart weighing systems
- Air-quality sensors
- Ventilation systems
- Farm cameras

The application should convert sensor streams into useful states.

Instead of displaying:

> Temperature: 31.7°C  
> Humidity: 68.2%  
> Sensor 4: 1,247

show:

> **Environment: Needs Attention**
>
> Temperature has remained above the configured range for the last 45 minutes.

Raw telemetry should remain available as drill-down data.

---

# 38. Deployment architecture

Initial production deployment:

```text
                    GitHub
                       │
                 GitHub Actions
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Expo / EAS          Docker Backend
             │                   │
             ▼                   ▼
        Android/iOS        FastAPI Hosting
                                 │
                                 ▼
                             Supabase
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
               PostgreSQL     Storage       Auth
```

AWS infrastructure should be introduced when there is a concrete requirement.

Potential later AWS services:

- ECS/Fargate
- S3
- SQS
- CloudFront
- Secrets Manager
- Bedrock
- CloudWatch
- ElastiCache

Do not introduce all of these on day one.

---

# 39. Environments

Maintain three environments:

```text
LOCAL
  ↓
STAGING
  ↓
PRODUCTION
```

### Local

Developer environment with test data.

### Staging

Production-like environment for QA and release validation.

### Production

Actual farmer and farm data.

Never develop directly against production data.

---

# 40. CI/CD

### Mobile

Use:

- GitHub
- GitHub Actions
- Expo EAS

Pipeline:

```text
Code
 ↓
Pull Request
 ↓
Lint
 ↓
Type check
 ↓
Tests
 ↓
Build
 ↓
Staging
 ↓
Production
```

### Backend

```text
GitHub
 ↓
GitHub Actions
 ↓
Tests
 ↓
Docker build
 ↓
Security checks
 ↓
Deploy
```

Database migrations should be version-controlled.

---

# 41. Testing strategy

### Mobile

- Unit tests
- Component tests
- Offline behavior tests
- Sync tests
- Form validation tests
- Critical user-flow tests

### Backend

- Unit tests
- API integration tests
- Database tests
- Authorization/RLS tests
- Analytics calculation tests
- AI workflow tests

### Critical calculations must have automated tests

Especially:

- FCR
- Mortality %
- Livability
- Average weight
- Cost/bird
- Profit/bird
- Settlement totals
- Batch summaries

---

# 42. Observability and monitoring

Use:

**Sentry**

for mobile and backend error monitoring.

Monitor:

- Mobile crashes
- API failures
- Slow API requests
- Sync failures
- Database errors
- Background job failures
- AI failures
- Notification failures

The system should be able to identify failures before they become recurring farmer problems.

---

# 43. Security principles

Production security requirements:

- Tenant isolation
- PostgreSQL RLS
- Secure authentication
- HTTPS/TLS
- Secrets outside source code
- Least-privilege access
- Server-side authorization
- Input validation
- Audit logging for important changes
- Secure file access
- Database backups
- Environment separation

Never trust the mobile client to enforce authorization by itself.

---

# 44. What we should NOT build initially

Avoid unnecessary complexity.

Do not start with:

- Kubernetes
- Microservices
- Multiple databases
- Separate vector database
- Complex event-driven architecture
- Full IoT platform
- Real-time sensor streaming
- Multiple cloud providers
- Custom ML models for every metric
- Large AWS service footprint
- A separate analytics warehouse

Start with a modular monolith.

---

# 45. Initial production architecture

The first production version should be:

```text
React Native
     +
Expo
     +
TypeScript
     +
SQLite
     +
Supabase
     +
PostgreSQL
     +
FastAPI
     +
Python Analytics
     +
LangGraph
     +
pgvector
     +
LLM Provider Abstraction
     +
Redis / Workers
     +
Expo Notifications
     +
GitHub Actions / EAS
     +
Sentry
```

This provides:

- Mobile-first operation
- Offline capability
- Relational farm data
- Secure multi-tenancy
- Reliable analytics
- AI intelligence
- Lifting and settlement
- Historical comparison
- Notifications
- Production monitoring
- A clear path to AWS scale

---

# 46. Recommended development order

Build in this order rather than trying to build the entire platform simultaneously.

### Phase 1 — Foundation

- React Native + Expo
- TypeScript
- Design system
- Supabase
- PostgreSQL schema
- Authentication
- Farm/shed/flock structure
- SQLite
- Basic offline sync

### Phase 2 — Daily operations

- Daily records
- Feed
- Water
- Mortality
- Weight
- Medicine
- Health
- Expenses

### Phase 3 — Lifting

- Lifting readiness
- Partial lifting
- Final lifting
- Settlement
- Batch completion
- Archive

### Phase 4 — Intelligence

- FCR
- Mortality analysis
- Weight vs target
- Feed analysis
- Batch comparison
- Financial analytics
- Alerts

### Phase 5 — AI

- AI farm assistant
- LangGraph workflows
- RAG
- Historical comparisons
- AI-generated observations
- AI explanations

### Phase 6 — Production hardening

- Monitoring
- Automated testing
- CI/CD
- Backup/recovery
- Performance optimization
- Security review
- Regional language support

### Phase 7 — Scale

Only when justified:

- AWS S3
- SQS
- ECS/Fargate
- Bedrock
- Advanced IoT
- Large-scale analytics infrastructure
- Additional worker infrastructure

---

# 47. Final architecture principle

Poultry Intelligence should be built around this separation:

```text
                FARM DATA
                    │
                    ▼
          ┌──────────────────┐
          │ PostgreSQL       │
          │ Source of Truth  │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Analytics Engine │
          │ Deterministic    │
          │ Calculations     │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ AI / LangGraph   │
          │ Interpretation   │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Farmer Decision  │
          │ + Action         │
          └──────────────────┘
```

The database stores what happened.

The analytics engine calculates what the data means mathematically.

The AI explains patterns and helps the farmer understand what deserves attention.

The mobile application presents only the information needed to make the next decision.

---

# 48. Product north star

Poultry Intelligence should answer:

> **What is happening?**

> **Why is it happening?**

> **Is it normal?**

> **What needs attention?**

> **What action should I take?**

> **How does this compare with previous batches?**

> **What does it mean financially?**

The goal is not to show the farmer more data.

The goal is to help the farmer **understand the right data at the right time.**
