export type Role = "owner" | "manager" | "worker"

export type SyncStatus =
  | "saved-locally"
  | "pending"
  | "syncing"
  | "synced"
  | "issue"
  | "needs-review"

export type Severity = "urgent" | "attention" | "due" | "information"

export type WorkStatus = "open" | "acknowledged" | "resolved"

export type FeedReason =
  | "opening"
  | "received"
  | "issued"
  | "returned"
  | "spill"
  | "pest"
  | "moisture"
  | "expired"
  | "adjustment"

export interface Shed {
  id: string
  name: string
  placedBirds: number
  capacity: number
}

export interface BatchAllocation {
  shedId: string
  count: number
}

export interface BatchSummary {
  mortality: number
  culls: number
  dispatched: number
  fcr: number
  finalWeightGrams: number
  recordedCostPaise: number
}

export interface Batch {
  id: string
  code: string
  status: "setup" | "active" | "closed"
  breed: string
  supplier: string
  supplierLot: string
  placedOn: string
  ordered: number
  received: number
  placed: number
  shedIds: string[]
  allocations: BatchAllocation[]
  lessons: string
  closedOn: string | null
  firstDay: "completed" | "concern" | "not-recorded"
  summary: BatchSummary | null
}

export interface DailyRound {
  id: string
  batchId: string
  date: string
  shedId: string
  mortality: number | null
  culls: number | null
  feedKg: number | null
  waterLitres: number | null
  observation: string
  shedCondition: string
  healthNote: string
  draft: boolean
  sync: SyncStatus
}

export interface MortalityEvent {
  id: string
  batchId: string
  date: string
  shedId: string
  count: number
  cause: string
  sync: SyncStatus
}

export interface CullEvent {
  id: string
  batchId: string
  date: string
  shedId: string
  count: number
  sync: SyncStatus
}

export interface TransferEvent {
  id: string
  batchId: string
  date: string
  direction: "in" | "out"
  count: number
  note: string
}

export interface FeedMovement {
  id: string
  date: string
  reason: FeedReason
  kg: number
  direction: 1 | -1
  batchId: string | null
  shedId: string | null
  note: string
  unitCostPaise: number | null
  sync: SyncStatus
  enteredUnit?: "kg" | "bags"
  enteredValue?: number
  bagSizeKg?: number
}

export interface WeightSample {
  id: string
  batchId: string
  date: string
  shedId: string
  sampleSize: number
  totalGrams: number
  zones: string
  method: string
  scale: string
  note: string
  sync: SyncStatus
}

export interface WaterRecord {
  id: string
  batchId: string
  date: string
  shedId: string
  litres: number
  source: string
  supply: string
  leak: string
  litter: string
  note: string
  sync: SyncStatus
}

export interface HealthObservation {
  id: string
  batchId: string
  date: string
  shedId: string
  signs: string
  note: string
  sync: SyncStatus
}

export interface VaccinationEvent {
  id: string
  batchId: string
  name: string
  dueOn: string
  givenOn: string | null
  lot: string
  route: string
  administrator: string
  sync: SyncStatus
}

export interface BiosecurityRound {
  id: string
  date: string
  shedId: string
  footwear: boolean
  cleaning: boolean
  mortalityRemoval: boolean
  waterline: boolean
  note: string
  sync: SyncStatus
}

export interface VisitorEntry {
  id: string
  date: string
  name: string
  purpose: string
  vehicle: string
}

export interface MaintenanceAsset {
  id: string
  name: string
  shedId: string | null
  condition: string
  nextService: string
}

export interface MaintenanceEvent {
  id: string
  assetId: string
  date: string
  issue: string
  status: "open" | "done"
  note: string
  sync: SyncStatus
}

export interface TaskItem {
  id: string
  title: string
  detail: string
  severity: Severity
  status: WorkStatus
  assignee: string
  due: string
  shedId: string | null
}

export interface AlertItem {
  id: string
  severity: Severity
  title: string
  why: string
  evidence: string
  coverage: string
  action: string
  status: WorkStatus
}

export interface DispatchRecord {
  id: string
  batchId: string
  date: string
  caught: number
  loaded: number
  rejected: number
  transporter: string
  vehicle: string
  destination: string
  farmGateKg: number | null
  note: string
  sync: SyncStatus
}

export interface SettlementRecord {
  id: string
  dispatchId: string
  date: string
  buyerWeightKg: number | null
  classification: string
  transportDeductionPaise: number
  otherDeductionPaise: number
  reference: string
  status: "unclassified" | "review" | "disputed" | "settled"
}

export interface Expense {
  id: string
  date: string
  party: string
  description: string
  amountPaise: number
  kind: "invoice" | "cash"
  batchId: string
}

export interface SupplierPayment {
  id: string
  date: string
  party: string
  amountPaise: number
  note: string
}

export interface Sale {
  id: string
  date: string
  buyer: string
  amountPaise: number
  birds: number | null
  dispatchId: string | null
  note: string
}

export interface BuyerReceipt {
  id: string
  date: string
  buyer: string
  amountPaise: number
  note: string
}

export interface ContraSettlement {
  id: string
  party: string
  amountPaise: number
  status: "draft" | "proposed" | "approved" | "applied" | "reversed"
  note: string
}

export interface Supplier {
  id: string
  name: string
  contact: string
  products: string
  terms: string
}

export interface Buyer {
  id: string
  name: string
  contact: string
  note: string
}

export interface PurchasePlan {
  id: string
  item: string
  quantity: string
  supplier: string
  neededBecause: string
  status: "suggested" | "ordered" | "received" | "cancelled"
  eta: string
}

export interface TeamMember {
  id: string
  name: string
  role: Role
  shed: string
  status: "active" | "inactive"
  passcode: string
}

export interface Sop {
  id: string
  title: string
  steps: string[]
}

export interface FarmSettings {
  farmName: string
  location: string
  notifications: boolean
  timezone: string
  feedUnit: "kg" | "bags"
  defaultBagKg: number | null
}

export type OnboardingStatus = "not_started" | "in_progress" | "completed"

export interface OnboardingDraftFarm {
  farmName: string
  location: string
  timezone: string
  feedUnit: "kg" | "bags"
  defaultBagKg: string
}

export interface OnboardingDraftShed {
  draftId: string
  name: string
  capacity: string
}

export interface OnboardingDraftAllocation {
  shedDraftId: string
  count: string
}

export interface OnboardingDraftBatch {
  draftId: string
  code: string
  breed: string
  breedUnknown: boolean
  supplier: string
  date: string
  placedCount: string
  allocations: OnboardingDraftAllocation[]
}

export interface OnboardingDraft {
  draftId: string
  step: 1 | 2 | 3
  farm: OnboardingDraftFarm
  sheds: OnboardingDraftShed[]
  batchMode: "planned" | "placed" | "later" | null
  batch: OnboardingDraftBatch | null
}

export interface OnboardingState {
  status: OnboardingStatus
  draft: OnboardingDraft | null
}

export interface FarmState {
  version: 1
  role: Role
  currentUserId: string | null
  activeBatchId: string
  settings: FarmSettings
  sheds: Shed[]
  batches: Batch[]
  rounds: DailyRound[]
  mortality: MortalityEvent[]
  culls: CullEvent[]
  transfers: TransferEvent[]
  feed: FeedMovement[]
  weights: WeightSample[]
  water: WaterRecord[]
  health: HealthObservation[]
  vaccinations: VaccinationEvent[]
  biosecurity: BiosecurityRound[]
  visitors: VisitorEntry[]
  assets: MaintenanceAsset[]
  maintenance: MaintenanceEvent[]
  tasks: TaskItem[]
  alerts: AlertItem[]
  dispatches: DispatchRecord[]
  settlements: SettlementRecord[]
  expenses: Expense[]
  payments: SupplierPayment[]
  sales: Sale[]
  receipts: BuyerReceipt[]
  contras: ContraSettlement[]
  suppliers: Supplier[]
  buyers: Buyer[]
  plans: PurchasePlan[]
  team: TeamMember[]
  sops: Sop[]
  onboarding: OnboardingState
}
