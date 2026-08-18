import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Link, useSearch } from "wouter";
import {
  AlertCircle,
  ArrowRight,
  Bird,
  Calculator,
  Check,
  Info,
  RefreshCcw,
  Scale,
  SlidersHorizontal,
  Sprout,
  Target,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";
import {
  getGetBatchSummaryQueryKey,
  getListBatchesQueryKey,
  useGetBatchSummary,
  useListBatches,
  type BatchSummary,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/lib/lang";
import { formatINR, formatINRShort, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type PlannerInputs = {
  feedPrice: number;
  salePrice: number;
  fcr: number;
  mortality: number;
  avgWeight: number;
};

type PlannerResults = {
  liveBirds: number;
  saleWeight: number;
  feedRequired: number;
  revenue: number;
  totalCost: number;
  breakEven: number;
  profit: number;
  profitDelta: number;
  baseProfit: number;
  hasCostModel: boolean;
};

const FALLBACKS: PlannerInputs = {
  feedPrice: 34,
  salePrice: 105,
  fcr: 1.7,
  mortality: 4,
  avgWeight: 2,
};

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function positive(value: unknown): value is number {
  return finite(value) && value > 0;
}

function feedCostFromSummary(summary: BatchSummary): number | null {
  const feedLine = summary.costBreakdown?.find((item) => String(item.category ?? "").toLowerCase() === "feed");
  return feedLine && positive(feedLine.amount) ? feedLine.amount : null;
}

function defaultsFromSummary(summary: BatchSummary): PlannerInputs {
  const feedCost = feedCostFromSummary(summary);
  const feedKg = positive(summary.feedConsumedTotal) ? summary.feedConsumedTotal : null;
  const currentWeight = positive(summary.currentFlock) && positive(summary.avgWeight)
    ? summary.currentFlock * summary.avgWeight
    : null;
  const impliedMarginPrice = currentWeight && finite(summary.projectedMargin) && finite(summary.breakEvenPricePerKg)
    ? summary.breakEvenPricePerKg + summary.projectedMargin / currentWeight
    : null;

  return {
    feedPrice: feedCost && feedKg ? Number((feedCost / feedKg).toFixed(2)) : FALLBACKS.feedPrice,
    salePrice: positive(impliedMarginPrice) ? Number(impliedMarginPrice.toFixed(2)) : (positive(summary.breakEvenPricePerKg) ? summary.breakEvenPricePerKg : FALLBACKS.salePrice),
    fcr: positive(summary.fcr) ? Number(summary.fcr.toFixed(2)) : FALLBACKS.fcr,
    mortality: finite(summary.mortalityPct) ? Number(Math.max(0, summary.mortalityPct).toFixed(1)) : FALLBACKS.mortality,
    avgWeight: positive(summary.avgWeight) ? Number(summary.avgWeight.toFixed(2)) : FALLBACKS.avgWeight,
  };
}

function getResults(summary: BatchSummary, inputs: PlannerInputs): PlannerResults {
  const placementCount = positive(summary.batch?.placementCount)
    ? summary.batch.placementCount
    : positive(summary.currentFlock)
      ? summary.currentFlock / Math.max(0.01, 1 - (finite(summary.mortalityPct) ? summary.mortalityPct : 0) / 100)
      : 0;
  const liveBirds = placementCount * Math.max(0, 1 - inputs.mortality / 100);
  const saleWeight = liveBirds * Math.max(0, inputs.avgWeight);
  const feedRequired = saleWeight * Math.max(0, inputs.fcr);
  const revenue = saleWeight * Math.max(0, inputs.salePrice);
  const feedCost = feedCostFromSummary(summary);
  const feedConsumed = positive(summary.feedConsumedTotal) ? summary.feedConsumedTotal : 0;
  const currentFeedCost = feedCost ?? feedConsumed * inputs.feedPrice;
  const otherCosts = finite(summary.totalCost) ? Math.max(0, summary.totalCost - currentFeedCost) : 0;
  const totalCost = otherCosts + feedRequired * Math.max(0, inputs.feedPrice);
  const breakEven = saleWeight > 0 ? totalCost / saleWeight : 0;
  const profit = revenue - totalCost;
  const baseProfit = finite(summary.projectedMargin) ? summary.projectedMargin : (
    finite(summary.breakEvenPricePerKg) && currentWeight(summary) > 0
      ? currentWeight(summary) * (inputs.salePrice - summary.breakEvenPricePerKg)
      : 0
  );

  return {
    liveBirds,
    saleWeight,
    feedRequired,
    revenue,
    totalCost,
    breakEven,
    profit,
    profitDelta: profit - baseProfit,
    baseProfit,
    hasCostModel: Boolean(feedCost) || positive(summary.feedConsumedTotal),
  };
}

function currentWeight(summary: BatchSummary): number {
  return positive(summary.currentFlock) && positive(summary.avgWeight)
    ? summary.currentFlock * summary.avgWeight
    : 0;
}

function money(value: number): string {
  return finite(value) ? formatINRShort(value) : "—";
}

export default function WhatIfPlanner() {
  const { t } = useLang();
  const search = useSearch();
  const urlBatchId = useMemo(() => new URLSearchParams(search).get("batchId") ?? "", [search]);
  const [selectedBatchId, setSelectedBatchId] = useState(urlBatchId);
  const [inputs, setInputs] = useState<PlannerInputs>(FALLBACKS);

  const batchesQuery = useListBatches({}, { query: { queryKey: getListBatchesQueryKey({}) } });
  const batches = batchesQuery.data ?? [];
  const summaryQuery = useGetBatchSummary(selectedBatchId, {
    query: {
      enabled: Boolean(selectedBatchId),
      queryKey: getGetBatchSummaryQueryKey(selectedBatchId),
    },
  });
  const summary = summaryQuery.data;

  useEffect(() => {
    if (!batches.length) return;
    const urlBatch = urlBatchId && batches.find((batch) => batch.id === urlBatchId);
    const currentBatch = selectedBatchId && batches.find((batch) => batch.id === selectedBatchId);
    const nextBatch = urlBatch ?? currentBatch ?? batches.find((batch) => batch.status === "active" || batch.status === "harvesting") ?? batches[0];
    if (nextBatch && nextBatch.id !== selectedBatchId) setSelectedBatchId(nextBatch.id);
  }, [batches, selectedBatchId, urlBatchId]);

  useEffect(() => {
    if (!selectedBatchId || typeof window === "undefined") return;
    const next = `${window.location.pathname}?batchId=${encodeURIComponent(selectedBatchId)}`;
    window.history.replaceState({}, "", next);
  }, [selectedBatchId]);

  useEffect(() => {
    if (summary && summary.batch?.id === selectedBatchId) {
      setInputs(defaultsFromSummary(summary));
    }
  }, [selectedBatchId, summary]);

  const results = useMemo(
    () => (summary ? getResults(summary, inputs) : null),
    [inputs, summary],
  );

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === selectedBatchId),
    [batches, selectedBatchId],
  );

  const handleBatchChange = (id: string) => {
    setSelectedBatchId(id);
    setInputs(FALLBACKS);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-8 sm:py-8">
        <PageHeader
          title={t("What-if planner", "क्या-अगर योजनाकार")}
          subtitle={t(
            "Try a better feed, price or FCR before you commit on the farm.",
            "खेत पर फैसला लेने से पहले फ़ीड, भाव या FCR बदलकर देखें।",
          )}
        />

        <div className="relative overflow-hidden rounded-2xl border border-[hsl(142,30%,74%)] bg-[hsl(140,28%,91%)] p-5 shadow-xs sm:p-7">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border-[24px] border-[hsl(38,72%,64%)]/20" />
          <div className="absolute -bottom-24 right-24 h-40 w-40 rounded-full bg-[hsl(142,35%,75%)]/25" />
          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[hsl(142,38%,28%)]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                <Calculator className="h-3.5 w-3.5" />
                {t("Planning desk", "योजना डेस्क")}
              </div>
              <h2 className="max-w-xl text-2xl font-extrabold tracking-tight text-[hsl(142,38%,20%)] sm:text-3xl">
                {t("Make the next batch decision with numbers you can trust.", "अगले बैच का फैसला भरोसेमंद आँकड़ों के साथ लें।")}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[hsl(142,25%,30%)]">
                {t(
                  "Your changes stay on this page. Nothing is saved to the batch, so you can explore freely.",
                  "आपके बदलाव सिर्फ़ इस पेज पर रहते हैं। बैच में कुछ सेव नहीं होता, इसलिए खुलकर जाँचें।",
                )}
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(142,26%,74%)] bg-card/75 p-3.5 backdrop-blur-sm">
              <label htmlFor="planner-batch" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Sprout className="h-3.5 w-3.5 text-primary" />
                {t("Batch to explore", "जाँचने वाला बैच")}
              </label>
              {batchesQuery.isLoading ? (
                <Skeleton className="h-10 w-full rounded-md" data-testid="skeleton-batch-picker" />
              ) : batches.length > 0 ? (
                <Select value={selectedBatchId} onValueChange={handleBatchChange}>
                  <SelectTrigger id="planner-batch" className="h-10 bg-card" data-testid="select-planner-batch">
                    <SelectValue placeholder={t("Select a batch", "बैच चुनें")} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id} data-testid={`option-planner-batch-${batch.id}`}>
                        <span className="font-semibold">{batch.batchCode}</span>
                        <span className="ml-2 text-muted-foreground">{batch.farmName} · {batch.status}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-dashed bg-card/60 px-3 py-2.5 text-sm text-muted-foreground" data-testid="empty-planner-batches">
                  {t("No batches found yet.", "अभी कोई बैच नहीं मिला।")}
                </div>
              )}
              {selectedBatch && (
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground" data-testid="text-selected-batch-meta">
                  <span>{selectedBatch.farmName} · {selectedBatch.shedName}</span>
                  <StatusBadge status={selectedBatch.status} />
                </div>
              )}
            </div>
          </div>
        </div>

        {batchesQuery.isError ? (
          <MessageCard
            icon={<AlertCircle className="h-5 w-5 text-destructive" />}
            title={t("We couldn't load your batches.", "आपके बैच लोड नहीं हो सके।")}
            body={t("Check your connection and try again.", "कनेक्शन जाँचकर फिर कोशिश करें।")}
            action={
              <Button variant="outline" size="sm" onClick={() => batchesQuery.refetch()} data-testid="button-retry-batches">
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> {t("Try again", "फिर कोशिश करें")}
              </Button>
            }
          />
        ) : batchesQuery.isLoading ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <Skeleton className="h-[430px] rounded-xl" data-testid="skeleton-planner-controls" />
            <Skeleton className="h-[430px] rounded-xl" data-testid="skeleton-planner-results" />
          </div>
        ) : batches.length === 0 ? (
          <MessageCard
            icon={<Bird className="h-5 w-5 text-primary" />}
            title={t("Add a batch to start planning.", "योजना शुरू करने के लिए बैच जोड़ें।")}
            body={t("The planner uses your recorded flock and cost data to make the projection useful.", "यह योजनाकार आपके दर्ज किए हुए झुंड और खर्च के आँकड़ों से अनुमान बनाता है।")}
            action={
              <Link href="/batches" className="inline-flex items-center text-sm font-semibold text-primary hover:underline" data-testid="link-planner-batches">
                {t("Open batches", "बैच खोलें")} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            }
          />
        ) : summaryQuery.isError ? (
          <MessageCard
            icon={<AlertCircle className="h-5 w-5 text-destructive" />}
            title={t("This batch summary is not available.", "इस बैच का सारांश उपलब्ध नहीं है।")}
            body={t("The batch is still in your list, but its recorded numbers could not be read.", "बैच सूची में है, लेकिन उसके दर्ज आँकड़े पढ़े नहीं जा सके।")}
            action={
              <Button variant="outline" size="sm" onClick={() => summaryQuery.refetch()} data-testid="button-retry-summary">
                <RefreshCcw className="mr-2 h-3.5 w-3.5" /> {t("Try again", "फिर कोशिश करें")}
              </Button>
            }
          />
        ) : summaryQuery.isLoading || !summary || summary.batch?.id !== selectedBatchId ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
            <Skeleton className="h-[430px] rounded-xl" data-testid="skeleton-planner-summary" />
            <Skeleton className="h-[430px] rounded-xl" data-testid="skeleton-planner-result-summary" />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)]">
            <AssumptionPanel inputs={inputs} setInputs={setInputs} t={t} summary={summary} />
            {results && <ResultsPanel results={results} summary={summary} t={t} />}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AssumptionPanel({
  inputs,
  setInputs,
  t,
  summary,
}: {
  inputs: PlannerInputs;
  setInputs: Dispatch<SetStateAction<PlannerInputs>>;
  t: (en: string, hi: string) => string;
  summary: BatchSummary;
}) {
  const feedKnown = Boolean(feedCostFromSummary(summary));
  const update = (key: keyof PlannerInputs, value: string) => {
    const parsed = Number(value);
    setInputs((current) => ({ ...current, [key]: Number.isFinite(parsed) ? parsed : 0 }));
  };
  const fields: Array<{
    key: keyof PlannerInputs;
    label: string;
    hi: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    hint: string;
    hintHi: string;
    icon: typeof Wheat;
  }> = [
    { key: "feedPrice", label: "Feed price", hi: "फ़ीड भाव", unit: "₹ / kg", min: 10, max: 80, step: 0.5, hint: feedKnown ? "Derived from this batch's feed cost" : "No feed cost line was recorded", hintHi: feedKnown ? "इस बैच के फ़ीड खर्च से निकाला गया" : "फ़ीड खर्च दर्ज नहीं है", icon: Wheat },
    { key: "salePrice", label: "Sale price", hi: "बिक्री भाव", unit: "₹ / kg", min: 40, max: 180, step: 0.5, hint: "Price you expect at sale", hintHi: "बिक्री के समय मिलने वाला भाव", icon: TrendingUp },
    { key: "fcr", label: "FCR target", hi: "FCR लक्ष्य", unit: "kg / kg", min: 1, max: 3, step: 0.01, hint: "Lower uses less feed", hintHi: "कम FCR में फ़ीड कम लगता है", icon: Target },
    { key: "mortality", label: "Mortality target", hi: "मृत्यु दर लक्ष्य", unit: "%", min: 0, max: 20, step: 0.1, hint: "Expected flock loss", hintHi: "झुंड में अनुमानित कमी", icon: Bird },
    { key: "avgWeight", label: "Average sale weight", hi: "औसत बिक्री वज़न", unit: "kg / bird", min: 0.5, max: 4, step: 0.05, hint: "Live weight per bird", hintHi: "प्रति पक्षी जीवित वज़न", icon: Scale },
  ];

  return (
    <section className="rounded-xl border bg-card shadow-xs" data-testid="panel-assumptions">
      <div className="border-b bg-[hsl(38,40%,94%)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-primary">
          <SlidersHorizontal className="h-4 w-4" />
          <h2 className="font-bold">{t("Change your assumptions", "अपनी धारणाएँ बदलें")}</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {t("Move one number at a time. The outcome on the right updates instantly.", "एक बार में एक आँकड़ा बदलें। दाईं ओर नतीजा तुरंत बदलेगा।")}
        </p>
      </div>
      <div className="space-y-1 p-5 sm:p-6">
        {fields.map((field) => {
          const Icon = field.icon;
          const value = inputs[field.key];
          const inputId = `planner-${field.key}`;
          return (
            <div key={field.key} className="rounded-lg px-2 py-3 transition-colors hover:bg-muted/40" data-testid={`control-${field.key}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <label htmlFor={inputId} className="text-sm font-semibold">
                      {t(field.label, field.hi)}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={inputId}
                        type="number"
                        value={value}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        onChange={(event) => update(field.key, event.target.value)}
                        className="h-9 w-[88px] rounded-md border border-input bg-background px-2 text-right text-sm font-bold tabular outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        data-testid={`input-${field.key}`}
                      />
                      <span className="w-[54px] text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{field.unit}</span>
                    </div>
                  </div>
                  <input
                    aria-label={t(field.label, field.hi)}
                    type="range"
                    value={value}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(event) => update(field.key, event.target.value)}
                    className="mt-3 h-1.5 w-full cursor-pointer accent-[hsl(142,38%,28%)]"
                    data-testid={`range-${field.key}`}
                  />
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Info className="h-3 w-3" />
                    {t(field.hint, field.hintHi)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mx-5 mb-5 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-[11px] leading-5 text-muted-foreground sm:mx-6 sm:mb-6">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>{t("These are planning inputs only. Your batch records stay unchanged.", "ये सिर्फ़ योजना के आँकड़े हैं। आपके बैच रिकॉर्ड में कोई बदलाव नहीं होगा।")}</span>
      </div>
    </section>
  );
}

function ResultsPanel({
  results,
  summary,
  t,
}: {
  results: PlannerResults;
  summary: BatchSummary;
  t: (en: string, hi: string) => string;
}) {
  const positiveProfit = results.profit >= 0;
  return (
    <section className="space-y-5" data-testid="panel-results">
      <div className={cn(
        "rounded-xl border p-5 shadow-xs sm:p-6",
        positiveProfit ? "border-[hsl(142,30%,74%)] bg-[hsl(140,28%,93%)]" : "border-[hsl(14,42%,78%)] bg-[hsl(14,40%,95%)]",
      )}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={cn("flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]", positiveProfit ? "text-primary" : "text-[hsl(14,68%,38%)]")}>
              {positiveProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {t("Projected profit", "अनुमानित लाभ")}
            </div>
            <div className={cn("mt-2 text-4xl font-extrabold tracking-tight tabular sm:text-5xl", positiveProfit ? "text-[hsl(142,38%,23%)]" : "text-[hsl(14,68%,34%)]")} data-testid="output-profit">
              {money(results.profit)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t("after projected costs", "अनुमानित खर्च के बाद")}
            </div>
          </div>
          <div className="rounded-lg bg-card/70 px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Change vs current", "वर्तमान से बदलाव")}</div>
            <div className={cn("mt-1 text-lg font-extrabold tabular", results.profitDelta >= 0 ? "text-primary" : "text-destructive")} data-testid="output-profit-delta">
              {results.profitDelta >= 0 ? "+" : ""}{money(results.profitDelta)}
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-foreground/10 pt-4 sm:grid-cols-4">
          <MiniMetric label={t("Live birds", "जीवित पक्षी")} value={formatNumber(Math.round(results.liveBirds))} testId="output-live-birds" />
          <MiniMetric label={t("Sale weight", "बिक्री वज़न")} value={`${formatNumber(results.saleWeight, 1)} kg`} testId="output-sale-weight" />
          <MiniMetric label={t("Feed needed", "ज़रूरी फ़ीड")} value={`${formatNumber(results.feedRequired, 0)} kg`} testId="output-feed-needed" />
          <MiniMetric label={t("Batch day", "बैच का दिन")} value={finite(summary.dayOfBatch) ? formatNumber(summary.dayOfBatch) : "—"} testId="output-batch-day" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label={t("Projected revenue", "अनुमानित आय")} value={money(results.revenue)} icon={<TrendingUp className="h-4 w-4" />} tone="green" testId="output-revenue" />
        <MetricCard label={t("Projected costs", "अनुमानित खर्च")} value={money(results.totalCost)} icon={<Wheat className="h-4 w-4" />} tone="amber" testId="output-cost" />
        <MetricCard label={t("Break-even price", "लाभ-हानि बराबर भाव")} value={formatINR(results.breakEven, true)} icon={<Scale className="h-4 w-4" />} tone="blue" testId="output-breakeven" />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-accent/20 p-2 text-[hsl(30,70%,35%)]"><Target className="h-4 w-4" /></div>
          <div>
            <h3 className="text-sm font-bold">{t("Read the result", "नतीजे को समझें")}</h3>
            <p className="text-xs text-muted-foreground">{t("A quick field note for this scenario", "इस स्थिति के लिए छोटा सुझाव")}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-foreground/80" data-testid="text-planner-guidance">
          {positiveProfit
            ? t(
              `At this mix, each bird needs about ${formatNumber(results.feedRequired / Math.max(1, results.liveBirds), 2)} kg feed and the batch clears break-even by ${formatINR(Math.max(0, results.profit), true)} overall.`,
              `इस मिश्रण में हर पक्षी को लगभग ${formatNumber(results.feedRequired / Math.max(1, results.liveBirds), 2)} किलो फ़ीड चाहिए और बैच में कुल ${formatINR(Math.max(0, results.profit), true)} लाभ-हानि बराबर भाव से ऊपर बचता है।`,
            )
            : t(
              `This scenario is below break-even by ${formatINR(Math.abs(results.profit), true)}. Try a lower feed price, a stronger FCR target or a better sale price.`,
              `यह स्थिति लाभ-हानि बराबर भाव से ${formatINR(Math.abs(results.profit), true)} नीचे है। फ़ीड भाव कम, FCR लक्ष्य बेहतर या बिक्री भाव ज़्यादा करके देखें।`,
            )}
        </p>
        {!results.hasCostModel && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent/10 p-3 text-xs leading-5 text-muted-foreground" data-testid="status-partial-cost-data">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
            <span>{t("Feed cost history is partial, so feed price starts from a planning reference. Add feed costs to make this projection more precise.", "फ़ीड खर्च का इतिहास अधूरा है, इसलिए फ़ीड भाव एक योजना संदर्भ से शुरू हुआ है। ज़्यादा सटीक अनुमान के लिए फ़ीड खर्च दर्ज करें।")}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> {t("Local estimate from this batch's recorded summary", "इस बैच के दर्ज सारांश से स्थानीय अनुमान")}</span>
        <Link href={`/batches/${summary.batch.id}`} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" data-testid="link-planner-batch-detail">
          {t("View batch details", "बैच विवरण देखें")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}

function MiniMetric({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div data-testid={testId}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-bold tabular text-foreground">{value}</div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
  testId,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "green" | "amber" | "blue";
  testId: string;
}) {
  const toneClass = {
    green: "bg-[hsl(140,28%,94%)] text-primary",
    amber: "bg-[hsl(38,52%,93%)] text-[hsl(30,70%,35%)]",
    blue: "bg-[hsl(200,28%,93%)] text-[hsl(200,40%,32%)]",
  };
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs" data-testid={testId}>
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className={cn("rounded-md p-1.5", toneClass[tone])}>{icon}</span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-tight tabular">{value}</div>
    </div>
  );
}

function MessageCard({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-dashed bg-card/70 p-8 text-center shadow-xs" data-testid="planner-message">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted">{icon}</div>
      <h3 className="mt-4 text-base font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}