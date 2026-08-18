import { useState } from "react";
import { Link, useRoute } from "wouter";
import {
  useGetBatch,
  useGetBatchSummary,
  useListMortality,
  useGetMortalityTrend,
  useListFeed,
  useGetFcrTrend,
  useListWeight,
  useGetGrowthCurve,
  useListCosts,
  useGetCostSummary,
  useListVaccinations,
  useGetVaccinationSchedule,
  useListSales,
  getGetBatchQueryKey,
  getGetBatchSummaryQueryKey,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bird,
  HeartPulse,
  Wheat,
  Scale,
  IndianRupee,
  Syringe,
  ShoppingCart,
  Plus,
  Sparkles,
  ChevronLeft,
  Calendar,
  Activity,
  FileText,
  Calculator,
} from "lucide-react";
import { formatINR, formatINRShort, formatNumber, formatPct, formatKg, formatDate, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { MortalityBars, FcrLine, GrowthCurveChart, CostDonut, CostHistoryArea } from "@/components/charts";
import {
  LogMortalityDialog,
  LogFeedDialog,
  LogWeightDialog,
  LogCostDialog,
  LogVaccinationDialog,
  LogSaleDialog,
} from "@/components/dialogs/LogDialogs";
import { cn } from "@/lib/utils";

const causeLabel: Record<string, string> = {
  unknown: "Unknown",
  respiratory: "Respiratory",
  heat_stress: "Heat stress",
  ascites: "Ascites",
  other: "Other",
};

const feedTypeLabel: Record<string, string> = {
  pre_starter: "Pre-starter",
  starter: "Starter",
  grower: "Grower",
  finisher: "Finisher",
};

const costCatLabel: Record<string, string> = {
  chick: "Chick",
  feed: "Feed",
  medicine: "Medicine",
  labor: "Labor",
  utilities: "Utilities",
  equipment: "Equipment",
  misc: "Misc",
};

export default function BatchDetail() {
  const [, params] = useRoute("/batches/:batchId");
  const batchId = params?.batchId ?? "";
  const { t } = useLang();
  const [tab, setTab] = useState("summary");

  const { data: batch } = useGetBatch(batchId, { query: { queryKey: getGetBatchQueryKey(batchId), enabled: !!batchId } });
  const { data: summary, isLoading } = useGetBatchSummary(batchId, { query: { queryKey: getGetBatchSummaryQueryKey(batchId), enabled: !!batchId } });

  // Dialog states
  const [openMort, setOpenMort] = useState(false);
  const [openFeed, setOpenFeed] = useState(false);
  const [openWeight, setOpenWeight] = useState(false);
  const [openCost, setOpenCost] = useState(false);
  const [openVacc, setOpenVacc] = useState(false);
  const [openSale, setOpenSale] = useState(false);
  const [vaccPrefill, setVaccPrefill] = useState("");

  if (isLoading || !batch || !summary) {
    return (
      <AppShell>
        <div className="p-8 max-w-[1400px] mx-auto">
          <Skeleton className="h-12 w-64 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }

  const shedId = batch.shedId;
  const healthTone = summary.healthScore >= 80 ? "good" : summary.healthScore >= 60 ? "warn" : "bad";

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <Link href="/batches" asChild>
          <a className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 hover-elevate -ml-2 px-2 py-1 rounded-md" data-testid="link-back-batches">
            <ChevronLeft className="h-3.5 w-3.5" /> {t("All batches", "सभी बैच")}
          </a>
        </Link>

        <PageHeader
          title={batch.batchCode}
          subtitle={
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <StatusBadge status={batch.status} />
              <span>{summary.farmName} · {summary.shedName}</span>
              <span>·</span>
              <span>{batch.breed}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {t("Day", "दिन")} {summary.dayOfBatch} · {t("Started", "शुरू")} {formatDate(batch.startDate)}</span>
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Link href={`/batches/${batchId}/report`} asChild>
                <a><Button variant="outline" className="gap-1.5" data-testid="link-batch-report"><FileText className="h-4 w-4" />{t("Closure report", "समापन रिपोर्ट")}</Button></a>
              </Link>
              <Link href={`/insights/${batchId}`} asChild>
                <a><Button variant="outline" className="gap-1.5" data-testid="link-batch-insights"><Sparkles className="h-4 w-4" />{t("Insights", "सलाह")}</Button></a>
              </Link>
              <Link href={`/planner?batchId=${batchId}`} asChild>
                <a><Button variant="outline" className="gap-1.5" data-testid="link-batch-planner"><Calculator className="h-4 w-4" />{t("What-if planner", "क्या-अगर योजना")}</Button></a>
              </Link>
            </div>
          }
        />

        {/* Health hero */}
        <div className="rounded-xl border bg-gradient-to-br from-card to-primary/5 p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Health score", "स्वास्थ्य अंक")}</div>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className={cn("text-5xl sm:text-6xl font-bold tabular leading-none", healthTone === "good" ? "text-[hsl(142,46%,30%)]" : healthTone === "warn" ? "text-[hsl(28,80%,40%)]" : "text-destructive")} data-testid="text-health-score">
                  {summary.healthScore}
                </span>
                <span className="text-lg text-muted-foreground">/100</span>
                <StatusBadge status={healthTone} className="ml-1" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setOpenMort(true)} data-testid="button-quick-mortality" className="gap-1.5"><HeartPulse className="h-3.5 w-3.5" />{t("Mortality", "मृत्यु")}</Button>
              <Button size="sm" variant="outline" onClick={() => setOpenFeed(true)} data-testid="button-quick-feed" className="gap-1.5"><Wheat className="h-3.5 w-3.5" />{t("Feed", "दाना")}</Button>
              <Button size="sm" variant="outline" onClick={() => setOpenWeight(true)} data-testid="button-quick-weight" className="gap-1.5"><Scale className="h-3.5 w-3.5" />{t("Weight", "वज़न")}</Button>
              <Button size="sm" variant="outline" onClick={() => setOpenCost(true)} data-testid="button-quick-cost" className="gap-1.5"><IndianRupee className="h-3.5 w-3.5" />{t("Cost", "खर्च")}</Button>
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard testId="stat-flock" tone="primary" label={t("Live flock", "जीवित पक्षी")} icon={Bird} value={formatNumber(summary.currentFlock)} hint={`of ${formatNumber(batch.placementCount)} placed`} />
          <StatCard testId="stat-mort" tone={summary.mortalityPct > 5 ? "bad" : summary.mortalityPct > 3 ? "warn" : "good"} label={t("Mortality", "मृत्यु दर")} icon={HeartPulse} value={formatPct(summary.mortalityPct, 2)} hint={`${summary.mortalityToday} ${t("today", "आज")}`} />
          <StatCard testId="stat-fcr-batch" tone={summary.fcr > 1.95 ? "bad" : summary.fcr > 1.8 ? "warn" : "good"} label="FCR" icon={Wheat} value={summary.fcr.toFixed(2)} hint={`${formatKg(summary.feedConsumedTotal, 0)} ${t("total feed", "कुल दाना")}`} />
          <StatCard testId="stat-weight" tone={Math.abs(summary.weightDeviationPct) < 5 ? "good" : summary.weightDeviationPct < 0 ? "warn" : "primary"} label={t("Avg. weight", "औसत वज़न")} icon={Scale} value={`${summary.avgWeight.toFixed(2)} kg`} hint={`${summary.weightDeviationPct >= 0 ? "+" : ""}${summary.weightDeviationPct.toFixed(1)}% ${t("vs Cobb", "मानक से")}`} />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap whitespace-nowrap">
            <TabsTrigger value="summary" data-testid="tab-summary"><Activity className="h-3.5 w-3.5 mr-1.5" />{t("Summary", "सारांश")}</TabsTrigger>
            <TabsTrigger value="mortality" data-testid="tab-mortality"><HeartPulse className="h-3.5 w-3.5 mr-1.5" />{t("Mortality", "मृत्यु")}</TabsTrigger>
            <TabsTrigger value="feed" data-testid="tab-feed"><Wheat className="h-3.5 w-3.5 mr-1.5" />{t("Feed", "दाना")}</TabsTrigger>
            <TabsTrigger value="weight" data-testid="tab-weight"><Scale className="h-3.5 w-3.5 mr-1.5" />{t("Weight", "वज़न")}</TabsTrigger>
            <TabsTrigger value="cost" data-testid="tab-cost"><IndianRupee className="h-3.5 w-3.5 mr-1.5" />{t("Costs", "खर्च")}</TabsTrigger>
            <TabsTrigger value="vaccine" data-testid="tab-vaccine"><Syringe className="h-3.5 w-3.5 mr-1.5" />{t("Vaccines", "टीके")}</TabsTrigger>
            <TabsTrigger value="sale" data-testid="tab-sale"><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />{t("Sales", "बिक्री")}</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-5">
            <SummaryTab batchId={batchId} />
          </TabsContent>
          <TabsContent value="mortality" className="mt-5">
            <MortalityTab batchId={batchId} onLog={() => setOpenMort(true)} />
          </TabsContent>
          <TabsContent value="feed" className="mt-5">
            <FeedTab batchId={batchId} onLog={() => setOpenFeed(true)} />
          </TabsContent>
          <TabsContent value="weight" className="mt-5">
            <WeightTab batchId={batchId} onLog={() => setOpenWeight(true)} />
          </TabsContent>
          <TabsContent value="cost" className="mt-5">
            <CostTab batchId={batchId} onLog={() => setOpenCost(true)} />
          </TabsContent>
          <TabsContent value="vaccine" className="mt-5">
            <VaccineTab batchId={batchId} onLog={(name) => { setVaccPrefill(name); setOpenVacc(true); }} />
          </TabsContent>
          <TabsContent value="sale" className="mt-5">
            <SaleTab batchId={batchId} onLog={() => setOpenSale(true)} />
          </TabsContent>
        </Tabs>
      </div>

      <LogMortalityDialog open={openMort} onOpenChange={setOpenMort} batchId={batchId} shedId={shedId} />
      <LogFeedDialog open={openFeed} onOpenChange={setOpenFeed} batchId={batchId} shedId={shedId} />
      <LogWeightDialog open={openWeight} onOpenChange={setOpenWeight} batchId={batchId} shedId={shedId} />
      <LogCostDialog open={openCost} onOpenChange={setOpenCost} batchId={batchId} />
      <LogVaccinationDialog open={openVacc} onOpenChange={setOpenVacc} batchId={batchId} defaultName={vaccPrefill} />
      <LogSaleDialog open={openSale} onOpenChange={setOpenSale} batchId={batchId} />
    </AppShell>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-base">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ msg, action }: { msg: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm text-muted-foreground">{msg}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function SummaryTab({ batchId }: { batchId: string }) {
  const { data: summary } = useGetBatchSummary(batchId);
  const { data: costSum } = useGetCostSummary(batchId);
  const { t } = useLang();
  if (!summary) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title={t("Mortality (last 14 days)", "मृत्यु — पिछले 14 दिन")}>
        {summary.mortalityTrend.length ? <MortalityBars data={summary.mortalityTrend} /> : <EmptyState msg={t("No mortality logged yet.", "कोई मृत्यु दर्ज नहीं।")} />}
      </SectionCard>
      <SectionCard title={t("Growth vs Cobb 500 standard", "वृद्धि — Cobb 500 मानक से तुलना")}>
        {summary.growthCurve.length ? <GrowthCurveChart data={summary.growthCurve} /> : <EmptyState msg={t("No weight samples yet.", "कोई वज़न नमूना नहीं।")} />}
      </SectionCard>
      <SectionCard title={t("Cost breakdown", "खर्च का वितरण")}>
        {summary.costBreakdown.length ? <CostDonut data={summary.costBreakdown} /> : <EmptyState msg={t("No costs logged.", "कोई खर्च नहीं।")} />}
      </SectionCard>
      <div className="rounded-xl border bg-card shadow-xs p-5 space-y-3">
        <h3 className="font-semibold text-base">{t("Economics", "आर्थिकी")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Total cost", "कुल खर्च")}</div><div className="font-bold tabular text-lg" data-testid="text-summary-totalcost">{formatINRShort(summary.totalCost)}</div></div>
          <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Cost / bird", "प्रति पक्षी")}</div><div className="font-bold tabular text-lg">{formatINR(summary.costPerBird, true)}</div></div>
          <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Break-even ₹/kg", "तोड़ बिंदु ₹/किग्रा")}</div><div className="font-bold tabular text-lg">{formatINR(summary.breakEvenPricePerKg, true)}</div></div>
          <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Projected margin", "अनुमानित लाभ")}</div><div className={cn("font-bold tabular text-lg", summary.projectedMargin >= 0 ? "text-[hsl(142,46%,30%)]" : "text-destructive")}>{formatINRShort(summary.projectedMargin)}</div></div>
        </div>
        {costSum && costSum.history.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">{t("Cumulative cost trend", "खर्च की प्रवृत्ति")}</div>
            <CostHistoryArea data={costSum.history} />
          </div>
        )}
      </div>
    </div>
  );
}

function MortalityTab({ batchId, onLog }: { batchId: string; onLog: () => void }) {
  const { data: logs } = useListMortality(batchId);
  const { data: trend } = useGetMortalityTrend(batchId);
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <SectionCard title={t("Daily mortality", "रोज़ की मृत्यु")} action={<Button size="sm" onClick={onLog} data-testid="button-tab-log-mortality" className="gap-1"><Plus className="h-3.5 w-3.5" />{t("Log", "दर्ज")}</Button>}>
        {trend?.length ? <MortalityBars data={trend} /> : <EmptyState msg={t("No data yet.", "कोई डेटा नहीं।")} />}
      </SectionCard>
      <SectionCard title={t("History", "इतिहास")}>
        {logs?.length === 0 && <EmptyState msg={t("No mortality logged.", "कोई मृत्यु दर्ज नहीं।")} />}
        <div className="divide-y divide-border -mx-5">
          {logs?.map((m) => (
            <div key={m.id} className="px-5 py-3 flex items-center gap-3" data-testid={`mortality-${m.id}`}>
              <div className="rounded-md bg-destructive/10 text-destructive font-bold tabular w-12 h-12 flex items-center justify-center text-lg">{m.count}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{causeLabel[m.cause]}</div>
                <div className="text-xs text-muted-foreground">{formatDate(m.date)} · {m.shift}</div>
                {m.notes && <div className="text-xs text-foreground/70 italic mt-0.5">"{m.notes}"</div>}
              </div>
              <div className="text-xs text-muted-foreground">{timeAgo(m.date)}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function FeedTab({ batchId, onLog }: { batchId: string; onLog: () => void }) {
  const { data: logs } = useListFeed(batchId);
  const { data: fcrTrend } = useGetFcrTrend(batchId);
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <SectionCard title={t("FCR trend", "FCR प्रवृत्ति")} action={<Button size="sm" onClick={onLog} data-testid="button-tab-log-feed" className="gap-1"><Plus className="h-3.5 w-3.5" />{t("Log feed", "दाना दर्ज")}</Button>}>
        {fcrTrend?.dailyTrend.length ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Current FCR", "मौजूदा FCR")}</div><div className="font-bold tabular text-lg" data-testid="text-fcr-current">{fcrTrend.currentFcr.toFixed(2)}</div></div>
              <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Target", "लक्ष्य")}</div><div className="font-bold tabular text-lg">{fcrTrend.targetFcr.toFixed(2)}</div></div>
              <div className="rounded-md bg-muted p-3"><div className="text-xs text-muted-foreground">{t("Total feed", "कुल दाना")}</div><div className="font-bold tabular text-lg">{formatKg(fcrTrend.totalFeedKg, 0)}</div></div>
            </div>
            <FcrLine data={fcrTrend.dailyTrend} />
          </>
        ) : <EmptyState msg={t("No feed data.", "कोई फ़ीड डेटा नहीं।")} />}
      </SectionCard>
      <SectionCard title={t("Feed log", "फ़ीड लॉग")}>
        {logs?.length === 0 && <EmptyState msg={t("No feed logged.", "कोई फ़ीड दर्ज नहीं।")} />}
        <div className="divide-y divide-border -mx-5">
          {logs?.map((f) => (
            <div key={f.id} className="px-5 py-3 flex items-center gap-3" data-testid={`feed-${f.id}`}>
              <div className="rounded-md bg-[hsl(42,78%,48%)]/15 text-[hsl(28,80%,32%)] font-bold tabular px-3 py-2 text-sm">{(f.kgGiven - f.kgReturned).toFixed(0)} kg</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{feedTypeLabel[f.feedType]} · {f.feedBrand ?? ""}</div>
                <div className="text-xs text-muted-foreground">{formatDate(f.date)} · {f.shift}{f.bagNumber ? ` · ${t("Bag", "बोरी")} ${f.bagNumber}` : ""}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>{t("Given", "दिया")} {f.kgGiven.toFixed(1)}</div>
                <div>{t("Left", "बचा")} {f.kgReturned.toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function WeightTab({ batchId, onLog }: { batchId: string; onLog: () => void }) {
  const { data: logs } = useListWeight(batchId);
  const { data: curve } = useGetGrowthCurve(batchId);
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <SectionCard title={t("Growth curve", "वृद्धि वक्र")} action={<Button size="sm" onClick={onLog} data-testid="button-tab-log-weight" className="gap-1"><Plus className="h-3.5 w-3.5" />{t("Sample weight", "नमूना")}</Button>}>
        {curve?.length ? <GrowthCurveChart data={curve} /> : <EmptyState msg={t("No samples.", "कोई नमूना नहीं।")} />}
      </SectionCard>
      <SectionCard title={t("Weighing history", "वज़न इतिहास")}>
        {logs?.length === 0 && <EmptyState msg={t("No weight samples.", "कोई वज़न नमूना नहीं।")} />}
        <div className="divide-y divide-border -mx-5">
          {logs?.map((w) => (
            <div key={w.id} className="px-5 py-3 flex items-center gap-3" data-testid={`weight-${w.id}`}>
              <div className="rounded-md bg-primary/10 text-primary font-bold tabular px-3 py-2 text-sm">{w.avgWeightKg.toFixed(2)} kg</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{t("Sample of", "नमूना")} {w.sampleSize} {t("birds", "पक्षी")}</div>
                <div className="text-xs text-muted-foreground">{formatDate(w.date)} · {t("Total", "कुल")} {w.totalWeightKg.toFixed(2)} kg</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function CostTab({ batchId, onLog }: { batchId: string; onLog: () => void }) {
  const { data: sum } = useGetCostSummary(batchId);
  const { data: logs } = useListCosts(batchId);
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("Total cost", "कुल खर्च")} value={sum ? formatINRShort(sum.totalCost) : "—"} testId="stat-cost-total" />
        <StatCard label={t("Per bird today", "आज प्रति पक्षी")} value={sum ? formatINR(sum.costPerBirdToday, true) : "—"} />
        <StatCard label={t("Projected total", "अनुमानित कुल")} value={sum ? formatINRShort(sum.projectedTotalCost) : "—"} tone="warn" />
        <StatCard label={t("Break-even ₹/kg", "तोड़ बिंदु")} value={sum ? formatINR(sum.breakEvenPricePerKg, true) : "—"} tone="primary" />
      </div>
      <SectionCard title={t("Breakdown by category", "श्रेणी अनुसार")} action={<Button size="sm" onClick={onLog} data-testid="button-tab-log-cost" className="gap-1"><Plus className="h-3.5 w-3.5" />{t("Add expense", "खर्च जोड़ें")}</Button>}>
        {sum?.breakdown.length ? <CostDonut data={sum.breakdown} /> : <EmptyState msg={t("No costs.", "कोई खर्च नहीं।")} />}
      </SectionCard>
      <SectionCard title={t("Recent expenses", "हाल के खर्च")}>
        {logs?.length === 0 && <EmptyState msg={t("None logged.", "कोई नहीं।")} />}
        <div className="divide-y divide-border -mx-5">
          {logs?.slice(0, 30).map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center gap-3" data-testid={`cost-${c.id}`}>
              <div className="text-[10px] font-bold uppercase tracking-wide rounded-md bg-accent/15 text-[hsl(25,78%,38%)] px-2 py-1 shrink-0">{costCatLabel[c.category]}</div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{c.subCategory}</div><div className="text-xs text-muted-foreground">{formatDate(c.date)}{c.note ? ` · ${c.note}` : ""}</div></div>
              <div className="font-bold tabular">{formatINR(c.amount)}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function VaccineTab({ batchId, onLog }: { batchId: string; onLog: (name: string) => void }) {
  const { data: schedule } = useGetVaccinationSchedule(batchId);
  const { data: logs } = useListVaccinations(batchId);
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <SectionCard title={t("Vaccination schedule", "टीकाकरण कार्यक्रम")} action={<Button size="sm" onClick={() => onLog("")} data-testid="button-tab-log-vaccine" className="gap-1"><Plus className="h-3.5 w-3.5" />{t("Log dose", "टीका दर्ज")}</Button>}>
        {schedule?.length === 0 && <EmptyState msg={t("No schedule.", "कोई कार्यक्रम नहीं।")} />}
        <div className="space-y-2">
          {schedule?.map((s) => (
            <div key={`${s.vaccineName}-${s.dueDay}`} className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-background hover-elevate" data-testid={`schedule-${s.vaccineName}`}>
              <div className="text-center w-12 shrink-0"><div className="text-[10px] uppercase text-muted-foreground">Day</div><div className="font-bold tabular text-base">{s.dueDay}</div></div>
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{s.vaccineName}</div><div className="text-xs text-muted-foreground">{formatDate(s.dueDate)}{s.route ? ` · ${s.route}` : ""}</div></div>
              <StatusBadge status={s.status} />
              {s.status !== "completed" && (
                <Button size="sm" variant="ghost" onClick={() => onLog(s.vaccineName)} className="text-xs" data-testid={`button-quick-vacc-${s.vaccineName}`}>{t("Log", "दर्ज")}</Button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title={t("Doses given", "दी गई खुराकें")}>
        {logs?.length === 0 && <EmptyState msg={t("None.", "कुछ नहीं।")} />}
        <div className="divide-y divide-border -mx-5">
          {logs?.map((v) => (
            <div key={v.id} className="px-5 py-3 flex items-center gap-3" data-testid={`vaccine-${v.id}`}>
              <div className="rounded-md bg-[hsl(200,40%,38%)]/15 text-[hsl(200,40%,32%)] p-2"><Syringe className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{v.vaccineName} · {t("Dose", "खुराक")} {v.doseNumber}</div><div className="text-xs text-muted-foreground">{formatDate(v.doseDate)}{v.route ? ` · ${v.route}` : ""}{v.administeredBy ? ` · ${v.administeredBy}` : ""}</div></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SaleTab({ batchId, onLog }: { batchId: string; onLog: () => void }) {
  const { data: sales } = useListSales(batchId);
  const { t } = useLang();
  const totalRevenue = sales?.reduce((s, x) => s + (x.revenue ?? x.totalWeightKg * x.pricePerKg), 0) ?? 0;
  const totalBirds = sales?.reduce((s, x) => s + x.birdsSold, 0) ?? 0;
  const totalKg = sales?.reduce((s, x) => s + x.totalWeightKg, 0) ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t("Birds sold", "बिक्री")} value={formatNumber(totalBirds)} />
        <StatCard label={t("Weight sold", "बिक्री वज़न")} value={formatKg(totalKg, 0)} />
        <StatCard label={t("Revenue", "आय")} value={formatINRShort(totalRevenue)} tone="primary" />
      </div>
      <SectionCard title={t("Sales", "बिक्री")} action={<Button size="sm" onClick={onLog} data-testid="button-tab-log-sale" className="gap-1"><Plus className="h-3.5 w-3.5" />{t("Record sale", "बिक्री दर्ज")}</Button>}>
        {sales?.length === 0 && <EmptyState msg={t("No sales yet.", "कोई बिक्री नहीं।")} />}
        <div className="divide-y divide-border -mx-5">
          {sales?.map((s) => (
            <div key={s.id} className="px-5 py-3 flex items-center gap-3" data-testid={`sale-${s.id}`}>
              <div className="rounded-md bg-primary/10 text-primary p-2"><ShoppingCart className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{s.buyer} · {formatNumber(s.birdsSold)} {t("birds", "पक्षी")}</div><div className="text-xs text-muted-foreground">{formatDate(s.saleDate)} · {s.totalWeightKg.toFixed(1)} kg @ ₹{s.pricePerKg}/kg</div></div>
              <div className="font-bold tabular">{formatINRShort(s.revenue ?? s.totalWeightKg * s.pricePerKg)}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
