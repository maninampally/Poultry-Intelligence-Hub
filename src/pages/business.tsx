import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Fact, MoneyGate, PageHeader, StatusPill } from "@/components/farm/chrome"
import { financeOf } from "@/domain/finance"
import { formatDay, formatInr, formatNumber, formatWhen, todayISO } from "@/domain/format"
import type { PurchasePlan } from "@/domain/types"
import { newId, useFarm } from "@/store/farm-store"

export function FinancePage() {
  const farm = useFarm()
  return (
    <MoneyGate role={farm.role}>
      <FinanceBody />
    </MoneyGate>
  )
}

function FinanceBody() {
  const farm = useFarm()
  const money = financeOf(farm.state)
  const [party, setParty] = useState("Sri Murugan Feeds")
  const [amount, setAmount] = useState("")
  const contra = farm.contras[0]

  function addExpense() {
    const parsed = z.coerce.number().positive().safeParse(amount)
    if (!parsed.success) {
      toast.error("Enter an amount in rupees.")
      return
    }
    farm.dispatch({
      type: "add-expense",
      expense: {
        id: newId("exp"),
        date: todayISO(),
        party,
        description: "Recorded expense",
        amountPaise: Math.round(parsed.data * 100),
        kind: "invoice",
        batchId: farm.batch?.id ?? "",
      },
    })
    setAmount("")
    toast.success("Invoice saved on the ledger.")
  }

  function advanceContra() {
    if (!contra) return
    if (contra.status === "proposed") {
      farm.dispatch({ type: "set-contra", id: contra.id, status: "approved" })
      toast.success("Contra approved. Dues are unchanged until it is applied.")
      return
    }
    if (contra.status === "approved") {
      if (money.sales <= 0) {
        toast.error("Apply this after a buyer balance exists. It is not auto-netted.")
        return
      }
      farm.dispatch({ type: "set-contra", id: contra.id, status: "applied" })
      toast.success("Contra applied to supplier due and buyer due.")
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Finance"
        description="Invoices, payments, and dues stay explicit. Estimated net is labelled as an estimate."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Money label="Recorded cost" value={formatInr(money.recordedCost)} hint="Invoices plus cash expenses" />
        <Money label="Supplier due" value={formatInr(money.supplierDue)} hint="Invoices − payments − applied contra" />
        <Money label="Buyer due" value={formatInr(money.buyerDue)} hint="Sales − receipts − applied contra" />
        <Money label="Estimated net" value={formatInr(money.estimatedNet)} hint="Partial · no sale recorded yet" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ledger lines</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {farm.expenses.map((expense) => (
              <Fact
                key={expense.id}
                label={`${formatDay(expense.date)} · ${expense.party}`}
                value={formatInr(expense.amountPaise)}
              />
            ))}
            {farm.payments.map((payment) => (
              <Fact
                key={payment.id}
                label={`${formatDay(payment.date)} · paid ${payment.party}`}
                value={formatInr(-payment.amountPaise)}
              />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add an invoice</CardTitle>
            <CardDescription>Cash position is receipts minus payments and cash expenses.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Fact label="Cash position" value={formatInr(money.cashPosition)} />
            <Label htmlFor="party">Party</Label>
            <Input id="party" className="h-11" value={party} onChange={(event) => setParty(event.target.value)} />
            <Label htmlFor="rupees">Amount (₹)</Label>
            <Input id="rupees" className="h-12" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Button className="h-11" onClick={addExpense}>Save invoice</Button>
            {contra ? (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Contra · {contra.party}</p>
                <p className="text-muted-foreground">{contra.note}</p>
                <p className="mt-1">
                  {formatInr(contra.amountPaise)} · <StatusPill>{contra.status}</StatusPill>
                </p>
                {contra.status === "proposed" || contra.status === "approved" ? (
                  <Button variant="outline" className="mt-2 h-10" onClick={advanceContra}>
                    {contra.status === "proposed" ? "Approve" : "Apply"}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SalesPage() {
  const farm = useFarm()
  return (
    <MoneyGate role={farm.role}>
      <SalesBody />
    </MoneyGate>
  )
}

function SalesBody() {
  const farm = useFarm()
  const [buyer, setBuyer] = useState(farm.buyers[0]?.name ?? "")
  const [amount, setAmount] = useState("")
  const [receipt, setReceipt] = useState("")

  function addSale() {
    const parsed = z.coerce.number().positive().safeParse(amount)
    if (!parsed.success) {
      toast.error("Enter the sale amount in rupees.")
      return
    }
    farm.dispatch({
      type: "add-sale",
      sale: {
        id: newId("sale"),
        date: todayISO(),
        buyer,
        amountPaise: Math.round(parsed.data * 100),
        birds: null,
        dispatchId: farm.dispatches[0]?.id ?? null,
        note: "Sale does not change live birds. Link a dispatch separately.",
      },
    })
    setAmount("")
    toast.success("Sale saved. Live birds are unchanged.")
  }

  function addReceipt() {
    const parsed = z.coerce.number().positive().safeParse(receipt)
    if (!parsed.success) {
      toast.error("Enter the receipt amount in rupees.")
      return
    }
    farm.dispatch({
      type: "add-receipt",
      receipt: {
        id: newId("receipt"),
        date: todayISO(),
        buyer,
        amountPaise: Math.round(parsed.data * 100),
        note: "Buyer receipt",
      },
    })
    setReceipt("")
    toast.success("Receipt saved.")
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Sales"
        description="A sale is money. Birds leave the farm only through a dispatch or another bird movement."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record a sale</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label>Buyer</Label>
            <Select value={buyer} onValueChange={setBuyer}>
              <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {farm.buyers.map((item) => (
                  <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="sale-amt">Amount (₹)</Label>
            <Input id="sale-amt" className="h-12" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Button className="h-11" onClick={addSale}>Save sale</Button>
            {farm.sales.map((sale) => (
              <p key={sale.id} className="text-sm">{formatDay(sale.date)} · {sale.buyer} · {formatInr(sale.amountPaise)}</p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Buyer receipt</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label htmlFor="receipt-amt">Amount (₹)</Label>
            <Input id="receipt-amt" className="h-12" value={receipt} onChange={(event) => setReceipt(event.target.value)} />
            <Button className="h-11" onClick={addReceipt}>Save receipt</Button>
            {farm.receipts.length === 0 ? <p className="text-sm text-muted-foreground">No receipts yet.</p> : null}
            {farm.receipts.map((item) => (
              <p key={item.id} className="text-sm">{formatDay(item.date)} · {formatInr(item.amountPaise)}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SuppliersPage() {
  const farm = useFarm()
  return (
    <MoneyGate role={farm.role}>
      <div>
        <PageHeader eyebrow="Business" title="Suppliers" description="Contacts, products, and credit terms." />
        <div className="grid gap-3 md:grid-cols-2">
          {farm.suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardHeader>
                <CardTitle>{supplier.name}</CardTitle>
                <CardDescription>{supplier.products}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{supplier.contact}</p>
                <p className="text-muted-foreground">Credit terms · {supplier.terms}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MoneyGate>
  )
}

export function BuyersPage() {
  const farm = useFarm()
  return (
    <MoneyGate role={farm.role}>
      <div>
        <PageHeader eyebrow="Business" title="Buyers" description="Sales history starts when a sale is recorded." />
        <div className="grid gap-3">
          {farm.buyers.map((buyer) => (
            <Card key={buyer.id}>
              <CardHeader>
                <CardTitle>{buyer.name}</CardTitle>
                <CardDescription>{buyer.contact}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{buyer.note}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MoneyGate>
  )
}

export function PlansPage() {
  const farm = useFarm()
  return (
    <MoneyGate role={farm.role}>
      <PlansBody />
    </MoneyGate>
  )
}

function PlansBody() {
  const farm = useFarm()
  function setStatus(id: string, status: PurchasePlan["status"]) {
    farm.dispatch({ type: "set-plan-status", id, status })
    toast.success("Purchase plan updated. Stock is unchanged.")
  }
  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Purchase plans"
        description="A plan is a suggestion. Receiving stock is a feed movement."
      />
      <div className="grid gap-3">
        {farm.plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.item}</CardTitle>
              <CardDescription>{plan.neededBecause}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{plan.quantity} · {plan.supplier} · ETA {formatDay(plan.eta)}</p>
              <StatusPill>{plan.status}</StatusPill>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10" onClick={() => setStatus(plan.id, "ordered")}>Mark ordered</Button>
                <Button className="h-10" onClick={() => setStatus(plan.id, "received")}>Mark received</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ReportsPage() {
  const farm = useFarm()
  return (
    <MoneyGate role={farm.role}>
      <div>
        <PageHeader
          eyebrow="Business"
          title="Reports"
          description="Every figure says whether it was recorded, calculated, or still missing."
        />
        <Card>
          <CardHeader>
            <CardTitle>Batch summary</CardTitle>
            <CardDescription>
              Generated {formatWhen()} · scope {farm.batch?.code} · {farm.settings.farmName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><StatusPill tone="good">Recorded</StatusPill> Live birds {formatNumber(farm.live)}</p>
            <p><StatusPill>Calculated from recorded data</StatusPill> Estimated FCR {farm.fcr === null ? "Unknown" : formatNumber(farm.fcr, 2)}</p>
            <p><StatusPill tone="warn">Partial data</StatusPill> Coverage {farm.completeness.label} · {farm.completeness.recorded}/{farm.completeness.expected} fields</p>
            <p><StatusPill tone={farm.sales.length ? "good" : "warn"}>{farm.sales.length ? "Recorded" : "Missing data"}</StatusPill> Sale value {farm.sales.length ? "entered" : "not recorded"}</p>
            <p className="text-muted-foreground">
              FCR uses confirmed feed divided by live birds times the latest sample. Days without feed are excluded, not treated as zero.
            </p>
          </CardContent>
        </Card>
      </div>
    </MoneyGate>
  )
}

function Money({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-display text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
    </Card>
  )
}
