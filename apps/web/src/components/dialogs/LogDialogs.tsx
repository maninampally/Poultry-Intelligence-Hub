import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogMortality,
  useLogFeed,
  useLogWeight,
  useLogCost,
  useLogVaccination,
  useLogSale,
  getGetBatchSummaryQueryKey,
  getListMortalityQueryKey,
  getGetMortalityTrendQueryKey,
  getListFeedQueryKey,
  getGetFcrTrendQueryKey,
  getListWeightQueryKey,
  getGetGrowthCurveQueryKey,
  getListCostsQueryKey,
  getGetCostSummaryQueryKey,
  getListVaccinationsQueryKey,
  getGetVaccinationScheduleQueryKey,
  getListSalesQueryKey,
  getGetInsightsQueryKey,
  getListBatchesQueryKey,
  getGetDashboardOverviewQueryKey,
  getGetDashboardActivityQueryKey,
  getListAlertsQueryKey,
} from "@murgi-mitra/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const todayDate = () => new Date().toISOString().slice(0, 10);
const currentShift = () => {
  const h = new Date().getHours();
  return h < 12 ? "morning" : "evening";
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>, batchId: string) {
  qc.invalidateQueries({ queryKey: getGetBatchSummaryQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListMortalityQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getGetMortalityTrendQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListFeedQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getGetFcrTrendQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListWeightQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getGetGrowthCurveQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListCostsQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getGetCostSummaryQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListVaccinationsQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getGetVaccinationScheduleQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListSalesQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getGetInsightsQueryKey(batchId) });
  qc.invalidateQueries({ queryKey: getListBatchesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardActivityQueryKey() });
  qc.invalidateQueries({ queryKey: getListAlertsQueryKey() });
}

export function LogMortalityDialog({ open, onOpenChange, batchId, shedId }: { open: boolean; onOpenChange: (b: boolean) => void; batchId: string; shedId: string }) {
  const [date, setDate] = useState(todayDate());
  const [shift, setShift] = useState<"morning" | "evening">(currentShift());
  const [count, setCount] = useState("0");
  const [cause, setCause] = useState("unknown");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useLogMortality({
    mutation: {
      onSuccess: () => {
        toast({ title: "Mortality logged", description: `${count} birds recorded.` });
        invalidateAll(qc, batchId);
        onOpenChange(false);
        setCount("0"); setNotes("");
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log mortality</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" data-testid="input-mortality-date" /></div>
            <div><Label className="text-xs">Shift</Label>
              <Select value={shift} onValueChange={(v) => setShift(v as "morning" | "evening")}>
                <SelectTrigger className="mt-1" data-testid="select-mortality-shift"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="morning">Morning</SelectItem><SelectItem value="evening">Evening</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Bird count</Label><Input type="number" min="0" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className="mt-1 text-2xl tabular h-14" data-testid="input-mortality-count" /></div>
          <div><Label className="text-xs">Suspected cause</Label>
            <Select value={cause} onValueChange={setCause}>
              <SelectTrigger className="mt-1" data-testid="select-mortality-cause"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="respiratory">Respiratory</SelectItem>
                <SelectItem value="heat_stress">Heat stress</SelectItem>
                <SelectItem value="ascites">Ascites</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" data-testid="input-mortality-notes" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            data-testid="button-submit-mortality"
            disabled={m.isPending}
            onClick={() => m.mutate({ batchId, data: { shedId, date: new Date(date).toISOString(), shift, count: parseInt(count, 10), cause: cause as "unknown" | "respiratory" | "heat_stress" | "ascites" | "other", notes: notes || null } })}
          >{m.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogFeedDialog({ open, onOpenChange, batchId, shedId }: { open: boolean; onOpenChange: (b: boolean) => void; batchId: string; shedId: string }) {
  const [date, setDate] = useState(todayDate());
  const [shift, setShift] = useState<"morning" | "afternoon" | "evening">(currentShift());
  const [feedType, setFeedType] = useState<"pre_starter" | "starter" | "grower" | "finisher">("grower");
  const [brand, setBrand] = useState("Godrej Real Good");
  const [bag, setBag] = useState("");
  const [given, setGiven] = useState("0");
  const [returned, setReturned] = useState("0");
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useLogFeed({
    mutation: {
      onSuccess: () => {
        toast({ title: "Feed logged" });
        invalidateAll(qc, batchId);
        onOpenChange(false);
        setGiven("0"); setReturned("0"); setBag("");
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log feed</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" data-testid="input-feed-date" /></div>
            <div><Label className="text-xs">Shift</Label>
              <Select value={shift} onValueChange={(v) => setShift(v as typeof shift)}>
                <SelectTrigger className="mt-1" data-testid="select-feed-shift"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Feed type</Label>
            <Select value={feedType} onValueChange={(v) => setFeedType(v as typeof feedType)}>
              <SelectTrigger className="mt-1" data-testid="select-feed-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_starter">Pre-starter (0–7 d)</SelectItem>
                <SelectItem value="starter">Starter (8–14 d)</SelectItem>
                <SelectItem value="grower">Grower (15–24 d)</SelectItem>
                <SelectItem value="finisher">Finisher (25+ d)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Brand</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1" data-testid="input-feed-brand" /></div>
            <div><Label className="text-xs">Bag #</Label><Input value={bag} onChange={(e) => setBag(e.target.value)} className="mt-1" data-testid="input-feed-bag" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Given (kg)</Label><Input type="number" inputMode="decimal" value={given} onChange={(e) => setGiven(e.target.value)} className="mt-1 text-xl tabular h-12" data-testid="input-feed-given" /></div>
            <div><Label className="text-xs">Returned (kg)</Label><Input type="number" inputMode="decimal" value={returned} onChange={(e) => setReturned(e.target.value)} className="mt-1 text-xl tabular h-12" data-testid="input-feed-returned" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="button-submit-feed" disabled={m.isPending} onClick={() => m.mutate({ batchId, data: { shedId, date: new Date(date).toISOString(), shift, feedType, feedBrand: brand || null, bagNumber: bag || null, kgGiven: parseFloat(given), kgReturned: parseFloat(returned) || 0 } })}>{m.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogWeightDialog({ open, onOpenChange, batchId, shedId }: { open: boolean; onOpenChange: (b: boolean) => void; batchId: string; shedId: string }) {
  const [date, setDate] = useState(todayDate());
  const [sample, setSample] = useState("50");
  const [total, setTotal] = useState("0");
  const qc = useQueryClient();
  const { toast } = useToast();
  const avg = useMemo(() => {
    const t = parseFloat(total); const s = parseInt(sample, 10);
    return s > 0 && !isNaN(t) ? (t / s).toFixed(3) : "—";
  }, [total, sample]);
  const m = useLogWeight({
    mutation: {
      onSuccess: () => {
        toast({ title: "Weight sample logged" });
        invalidateAll(qc, batchId);
        onOpenChange(false);
        setTotal("0");
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log weight sample</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" data-testid="input-weight-date" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Sample size</Label><Input type="number" inputMode="numeric" value={sample} onChange={(e) => setSample(e.target.value)} className="mt-1 tabular" data-testid="input-weight-sample" /></div>
            <div><Label className="text-xs">Total weight (kg)</Label><Input type="number" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} className="mt-1 tabular" data-testid="input-weight-total" /></div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Average: </span>
            <span className="font-bold tabular text-foreground" data-testid="text-weight-avg">{avg} kg</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="button-submit-weight" disabled={m.isPending} onClick={() => m.mutate({ batchId, data: { shedId, date: new Date(date).toISOString(), sampleSize: parseInt(sample, 10), totalWeightKg: parseFloat(total) } })}>{m.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogCostDialog({ open, onOpenChange, batchId }: { open: boolean; onOpenChange: (b: boolean) => void; batchId: string }) {
  const [date, setDate] = useState(todayDate());
  const [category, setCategory] = useState("feed");
  const [sub, setSub] = useState("");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useLogCost({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cost added" });
        invalidateAll(qc, batchId);
        onOpenChange(false);
        setAmount("0"); setSub(""); setNote("");
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log expense</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" data-testid="input-cost-date" /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1" data-testid="select-cost-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chick">Chick</SelectItem>
                  <SelectItem value="feed">Feed</SelectItem>
                  <SelectItem value="medicine">Medicine</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="misc">Misc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label className="text-xs">Detail</Label><Input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="e.g. Compound feed - 50kg bag" className="mt-1" data-testid="input-cost-sub" /></div>
          <div><Label className="text-xs">Amount (₹)</Label><Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 text-2xl tabular h-14" data-testid="input-cost-amount" /></div>
          <div><Label className="text-xs">Note</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" data-testid="input-cost-note" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="button-submit-cost" disabled={m.isPending} onClick={() => m.mutate({ batchId, data: { category: category as "chick" | "feed" | "medicine" | "labor" | "utilities" | "equipment" | "misc", subCategory: sub || category, amount: parseFloat(amount), date: new Date(date).toISOString(), note: note || null, quantity: null, unit: null } })}>{m.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogVaccinationDialog({ open, onOpenChange, batchId, defaultName = "" }: { open: boolean; onOpenChange: (b: boolean) => void; batchId: string; defaultName?: string }) {
  const [date, setDate] = useState(todayDate());
  const [name, setName] = useState(defaultName);
  const [doseNumber, setDoseNumber] = useState("1");
  const [route, setRoute] = useState("Drinking water");
  const [admin, setAdmin] = useState("Dr. Suresh Kumar");
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useLogVaccination({
    mutation: {
      onSuccess: () => {
        toast({ title: "Vaccination logged" });
        invalidateAll(qc, batchId);
        onOpenChange(false);
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log vaccination</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Vaccine</Label><Input value={name || defaultName} onChange={(e) => setName(e.target.value)} placeholder="e.g. Newcastle Disease (LaSota)" className="mt-1" data-testid="input-vacc-name" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Date given</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" data-testid="input-vacc-date" /></div>
            <div><Label className="text-xs">Dose #</Label><Input type="number" min="1" value={doseNumber} onChange={(e) => setDoseNumber(e.target.value)} className="mt-1 tabular" data-testid="input-vacc-dose" /></div>
          </div>
          <div><Label className="text-xs">Route</Label>
            <Select value={route} onValueChange={setRoute}>
              <SelectTrigger className="mt-1" data-testid="select-vacc-route"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Drinking water">Drinking water</SelectItem>
                <SelectItem value="Eye drop">Eye drop</SelectItem>
                <SelectItem value="Subcutaneous">Subcutaneous</SelectItem>
                <SelectItem value="Spray">Spray</SelectItem>
                <SelectItem value="Wing-web">Wing-web</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Administered by</Label><Input value={admin} onChange={(e) => setAdmin(e.target.value)} className="mt-1" data-testid="input-vacc-admin" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="button-submit-vacc" disabled={m.isPending || !(name || defaultName)} onClick={() => m.mutate({ batchId, data: { vaccineName: name || defaultName, doseDate: new Date(date).toISOString(), doseNumber: parseInt(doseNumber, 10), route, administeredBy: admin || null, batchNo: null, cost: null } })}>{m.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogSaleDialog({ open, onOpenChange, batchId }: { open: boolean; onOpenChange: (b: boolean) => void; batchId: string }) {
  const [date, setDate] = useState(todayDate());
  const [birds, setBirds] = useState("0");
  const [weight, setWeight] = useState("0");
  const [price, setPrice] = useState("110");
  const [buyer, setBuyer] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const m = useLogSale({
    mutation: {
      onSuccess: () => {
        toast({ title: "Sale recorded" });
        invalidateAll(qc, batchId);
        onOpenChange(false);
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });
  const revenue = useMemo(() => {
    const w = parseFloat(weight); const p = parseFloat(price);
    return !isNaN(w) && !isNaN(p) ? w * p : 0;
  }, [weight, price]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record sale</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div><Label className="text-xs">Sale date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" data-testid="input-sale-date" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Birds sold</Label><Input type="number" inputMode="numeric" value={birds} onChange={(e) => setBirds(e.target.value)} className="mt-1 tabular" data-testid="input-sale-birds" /></div>
            <div><Label className="text-xs">Total wt (kg)</Label><Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 tabular" data-testid="input-sale-weight" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Price ₹/kg</Label><Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 tabular" data-testid="input-sale-price" /></div>
            <div><Label className="text-xs">Buyer</Label><Input value={buyer} onChange={(e) => setBuyer(e.target.value)} className="mt-1" placeholder="e.g. Local mandi" data-testid="input-sale-buyer" /></div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Revenue: </span>
            <span className="font-bold tabular text-foreground" data-testid="text-sale-revenue">₹{revenue.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="button-submit-sale" disabled={m.isPending} onClick={() => m.mutate({ batchId, data: { saleDate: new Date(date).toISOString(), birdsSold: parseInt(birds, 10), totalWeightKg: parseFloat(weight), pricePerKg: parseFloat(price), buyer: buyer || "Unknown" } })}>{m.isPending ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
