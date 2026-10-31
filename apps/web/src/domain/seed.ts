import type { BatchAllocation, FarmState, FeedReason, TeamMember } from "@/domain/types"
import { isoOffset } from "@/domain/format"

const ACTIVE = "b-2026-14"
const CLOSED = "b-2026-13"
const SHED_A = "shed-a"
const SHED_B = "shed-b"

const mortalityByOffset: Record<number, number> = {
  [-26]: 18,
  [-25]: 12,
  [-24]: 9,
  [-20]: 6,
  [-14]: 5,
  [-10]: 4,
  [-7]: 7,
  [-4]: 8,
  [-3]: 4,
  [-2]: 3,
  [-1]: 22,
}

const cullByOffset: Record<number, number> = {
  [-12]: 6,
  [-4]: 8,
}

function issuedKg(offset: number) {
  if (offset === -2 || offset >= 0 || offset < -27) return null
  const known: Record<number, number> = {
    [-5]: 640,
    [-4]: 655,
    [-3]: 670,
    [-1]: 690,
  }
  if (known[offset]) return known[offset]
  const progress = (offset + 28) / 27
  return Math.round(160 + progress * 520)
}

function waterLitres(offset: number) {
  if (offset === -4 || offset >= 0 || offset < -27) return null
  if (offset === -2) return 540
  const feed = issuedKg(offset)
  if (feed === null) return null
  return Math.round(feed * 1.7)
}

function movement(
  id: string,
  offset: number,
  reason: FeedReason,
  kg: number,
  direction: 1 | -1,
  batchId: string | null,
  note: string,
  unitCostPaise: number | null = null,
) {
  return {
    id,
    date: isoOffset(offset),
    reason,
    kg,
    direction,
    batchId,
    shedId: batchId ? SHED_A : null,
    note,
    unitCostPaise,
    sync: "synced" as const,
  }
}

export function createSeed(): FarmState {
  const issued: FarmState["feed"] = []
  let issuedSum = 0
  for (let offset = -27; offset <= -1; offset += 1) {
    const kg = issuedKg(offset)
    if (kg === null) continue
    issuedSum += kg
    issued.push(
      movement(`feed-issued-${offset}`, offset, "issued", kg, -1, ACTIVE, "Issued for bird consumption"),
    )
  }
  const spill = 18
  const opening = 500
  const targetStock = 2720
  const received = targetStock - opening + issuedSum + spill

  const rounds: FarmState["rounds"] = []
  const mortality: FarmState["mortality"] = []
  const culls: FarmState["culls"] = []
  const water: FarmState["water"] = []

  for (let offset = -27; offset <= -1; offset += 1) {
    const date = isoOffset(offset)
    const feed = issuedKg(offset)
    const litres = waterLitres(offset)
    const deaths = mortalityByOffset[offset]
    const culled = cullByOffset[offset]
    if (feed === null && litres === null && deaths === undefined && culled === undefined) continue
    const id = `round-${offset}`
    rounds.push({
      id,
      batchId: ACTIVE,
      date,
      shedId: SHED_A,
      mortality: deaths === undefined ? null : deaths,
      culls: culled === undefined ? null : culled,
      feedKg: feed,
      waterLitres: litres,
      observation: deaths && deaths > 15 ? "Uneven" : "Active",
      shedCondition: offset === -4 ? "Damp" : "Dry",
      healthNote: deaths && deaths > 15 ? "Higher count than the days around it. No cause entered." : "",
      draft: false,
      sync: "synced",
    })
    if (deaths !== undefined) {
      mortality.push({
        id: `round:${id}:mortality`,
        batchId: ACTIVE,
        date,
        shedId: SHED_A,
        count: deaths,
        cause: deaths > 15 ? "Not classified" : "Daily Farm Round",
        sync: "synced",
      })
    }
    if (culled !== undefined) {
      culls.push({
        id: `round:${id}:cull`,
        batchId: ACTIVE,
        date,
        shedId: SHED_A,
        count: culled,
        sync: "synced",
      })
    }
    if (litres !== null) {
      water.push({
        id: `round:${id}:water`,
        batchId: ACTIVE,
        date,
        shedId: SHED_A,
        litres,
        source: "Borewell",
        supply: "Normal",
        leak: offset === -1 ? "Drinker line drip in Shed A" : "None seen",
        litter: offset === -4 ? "Damp near the line" : "Dry",
        note: "",
        sync: "synced",
      })
    }
  }

  return {
    version: 1,
    role: "owner",
    currentUserId: null,
    activeBatchId: ACTIVE,
    settings: {
      farmName: "Annapurna Poultry Farm",
      location: "Salem, Tamil Nadu",
      notifications: true,
      timezone: "Asia/Kolkata",
      feedUnit: "kg",
      defaultBagKg: null,
    },
    sheds: [
      { id: SHED_A, name: "Shed A · East", placedBirds: 3000, capacity: 3500 },
      { id: SHED_B, name: "Shed B · West", placedBirds: 2000, capacity: 2500 },
    ],
    batches: [
      {
        id: ACTIVE,
        code: "B-2026-14",
        status: "active",
        breed: "Cobb 430",
        supplier: "Venkateshwara Hatcheries",
        supplierLot: "VH-518",
        placedOn: isoOffset(-27),
        ordered: 5000,
        received: 4988,
        placed: 5000,
        shedIds: [SHED_A, SHED_B],
        allocations: [
          { shedId: SHED_A, count: 2500 },
          { shedId: SHED_B, count: 2500 },
        ],
        lessons: "",
        closedOn: null,
        firstDay: "completed",
        summary: null,
      },
      {
        id: CLOSED,
        code: "B-2026-13",
        status: "closed",
        breed: "Cobb 430",
        supplier: "Venkateshwara Hatcheries",
        supplierLot: "VH-441",
        placedOn: isoOffset(-70),
        ordered: 4800,
        received: 4788,
        placed: 4788,
        shedIds: [SHED_A],
        allocations: [{ shedId: SHED_A, count: 4788 }],
        lessons: "Wet litter in week 3 lined up with higher culls. Start litter turning on day 10.",
        closedOn: isoOffset(-28),
        firstDay: "completed",
        summary: {
          mortality: 168,
          culls: 36,
          dispatched: 4584,
          fcr: 1.58,
          finalWeightGrams: 2360,
          recordedCostPaise: 81_200_000,
        },
      },
    ],
    rounds,
    mortality,
    culls,
    transfers: [
      {
        id: "transfer-in-1",
        batchId: ACTIVE,
        date: isoOffset(-18),
        direction: "in",
        count: 80,
        note: "Same-lot birds added after the placement count.",
      },
    ],
    feed: [
      movement("feed-open", -27, "opening", opening, 1, null, "Opening balance"),
      movement(
        "feed-recv",
        -10,
        "received",
        received,
        1,
        null,
        "Sri Murugan Feeds delivery",
        3200,
      ),
      movement("feed-spill", -3, "spill", spill, -1, ACTIVE, "Spilled while filling hoppers"),
      ...issued,
    ],
    weights: [
      {
        id: "weight-21",
        batchId: ACTIVE,
        date: isoOffset(-7),
        shedId: SHED_A,
        sampleSize: 48,
        totalGrams: 48 * 1020,
        zones: "front, middle, back",
        method: "Random catch",
        scale: "Hanging 5 kg",
        note: "",
        sync: "synced",
      },
      {
        id: "weight-27",
        batchId: ACTIVE,
        date: isoOffset(-1),
        shedId: SHED_A,
        sampleSize: 32,
        totalGrams: 32 * 1410,
        zones: "middle",
        method: "Random catch",
        scale: "Hanging 5 kg",
        note: "Shed B was not sampled.",
        sync: "synced",
      },
    ],
    water,
    health: [
      {
        id: "health-1",
        batchId: ACTIVE,
        date: isoOffset(-8),
        shedId: SHED_B,
        signs: "A few birds huddling near the brooder end",
        note: "Recorded as an observation. No treatment entered.",
        sync: "synced",
      },
    ],
    vaccinations: [
      {
        id: "vax-ibd",
        batchId: ACTIVE,
        name: "IBD",
        dueOn: isoOffset(-14),
        givenOn: isoOffset(-14),
        lot: "IBD-2291",
        route: "Drinking water",
        administrator: "Arun Selvam",
        sync: "synced",
      },
      {
        id: "vax-nd",
        batchId: ACTIVE,
        name: "Newcastle (Lasota)",
        dueOn: isoOffset(7),
        givenOn: null,
        lot: "",
        route: "Drinking water",
        administrator: "",
        sync: "synced",
      },
    ],
    biosecurity: [
      {
        id: "bio-1",
        date: isoOffset(-1),
        shedId: SHED_A,
        footwear: true,
        cleaning: true,
        mortalityRemoval: true,
        waterline: false,
        note: "Waterline check left open because of the drip.",
        sync: "synced",
      },
    ],
    visitors: [
      {
        id: "visit-1",
        date: isoOffset(-1),
        name: "Sri Murugan Feeds truck",
        purpose: "Feed delivery",
        vehicle: "TN 30 F 4412",
      },
    ],
    assets: [
      {
        id: "asset-line",
        name: "Drinker line",
        shedId: SHED_A,
        condition: "Leak",
        nextService: isoOffset(2),
      },
      {
        id: "asset-gen",
        name: "Generator",
        shedId: null,
        condition: "Working",
        nextService: isoOffset(12),
      },
    ],
    maintenance: [
      {
        id: "maint-1",
        assetId: "asset-line",
        date: isoOffset(-1),
        issue: "Drip at the third nipple, Shed A",
        status: "open",
        note: "",
        sync: "synced",
      },
    ],
    tasks: [
      {
        id: "task-leak",
        title: "Repair the Shed A drinker drip",
        detail: "Third nipple is dripping. Litter underneath is damp.",
        severity: "urgent",
        status: "open",
        assignee: "Karthik R.",
        due: isoOffset(0),
        shedId: SHED_A,
      },
      {
        id: "task-round",
        title: "Finish today's farm round",
        detail: "Mortality, feed, and water are still open for today.",
        severity: "due",
        status: "open",
        assignee: "Karthik R.",
        due: isoOffset(0),
        shedId: SHED_A,
      },
      {
        id: "task-feed",
        title: "Place the next feed order",
        detail: "Runway is inside a week. Confirm quantity with the owner.",
        severity: "attention",
        status: "open",
        assignee: "Arun Selvam",
        due: isoOffset(1),
        shedId: null,
      },
    ],
    alerts: [
      {
        id: "alert-mort",
        severity: "urgent",
        title: "Mortality jumped yesterday",
        why: "22 birds were recorded, above the days around it.",
        evidence: "Daily Farm Round, yesterday, Shed A. Cause was not classified.",
        coverage: "Partial — today is not recorded yet.",
        action: "Walk the shed and record today's count before treating the spike as a trend.",
        status: "open",
      },
      {
        id: "alert-feed",
        severity: "attention",
        title: "Feed runway is short",
        why: "Confirmed recent use will empty the recorded stock in a few days.",
        evidence: "Stock and issued feed from the ledger. Missing days are excluded from the average.",
        coverage: "Partial",
        action: "Review the purchase plan. Ordering does not change stock.",
        status: "open",
      },
      {
        id: "alert-line",
        severity: "attention",
        title: "Drinker line is still leaking",
        why: "A damp patch can spoil litter and waste water.",
        evidence: "Open maintenance event on the drinker line.",
        coverage: "Recorded",
        action: "Assign the repair and note when the drip stops.",
        status: "open",
      },
      {
        id: "alert-vax",
        severity: "due",
        title: "Newcastle vaccination is due in 7 days",
        why: "The schedule has a due date and no given date.",
        evidence: "Vaccination schedule for this batch.",
        coverage: "Recorded",
        action: "Prepare the lot number and the person who will administer it.",
        status: "open",
      },
    ],
    dispatches: [],
    settlements: [],
    expenses: [
      {
        id: "exp-chicks",
        date: isoOffset(-27),
        party: "Venkateshwara Hatcheries",
        description: "Chick invoice",
        amountPaise: 26_000_000,
        kind: "invoice",
        batchId: ACTIVE,
      },
      {
        id: "exp-feed",
        date: isoOffset(-10),
        party: "Sri Murugan Feeds",
        description: "Feed invoice",
        amountPaise: 48_500_000,
        kind: "invoice",
        batchId: ACTIVE,
      },
      {
        id: "exp-litter",
        date: isoOffset(-26),
        party: "Local litter yard",
        description: "Litter, paid in cash",
        amountPaise: 1_850_000,
        kind: "cash",
        batchId: ACTIVE,
      },
    ],
    payments: [
      {
        id: "pay-chicks",
        date: isoOffset(-20),
        party: "Venkateshwara Hatcheries",
        amountPaise: 20_000_000,
        note: "Part payment",
      },
      {
        id: "pay-feed",
        date: isoOffset(-8),
        party: "Sri Murugan Feeds",
        amountPaise: 30_000_000,
        note: "Part payment",
      },
    ],
    sales: [],
    receipts: [],
    contras: [
      {
        id: "contra-1",
        party: "Sri Murugan Feeds",
        amountPaise: 2_500_000,
        status: "proposed",
        note: "Proposed set-off. It does not change dues until the owner applies it.",
      },
    ],
    suppliers: [
      {
        id: "sup-vh",
        name: "Venkateshwara Hatcheries",
        contact: "98400 11021",
        products: "Day-old chicks",
        terms: "15 days",
      },
      {
        id: "sup-feed",
        name: "Sri Murugan Feeds",
        contact: "94433 22810",
        products: "Broiler finisher",
        terms: "7 days",
      },
    ],
    buyers: [
      {
        id: "buyer-kovai",
        name: "Kovai Fresh Mart",
        contact: "98430 55190",
        note: "No sale recorded for the active batch.",
      },
    ],
    plans: [
      {
        id: "plan-feed",
        item: "Broiler finisher",
        quantity: "2,000 kg",
        supplier: "Sri Murugan Feeds",
        neededBecause: "Recorded stock covers only a few days of recent use.",
        status: "suggested",
        eta: isoOffset(2),
      },
    ],
    team: [
      { id: "user-owner", name: "Manikanth", role: "owner", shed: "All sheds", status: "active", passcode: "Mani@12345" },
      { id: "user-manager", name: "Arun Selvam", role: "manager", shed: "All sheds", status: "active", passcode: "demo1234" },
      { id: "user-k", name: "Karthik R.", role: "worker", shed: "Shed A · East", status: "active", passcode: "demo1234" },
      { id: "user-d", name: "Divya M.", role: "worker", shed: "Shed B · West", status: "active", passcode: "demo1234" },
    ],
    sops: [
      {
        id: "sop-round",
        title: "Daily Farm Round",
        steps: [
          "Confirm the active batch and shed.",
          "Enter mortality and culls. Zero is a count. Leave Not recorded if you did not count.",
          "Enter feed issued and water used.",
          "Note flock and litter, then save.",
        ],
      },
      {
        id: "sop-feed",
        title: "Feed issue",
        steps: [
          "Issue feed against the batch.",
          "Record spill, pests, or moisture as their own reasons.",
          "A purchase plan does not add stock.",
        ],
      },
      {
        id: "sop-visitor",
        title: "Visitor entry",
        steps: [
          "Write the name, purpose, and vehicle before the person enters.",
          "Check footwear.",
          "Keep the entry even if the visit is short.",
        ],
      },
    ],
    onboarding: { status: "completed", draft: null },
  }
}

export function createEmptyWorkspace(owner: TeamMember): FarmState {
  return {
    version: 1,
    role: owner.role,
    currentUserId: owner.id,
    activeBatchId: "",
    settings: {
      farmName: "",
      location: "",
      notifications: true,
      timezone: "Asia/Kolkata",
      feedUnit: "kg",
      defaultBagKg: null,
    },
    sheds: [],
    batches: [],
    rounds: [],
    mortality: [],
    culls: [],
    transfers: [],
    feed: [],
    weights: [],
    water: [],
    health: [],
    vaccinations: [],
    biosecurity: [],
    visitors: [],
    assets: [],
    maintenance: [],
    tasks: [],
    alerts: [],
    dispatches: [],
    settlements: [],
    expenses: [],
    payments: [],
    sales: [],
    receipts: [],
    contras: [],
    suppliers: [],
    buyers: [],
    plans: [],
    team: [owner],
    sops: [],
    onboarding: { status: "not_started", draft: null },
  }
}

export function deriveAllocations(shedIds: string[], placed: number): BatchAllocation[] {
  if (shedIds.length === 0) return []
  if (shedIds.length === 1) return [{ shedId: shedIds[0], count: placed }]
  const base = Math.floor(placed / shedIds.length)
  const remainder = placed - base * shedIds.length
  return shedIds.map((shedId, index) => ({
    shedId,
    count: index === 0 ? base + remainder : base,
  }))
}
