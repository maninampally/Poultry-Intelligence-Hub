import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react"
import { buildMetrics } from "@/domain/metrics"
import { createSeed } from "@/domain/seed"
import type {
  AlertItem,
  BiosecurityRound,
  BuyerReceipt,
  ContraSettlement,
  DailyRound,
  DispatchRecord,
  Expense,
  FarmSettings,
  FarmState,
  FeedMovement,
  HealthObservation,
  MaintenanceEvent,
  MortalityEvent,
  PurchasePlan,
  Role,
  Sale,
  SettlementRecord,
  SupplierPayment,
  SyncStatus,
  TaskItem,
  TeamMember,
  VaccinationEvent,
  VisitorEntry,
  WaterRecord,
  WeightSample,
  WorkStatus,
} from "@/domain/types"

const STORAGE_KEY = "poultry-intelligence-demo-v1"

type Syncable = { sync: SyncStatus }

function loadState(): FarmState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeed()
    const parsed = JSON.parse(raw) as FarmState
    if (parsed.version === 1 && Array.isArray(parsed.batches) && Array.isArray(parsed.rounds)) {
      return parsed
    }
  } catch {
    // Fall through to a fresh demo farm.
  }
  return createSeed()
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const index = list.findIndex((entry) => entry.id === item.id)
  if (index === -1) return [item, ...list]
  const next = list.slice()
  next[index] = item
  return next
}

function withoutId<T extends { id: string }>(list: T[], id: string) {
  return list.filter((entry) => entry.id !== id)
}

function markSynced<T extends Syncable>(list: T[]) {
  return list.map((item) =>
    item.sync === "saved-locally" || item.sync === "pending"
      ? { ...item, sync: "synced" as const }
      : item,
  )
}

function projectRound(state: FarmState, round: DailyRound): FarmState {
  const mortId = `round:${round.id}:mortality`
  const cullId = `round:${round.id}:cull`
  const feedId = `round:${round.id}:feed`
  const waterId = `round:${round.id}:water`
  let mortality = withoutId(state.mortality, mortId)
  let culls = withoutId(state.culls, cullId)
  let feed = withoutId(state.feed, feedId)
  let water = withoutId(state.water, waterId)

  if (!round.draft) {
    if (round.mortality !== null) {
      mortality = upsert(mortality, {
        id: mortId,
        batchId: round.batchId,
        date: round.date,
        shedId: round.shedId,
        count: round.mortality,
        cause: "Daily Farm Round",
        sync: round.sync,
      })
    }
    if (round.culls !== null) {
      culls = upsert(culls, {
        id: cullId,
        batchId: round.batchId,
        date: round.date,
        shedId: round.shedId,
        count: round.culls,
        sync: round.sync,
      })
    }
    if (round.feedKg !== null) {
      feed = upsert(feed, {
        id: feedId,
        date: round.date,
        reason: "issued",
        kg: round.feedKg,
        direction: -1,
        batchId: round.batchId,
        shedId: round.shedId,
        note: "Daily Farm Round",
        unitCostPaise: null,
        sync: round.sync,
      })
    }
    if (round.waterLitres !== null) {
      water = upsert(water, {
        id: waterId,
        batchId: round.batchId,
        date: round.date,
        shedId: round.shedId,
        litres: round.waterLitres,
        source: "Borewell",
        supply: "Recorded on the daily round",
        leak: "",
        litter: round.shedCondition,
        note: round.healthNote,
        sync: round.sync,
      })
    }
  }

  return {
    ...state,
    rounds: upsert(state.rounds, round),
    mortality,
    culls,
    feed,
    water,
  }
}

type Action =
  | { type: "set-role"; role: Role }
  | { type: "save-round"; round: DailyRound }
  | { type: "add-mortality"; event: MortalityEvent }
  | { type: "add-feed"; movement: FeedMovement }
  | { type: "add-weight"; sample: WeightSample }
  | { type: "add-water"; record: WaterRecord }
  | { type: "add-health"; record: HealthObservation }
  | { type: "add-vaccination"; record: VaccinationEvent }
  | { type: "add-biosecurity"; record: BiosecurityRound }
  | { type: "add-visitor"; record: VisitorEntry }
  | { type: "add-maintenance"; record: MaintenanceEvent }
  | { type: "save-task"; task: TaskItem }
  | { type: "set-task-status"; id: string; status: WorkStatus }
  | { type: "set-alert-status"; id: string; status: WorkStatus }
  | { type: "save-batch"; batchId: string; patch: Partial<FarmState["batches"][number]> }
  | { type: "add-dispatch"; record: DispatchRecord; settlement?: SettlementRecord }
  | { type: "add-expense"; expense: Expense }
  | { type: "add-payment"; payment: SupplierPayment }
  | { type: "add-sale"; sale: Sale }
  | { type: "add-receipt"; receipt: BuyerReceipt }
  | { type: "set-contra"; id: string; status: ContraSettlement["status"] }
  | { type: "set-plan-status"; id: string; status: PurchasePlan["status"] }
  | { type: "add-plan"; plan: PurchasePlan }
  | { type: "set-member-status"; id: string; status: TeamMember["status"] }
  | { type: "update-settings"; patch: Partial<FarmSettings> }
  | { type: "sync-now" }
  | { type: "reset" }

function reducer(state: FarmState, action: Action): FarmState {
  switch (action.type) {
    case "set-role":
      return { ...state, role: action.role }
    case "save-round":
      return projectRound(state, action.round)
    case "add-mortality":
      return { ...state, mortality: upsert(state.mortality, action.event) }
    case "add-feed":
      return { ...state, feed: upsert(state.feed, action.movement) }
    case "add-weight":
      return { ...state, weights: upsert(state.weights, action.sample) }
    case "add-water":
      return { ...state, water: upsert(state.water, action.record) }
    case "add-health":
      return { ...state, health: upsert(state.health, action.record) }
    case "add-vaccination":
      return { ...state, vaccinations: upsert(state.vaccinations, action.record) }
    case "add-biosecurity":
      return { ...state, biosecurity: upsert(state.biosecurity, action.record) }
    case "add-visitor":
      return { ...state, visitors: [action.record, ...state.visitors] }
    case "add-maintenance":
      return { ...state, maintenance: upsert(state.maintenance, action.record) }
    case "save-task":
      return { ...state, tasks: upsert(state.tasks, action.task) }
    case "set-task-status":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id ? { ...task, status: action.status } : task,
        ),
      }
    case "set-alert-status":
      return {
        ...state,
        alerts: state.alerts.map((alert) =>
          alert.id === action.id ? { ...alert, status: action.status } : alert,
        ),
      }
    case "save-batch":
      return {
        ...state,
        batches: state.batches.map((batch) =>
          batch.id === action.batchId ? { ...batch, ...action.patch } : batch,
        ),
      }
    case "add-dispatch":
      return {
        ...state,
        dispatches: upsert(state.dispatches, action.record),
        settlements: action.settlement
          ? upsert(state.settlements, action.settlement)
          : state.settlements,
      }
    case "add-expense":
      return { ...state, expenses: [action.expense, ...state.expenses] }
    case "add-payment":
      return { ...state, payments: [action.payment, ...state.payments] }
    case "add-sale":
      return { ...state, sales: [action.sale, ...state.sales] }
    case "add-receipt":
      return { ...state, receipts: [action.receipt, ...state.receipts] }
    case "set-contra":
      return {
        ...state,
        contras: state.contras.map((contra) =>
          contra.id === action.id ? { ...contra, status: action.status } : contra,
        ),
      }
    case "set-plan-status":
      return {
        ...state,
        plans: state.plans.map((plan) =>
          plan.id === action.id ? { ...plan, status: action.status } : plan,
        ),
      }
    case "add-plan":
      return { ...state, plans: [action.plan, ...state.plans] }
    case "set-member-status":
      return {
        ...state,
        team: state.team.map((member) =>
          member.id === action.id ? { ...member, status: action.status } : member,
        ),
      }
    case "update-settings":
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case "sync-now":
      return {
        ...state,
        rounds: markSynced(state.rounds),
        mortality: markSynced(state.mortality),
        culls: markSynced(state.culls),
        feed: markSynced(state.feed),
        weights: markSynced(state.weights),
        water: markSynced(state.water),
        health: markSynced(state.health),
        vaccinations: markSynced(state.vaccinations),
        biosecurity: markSynced(state.biosecurity),
        maintenance: markSynced(state.maintenance),
        dispatches: markSynced(state.dispatches),
      }
    case "reset":
      return createSeed()
    default:
      return state
  }
}

interface FarmContextValue {
  state: FarmState
  dispatch: (action: Action) => void
}

const FarmContext = createContext<FarmContextValue | null>(null)

export function FarmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>
}

export function useFarm() {
  const context = useContext(FarmContext)
  if (!context) throw new Error("useFarm must be used inside FarmProvider")
  const metrics = buildMetrics(context.state)
  return { ...context.state, ...metrics, dispatch: context.dispatch, state: context.state }
}

export type FarmDispatch = (action: Action) => void

export function aggregateSync(state: FarmState): SyncStatus {
  const statuses: SyncStatus[] = [
    ...state.rounds.map((item) => item.sync),
    ...state.mortality.map((item) => item.sync),
    ...state.feed.map((item) => item.sync),
    ...state.weights.map((item) => item.sync),
    ...state.water.map((item) => item.sync),
    ...state.dispatches.map((item) => item.sync),
  ]
  if (statuses.includes("issue")) return "issue"
  if (statuses.includes("needs-review")) return "needs-review"
  if (statuses.includes("syncing")) return "syncing"
  if (statuses.includes("pending") || statuses.includes("saved-locally")) return "saved-locally"
  return "synced"
}

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export type { AlertItem }
