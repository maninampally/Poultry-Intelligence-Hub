import { Link } from "wouter";
import {
  useGetDashboardOverview,
  useGetDashboardActivity,
  useListBatches,
  useListAlerts,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateBatchDialog } from "@/components/dialogs/CreateBatchDialog";
import { KpiTrendChart } from "@/components/charts";
import {
  Bird,
  Wheat,
  HeartPulse,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatINRShort, formatNumber, formatPct, timeAgo } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: overview, isLoading } = useGetDashboardOverview();
  const { data: activity } = useGetDashboardActivity();
  const { data: batches } = useListBatches({ status: "active" });
  const { data: alerts } = useListAlerts();
  const { t } = useLang();

  const openAlerts = alerts?.filter((a) => !a.resolvedAt) ?? [];
  const criticalAlerts = openAlerts.filter((a) => a.severity === "critical");

  const today = new Date();
  const greeting = today.getHours() < 12 ? t("Good morning", "सुप्रभात") : today.getHours() < 17 ? t("Good afternoon", "नमस्कार") : t("Good evening", "शुभ संध्या");

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <PageHeader
          title={`${greeting}, farmer`}
          subtitle={
            <span className="font-deva text-sm">
              {t(
                "Here is what is happening across your farms today.",
                "आपके सभी खेतों की आज की रिपोर्ट यहाँ देखें।",
              )}
            </span>
          }
          actions={<CreateBatchDialog />}
        />

        {/* Critical alert banner */}
        {criticalAlerts.length > 0 && (
          <Link href="/alerts" asChild>
            <a
              data-testid="link-critical-banner"
              className="block mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 hover-elevate"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="rounded-lg bg-destructive/15 p-2 shrink-0">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-destructive text-sm">
                    {criticalAlerts.length} {t(
                      criticalAlerts.length === 1 ? "critical alert needs attention" : "critical alerts need attention",
                      "गंभीर सूचना पर ध्यान दें",
                    )}
                  </div>
                  <div className="text-xs text-foreground/80 mt-0.5 truncate">
                    {criticalAlerts[0].messageEn}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-destructive" />
              </div>
            </a>
          </Link>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </>
          ) : overview ? (
            <>
              <StatCard
                testId="stat-live-birds"
                tone="primary"
                label={t("Live birds", "जीवित पक्षी")}
                icon={Bird}
                value={formatNumber(overview.totalLiveBirds)}
                hint={`${overview.activeBatches} ${t("active batches", "सक्रिय बैच")} · ${overview.totalSheds} ${t("sheds", "शेड")}`}
              />
              <StatCard
                testId="stat-mortality"
                tone={overview.avgMortalityPct > 5 ? "bad" : overview.avgMortalityPct > 3 ? "warn" : "good"}
                label={t("Avg. mortality", "औसत मृत्यु दर")}
                icon={HeartPulse}
                value={formatPct(overview.avgMortalityPct, 2)}
                hint={`${overview.mortalityToday} ${t("today across farms", "आज सभी खेतों में")}`}
              />
              <StatCard
                testId="stat-fcr"
                tone={overview.avgFcr > 1.85 ? "warn" : "good"}
                label={t("Avg. FCR", "औसत FCR")}
                icon={Wheat}
                value={overview.avgFcr.toFixed(2)}
                hint={`${formatNumber(overview.feedConsumedToday)} ${t("kg feed today", "किग्रा फ़ीड आज")}`}
              />
              <StatCard
                testId="stat-revenue"
                tone="primary"
                label={t("Projected revenue", "अनुमानित आय")}
                icon={IndianRupee}
                value={formatINRShort(overview.projectedRevenue)}
                hint={t("If sold at today's market rate", "आज के बाज़ार भाव पर")}
              />
            </>
          ) : null}
        </div>

        {/* Mortality KPI trend + Active batches */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-1 rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("Mortality trend", "मृत्यु प्रवृत्ति")}
                </div>
                <div className="text-sm text-muted-foreground">{t("Last 14 days, all farms", "पिछले 14 दिन")}</div>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            {overview?.kpiTrend ? (
              <KpiTrendChart data={overview.kpiTrend} />
            ) : (
              <Skeleton className="h-[140px] rounded-md" />
            )}
          </div>

          <div className="lg:col-span-2 rounded-xl border bg-card shadow-xs">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-base">{t("Active batches", "सक्रिय बैच")}</h2>
              <Link href="/batches" asChild>
                <a className="text-xs text-primary hover:underline font-medium" data-testid="link-all-batches">{t("See all", "सब देखें")} →</a>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {batches?.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("No active batches yet — start one above.", "कोई सक्रिय बैच नहीं — ऊपर से शुरू करें।")}
                </div>
              )}
              {batches?.slice(0, 4).map((b) => {
                const fcrTone = b.fcr > 1.95 ? "bad" : b.fcr > 1.8 ? "warn" : "good";
                const mortTone = b.mortalityPct > 5 ? "bad" : b.mortalityPct > 3 ? "warn" : "good";
                return (
                  <Link key={b.id} href={`/batches/${b.id}`} asChild>
                    <a
                      data-testid={`link-batch-${b.batchCode}`}
                      className="flex items-center gap-3 sm:gap-4 px-5 py-4 hover-elevate"
                    >
                      <div className="hidden sm:flex flex-col items-center justify-center rounded-md bg-primary/8 text-primary w-12 h-12 shrink-0 border border-primary/15">
                        <div className="text-[10px] font-medium uppercase tracking-wider leading-none">Day</div>
                        <div className="text-lg font-bold tabular leading-none mt-0.5">{b.dayOfBatch}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold text-sm">{b.batchCode}</div>
                          <StatusBadge status={b.status} />
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {b.farmName} · {b.shedName} · {formatNumber(b.currentFlock)} {t("birds", "पक्षी")}
                        </div>
                      </div>
                      <div className="hidden md:grid grid-cols-3 gap-4 text-center shrink-0">
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">FCR</div>
                          <div className={cn("font-bold tabular text-sm", fcrTone === "bad" ? "text-destructive" : fcrTone === "warn" ? "text-[hsl(28,80%,40%)]" : "text-[hsl(142,46%,30%)]")}>{b.fcr.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Mort</div>
                          <div className={cn("font-bold tabular text-sm", mortTone === "bad" ? "text-destructive" : mortTone === "warn" ? "text-[hsl(28,80%,40%)]" : "text-[hsl(142,46%,30%)]")}>{b.mortalityPct.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Wt</div>
                          <div className="font-bold tabular text-sm">{b.avgWeight.toFixed(2)} kg</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </a>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity + Insights tip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border bg-card shadow-xs">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-base">{t("Recent activity", "हाल की गतिविधि")}</h2>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {activity?.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">{t("No activity yet.", "कोई गतिविधि नहीं।")}</div>
              )}
              {activity?.map((a, i) => {
                const colorByType: Record<string, string> = {
                  mortality: "bg-destructive/15 text-destructive",
                  feed: "bg-[hsl(42,78%,48%)]/15 text-[hsl(28,80%,32%)]",
                  weight: "bg-primary/10 text-primary",
                  cost: "bg-accent/15 text-[hsl(25,78%,38%)]",
                  vaccination: "bg-[hsl(200,40%,38%)]/15 text-[hsl(200,40%,32%)]",
                  sale: "bg-[hsl(142,42%,38%)]/15 text-[hsl(142,46%,26%)]",
                };
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3" data-testid={`activity-${i}`}>
                    <div className={cn("text-[10px] font-bold uppercase rounded-md px-2 py-1 shrink-0", colorByType[a.kind] ?? "bg-muted text-muted-foreground")}>
                      {a.kind}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground">{a.message}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{a.batchCode} · {a.farmName}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">{timeAgo(a.timestamp)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-primary/8 to-accent/10 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-md bg-primary/15 p-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-semibold text-sm">{t("Quick insights", "त्वरित सलाह")}</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg bg-card border p-3">
                <div className="text-xs font-medium text-muted-foreground">{t("Best performer", "सर्वश्रेष्ठ बैच")}</div>
                {batches && batches.length > 0 && (() => {
                  const best = [...batches].sort((a, b) => a.fcr - b.fcr)[0];
                  return (
                    <Link href={`/insights/${best.id}`} asChild>
                      <a className="block mt-1.5" data-testid="link-best-performer">
                        <div className="font-bold text-sm text-foreground">{best.batchCode}</div>
                        <div className="text-xs text-muted-foreground">FCR {best.fcr.toFixed(2)} · {best.farmName}</div>
                      </a>
                    </Link>
                  );
                })()}
              </div>
              <div className="rounded-lg bg-card border p-3">
                <div className="text-xs font-medium text-muted-foreground">{t("Needs attention", "ध्यान दें")}</div>
                {batches && batches.length > 0 && (() => {
                  const worst = [...batches].sort((a, b) => b.mortalityPct - a.mortalityPct)[0];
                  return (
                    <Link href={`/insights/${worst.id}`} asChild>
                      <a className="block mt-1.5" data-testid="link-worst-performer">
                        <div className="font-bold text-sm text-foreground">{worst.batchCode}</div>
                        <div className="text-xs text-muted-foreground">{worst.mortalityPct.toFixed(1)}% mortality · {worst.farmName}</div>
                      </a>
                    </Link>
                  );
                })()}
              </div>
              <p className="font-deva text-xs text-foreground/75 italic leading-relaxed pt-1">
                {t(
                  "Tip: Compare today's water intake to feed — water should be roughly 1.7× feed weight. Lower means heat stress is starting.",
                  "सुझाव: पानी की खपत फ़ीड का लगभग 1.7 गुना होनी चाहिए। कम होने पर गर्मी का तनाव शुरू हो रहा है।",
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
