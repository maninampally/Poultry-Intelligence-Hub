# New Dashboard Components Guide

9 new React components for enhanced UI/UX. Import from `@/components/DashboardComponents`.

---

## 📊 Chart Components

### 1. MortalityTrendChart
**Shows:** Daily mortality + cumulative trend over time

```tsx
import { MortalityTrendChart } from "@/components/DashboardComponents";

<MortalityTrendChart 
  mortality={batch.mortality} 
  batchPlacedDate={batch.placedDate}
/>
```

**Props:**
- `mortality: MortalityRecord[]` — array of mortality records
- `batchPlacedDate: string` — batch start date (YYYY-MM-DD)

**Use:** Shows mortality patterns, spot outliers, compare daily vs cumulative

---

### 2. FeedRunwayChart
**Shows:** Feed balance over time + current runway

```tsx
<FeedRunwayChart 
  feed={batch.feed} 
  feedStock={batch.feedStock}
/>
```

**Props:**
- `feed: FeedRecord[]` — purchase/usage history
- `feedStock: number` — current stock in kg

**Use:** Plan next purchase, track consumption rate

---

### 3. BatchWeightProgress
**Shows:** Average weight progression by day

```tsx
<BatchWeightProgress weights={batch.weights} />
```

**Props:**
- `weights: WeightRecord[]` — weight samples

**Use:** Track growth rate, identify weight issues early

---

### 4. CostBreakdownChart
**Shows:** Expenses by category (pie chart)

```tsx
<CostBreakdownChart expenses={batch.expenses} />
```

**Props:**
- `expenses: ExpenseRecord[]` — all expense entries

**Use:** Visualize cost allocation, identify expensive categories

---

## 📋 Table Components

### 5. MortalityTable
**Shows:** Sortable mortality log (date, birds, reason)

```tsx
import { MortalityTable } from "@/components/DashboardComponents";

<MortalityTable 
  mortality={batch.mortality}
  onRowClick={(record) => setModal("mortality")}
/>
```

**Props:**
- `mortality: MortalityRecord[]`
- `onRowClick?: (record) => void` — handle row click

**Features:**
- Click column headers to sort (date/count/reason)
- Click row to edit
- Shows —  for missing reasons

---

### 6. FeedMovementTable
**Shows:** Sortable feed movements (purchase/usage)

```tsx
<FeedMovementTable feed={batch.feed} />
```

**Props:**
- `feed: FeedRecord[]`

**Features:**
- Sortable by date/quantity/kind
- Shows total purchased vs used
- Color-coded (green = purchase, orange = usage)

---

## 📅 Timeline & Status

### 7. ActivityTimeline
**Shows:** Chronological activity history (newest first)

```tsx
import { ActivityTimeline } from "@/components/DashboardComponents";

<ActivityTimeline activities={batch.activities} />
```

**Props:**
- `activities: Activity[]` — activity log

**Features:**
- Shows last 20 activities
- Color-coded by type (red=mortality, orange=feed, green=other)
- Includes timestamp

---

### 8. BatchProgressRing
**Shows:** Circular progress indicator for batch age

```tsx
import { BatchProgressRing } from "@/components/DashboardComponents";

<BatchProgressRing 
  placedDate={batch.placedDate}
  daysToHarvest={49}
  daysCurrent={age}
/>
```

**Props:**
- `placedDate: string` — start date
- `daysToHarvest: number` — expected cycle length
- `daysCurrent: number` — days elapsed

**Use:** Quick visual of batch progress

---

### 9. SyncStatusIndicator
**Shows:** Cloud sync status + last sync time

```tsx
import { SyncStatusIndicator } from "@/components/DashboardComponents";

<SyncStatusIndicator 
  isConnected={syncContext.isConnected}
  lastSyncTime={state.lastSaved}
  pendingOps={pendingCount}
/>
```

**Props:**
- `isConnected: boolean`
- `lastSyncTime: string` — ISO timestamp
- `pendingOps?: number` — operations waiting to sync

**Features:**
- Hover to see details
- Shows connection status, last sync time, pending ops

---

## 🎯 Modal Components

### 10. QuickMortalityEntry
**Shows:** Quick modal to log mortality (date, count, reason)

```tsx
import { QuickMortalityEntry } from "@/components/DashboardComponents";

const [quickOpen, setQuickOpen] = useState(false);

<QuickMortalityEntry
  open={quickOpen}
  onClose={() => setQuickOpen(false)}
  onSubmit={(data) => {
    // Create mortality record
    state.batches[idx].mortality.push({
      id: uid("mort"),
      ...data,
      createdAt: new Date().toISOString(),
    });
  }}
  defaultDate={today}
/>

<button onClick={() => setQuickOpen(true)}>
  + Quick mortality
</button>
```

**Props:**
- `open: boolean`
- `onClose: () => void`
- `onSubmit: (data: { date, count, reason }) => void`
- `defaultDate?: string`

**Features:**
- Reason quick-select (Disease, Injury, Predation, etc.)
- Today's date by default
- Fast entry workflow

---

## 🎨 Styling & Integration

All components use:
- **Recharts** for charts (already installed)
- **Radix UI** for dialogs/hovers
- **Lucide icons**
- **Tailwind CSS** for styling

Add these CSS classes to your app CSS for enhanced styling:

```css
.chart-container {
  background: #fff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.table-container {
  overflow-x: auto;
  background: #fff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.timeline-container {
  background: #fff;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.progress-ring-container {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 0.5rem;
}

.sync-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  background: #f3f4f6;
  cursor: pointer;
}
```

---

## 📍 Where to Add Components

### Today Dashboard
- Add `MortalityTrendChart` + `BatchProgressRing` above batch status
- Add `SyncStatusIndicator` to header
- Add "Quick mortality" button → `QuickMortalityEntry`

### Records Page
- Add `MortalityTable` + `ActivityTimeline` side-by-side
- Add `FeedMovementTable` in its own section

### Batches Comparison Page
- Add `CostBreakdownChart` to cost breakdown card
- Add `BatchWeightProgress` near weight metrics

### Settings/Dashboard Section
- Add `FeedRunwayChart` to feed management area

---

## ✅ Usage Checklist

- [ ] Import components from `DashboardComponents`
- [ ] Pass correct data props (mortality, feed, expenses, activities, weights)
- [ ] Add click handlers for table rows (link to edit modals)
- [ ] Add CSS classes to app stylesheets
- [ ] Test with demo data
- [ ] Rebuild with `docker-compose up --build`
- [ ] Verify charts render, tables sort, modals open/close

---

## 🔧 Customization

### Colors
- Terracotta: `#C65B3A` (primary accent)
- Forest green: `#1f5f3f` (secondary)
- Modify in component files if needed

### Chart sizes
- Default height: 250px for charts, 300px for pie
- Adjust in component `ResponsiveContainer` height prop

### Sorting
- Tables default to reverse-sorted (newest first)
- Change `setSortAsc(false)` to `setSortAsc(true)` for ascending

---

## 📝 Notes

- All components handle empty data gracefully (show "No data yet")
- Dates formatted as Indian locale (en-IN)
- Numbers formatted with commas (₹, kg)
- Icons from Lucide React
- Hover cards for additional context (e.g., sync status)
