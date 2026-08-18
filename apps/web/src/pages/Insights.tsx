import { useRoute, Link } from "wouter";
import {
  useGetInsights,
  useGetBatch,
  useGetBatchSummary,
  getGetInsightsQueryKey,
  getGetBatchQueryKey,
  getGetBatchSummaryQueryKey,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, TrendingDown, Minus, ChevronLeft, AlertTriangle, Calendar, Coins } from "lucide-react";
import { formatDate, formatINRShort, formatPct } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

const benchmarkLabels: Record<string, { en: string; hi: string }> = {
  fcr: { en: "FCR", hi: "FCR" },
  mortalityPct: { en: "Mortality %", hi: "मृत्यु %" },
  avgWeight: { en: "Avg weight (kg)", hi: "औसत वज़न" },
  costPerBird: { en: "Cost per bird (₹)", hi: "प्रति पक्षी खर्च" },
};

export default function Insights() {
  const [, params] = useRoute("/insights/:batchId");
  const batchId = params?.batchId ?? "";
  const { data: batch } = useGetBatch(batchId, { query: { queryKey: getGetBatchQueryKey(batchId), enabled: !!batchId } });
  const { data: summary } = useGetBatchSummary(batchId, { query: { queryKey: getGetBatchSummaryQueryKey(batchId), enabled: !!batchId } });
  const { data: ins, isLoading } = useGetInsights(batchId, { query: { queryKey: getGetInsightsQueryKey(batchId), enabled: !!batchId } });
  const { t, lang } = useLang();

  if (isLoading || !ins || !batch) {
    return <AppShell><div className="p-8 max-w-5xl mx-auto"><Skeleton className="h-12 w-64 mb-6" /><Skeleton className="h-48 mb-4" /><Skeleton className="h-64" /></div></AppShell>;
  }

  const tone = ins.healthScore >= 80 ? "good" : ins.healthScore >= 60 ? "warn" : "bad";

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
        <Link href={`/batches/${batchId}`} asChild>
          <a className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 hover-elevate -ml-2 px-2 py-1 rounded-md" data-testid="link-back-batch">
            <ChevronLeft className="h-3.5 w-3.5" /> {t("Back to batch", "बैच पर वापस")}
          </a>
        </Link>
        <PageHeader
          title={`${t("Insights", "सलाह")} · ${batch.batchCode}`}
          subtitle={summary ? `${summary.farmName} · ${summary.shedName} · ${t("Day", "दिन")} ${summary.dayOfBatch}` : undefined}
        />

        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border bg-gradient-to-br from-primary/8 to-accent/10 p-5 shadow-xs md:col-span-2">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/15 p-2"><Sparkles className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Tip of the day", "आज की सलाह")}</div>
                <p className="mt-1.5 text-base font-medium leading-relaxed text-foreground" data-testid="text-tip">
                  {lang === "hi" ? ins.tipOfTheDayHi : ins.tipOfTheDay}
                </p>
                {lang === "en" && (
                  <p className="font-deva text-sm text-muted-foreground mt-2 italic">{ins.tipOfTheDayHi}</p>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-xs flex flex-col justify-center text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("Health score", "स्वास्थ्य अंक")}</div>
            <div className={cn("text-6xl font-bold tabular mt-2 leading-none", tone === "good" ? "text-[hsl(142,46%,30%)]" : tone === "warn" ? "text-[hsl(28,80%,40%)]" : "text-destructive")} data-testid="text-insights-score">
              {ins.healthScore}
            </div>
            <StatusBadge status={tone} className="mt-3 mx-auto" />
          </div>
        </div>

        {/* Predictions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{t("Predicted harvest", "अनुमानित कटाई")}</div>
            <div className="mt-2 text-xl font-bold tabular" data-testid="text-harvest">{formatDate(ins.predictedHarvestDate)}</div>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Coins className="h-3.5 w-3.5" />{t("Projected net margin", "अनुमानित शुद्ध लाभ")}</div>
            <div className={cn("mt-2 text-xl font-bold tabular", ins.projectedNetMargin >= 0 ? "text-[hsl(142,46%,30%)]" : "text-destructive")} data-testid="text-margin">
              {formatINRShort(ins.projectedNetMargin)}
            </div>
          </div>
        </div>

        {/* Benchmarks */}
        <div className="rounded-xl border bg-card p-5 shadow-xs mb-6">
          <h2 className="font-semibold text-base mb-3">{t("Regional benchmark", "क्षेत्रीय तुलना")}</h2>
          <div className="space-y-3">
            {ins.benchmarks.map((b) => {
              const Icon = b.comparison === "better" ? TrendingUp : b.comparison === "worse" ? TrendingDown : Minus;
              const color = b.comparison === "better" ? "text-[hsl(142,46%,30%)] bg-[hsl(142,42%,38%)]/15" : b.comparison === "worse" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted";
              const label = benchmarkLabels[b.metric] ?? { en: b.metric, hi: b.metric };
              return (
                <div key={b.metric} className="flex items-center gap-3" data-testid={`benchmark-${b.metric}`}>
                  <div className={cn("rounded-md p-2", color)}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{lang === "hi" ? label.hi : label.en}</div>
                    <div className="text-xs text-muted-foreground">{t("Region average", "क्षेत्र औसत")}: {b.regionalAverage} · {t("Percentile", "प्रतिशतक")}: {b.percentile}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular text-lg">{b.yourValue}</div>
                    <StatusBadge status={b.comparison} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active alerts */}
        <div className="rounded-xl border bg-card shadow-xs">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-base">{t("Active alerts", "सक्रिय सूचनाएँ")}</h2>
            <span className="text-xs text-muted-foreground">{ins.alerts.length}</span>
          </div>
          <div className="divide-y divide-border">
            {ins.alerts.length === 0 && <div className="p-6 text-sm text-center text-muted-foreground">{t("No active alerts. Keep going!", "कोई सूचना नहीं। शाबाश!")}</div>}
            {ins.alerts.map((a) => (
              <div key={a.id} className="px-5 py-4" data-testid={`insight-alert-${a.id}`}>
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-md p-2 shrink-0", a.severity === "critical" ? "bg-destructive/15 text-destructive" : a.severity === "warning" ? "bg-[hsl(38,90%,50%)]/15 text-[hsl(28,80%,32%)]" : "bg-muted text-muted-foreground")}><AlertTriangle className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={a.severity} />
                      <span className="text-xs text-muted-foreground">{a.alertType.replace(/_/g, " ")}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{lang === "hi" ? a.messageHi : a.messageEn}</p>
                    {lang === "en" && <p className="font-deva text-xs text-muted-foreground mt-0.5 italic">{a.messageHi}</p>}
                    {a.recommendation && <p className="text-xs text-foreground/80 mt-2 bg-muted rounded-md px-2.5 py-1.5">{t("Suggestion: ", "सुझाव: ")}{a.recommendation}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
