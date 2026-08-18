import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAlerts,
  useResolveAlert,
  getListAlertsQueryKey,
  getGetDashboardOverviewQueryKey,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { timeAgo, formatDate } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Alerts() {
  const [view, setView] = useState<"open" | "resolved">("open");
  const { data: alerts, isLoading } = useListAlerts();
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const { toast } = useToast();
  const resolve = useResolveAlert({
    mutation: {
      onSuccess: () => {
        toast({ title: t("Alert resolved", "सूचना हल हो गई") });
        qc.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });

  const filtered = alerts?.filter((a) => (view === "open" ? !a.resolvedAt : !!a.resolvedAt)) ?? [];
  const sorted = [...filtered].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 } as const;
    if (a.severity !== b.severity) return order[a.severity] - order[b.severity];
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-5xl mx-auto">
        <PageHeader
          title={t("Alerts", "सूचनाएँ")}
          subtitle={t("Things to watch out for across all your batches", "आपके सभी बैच के लिए ज़रूरी सूचनाएँ")}
        />

        <Tabs value={view} onValueChange={(v) => setView(v as "open" | "resolved")} className="mb-4">
          <TabsList>
            <TabsTrigger value="open" data-testid="tab-alerts-open">{t("Open", "खुले")} ({alerts?.filter((a) => !a.resolvedAt).length ?? 0})</TabsTrigger>
            <TabsTrigger value="resolved" data-testid="tab-alerts-resolved">{t("Resolved", "हल हो गए")} ({alerts?.filter((a) => a.resolvedAt).length ?? 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed bg-card p-12 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-[hsl(142,46%,30%)]" />
            <p className="mt-3 font-semibold">{view === "open" ? t("All clear!", "सब ठीक है!") : t("No resolved alerts yet.", "अभी हल नहीं हुई।")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{view === "open" ? t("Your farms are running smoothly.", "आपके खेत सही चल रहे हैं।") : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((a) => (
              <div key={a.id} className={cn("rounded-xl border bg-card shadow-xs p-4 sm:p-5", a.severity === "critical" && !a.resolvedAt ? "border-destructive/40" : "")} data-testid={`alert-${a.id}`}>
                <div className="flex items-start gap-3">
                  <div className={cn("rounded-lg p-2 shrink-0", a.severity === "critical" ? "bg-destructive/15 text-destructive" : a.severity === "warning" ? "bg-[hsl(38,90%,50%)]/15 text-[hsl(28,80%,32%)]" : "bg-muted text-muted-foreground")}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={a.severity} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{a.alertType.replace(/_/g, " ")}</span>
                      <Link href={`/batches/${a.batchId}`} asChild>
                        <a className="text-xs text-primary hover:underline font-semibold">{a.batchCode}</a>
                      </Link>
                      <span className="text-xs text-muted-foreground">· {a.farmName}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">{lang === "hi" ? a.messageHi : a.messageEn}</p>
                    {lang === "en" && <p className="font-deva text-xs text-muted-foreground mt-0.5 italic">{a.messageHi}</p>}
                    {a.recommendation && <p className="text-xs text-foreground/80 mt-2 bg-muted rounded-md px-2.5 py-1.5">{t("Suggestion: ", "सुझाव: ")}{a.recommendation}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">{a.resolvedAt ? `${t("Resolved", "हल")} ${timeAgo(a.resolvedAt)}` : `${t("Raised", "जारी")} ${timeAgo(a.createdAt)} · ${formatDate(a.createdAt)}`}</span>
                      <div className="flex gap-2">
                        <Link href={`/insights/${a.batchId}`} asChild>
                          <a><Button variant="ghost" size="sm" className="text-xs gap-1" data-testid={`button-alert-insights-${a.id}`}>{t("Insights", "सलाह")}<ArrowRight className="h-3 w-3" /></Button></a>
                        </Link>
                        {!a.resolvedAt && (
                          <Button variant="outline" size="sm" onClick={() => resolve.mutate({ alertId: a.id })} disabled={resolve.isPending} data-testid={`button-resolve-${a.id}`}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{t("Mark resolved", "हल करें")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
