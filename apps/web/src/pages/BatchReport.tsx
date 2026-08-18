import { useRoute, Link } from "wouter";
import {
  useGetBatchSummary,
  useListSales,
  useGetVaccinationSchedule,
  getGetBatchSummaryQueryKey,
  getListSalesQueryKey,
  getGetVaccinationScheduleQueryKey,
} from "@murgi-mitra/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Printer, Sparkles } from "lucide-react";
import { Wordmark } from "@/components/Brand";
import { formatINR, formatINRShort, formatNumber, formatPct, formatKg, formatDate } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

const costCatLabel: Record<string, string> = {
  chick: "Chick",
  feed: "Feed",
  medicine: "Medicine",
  labor: "Labor",
  utilities: "Utilities",
  equipment: "Equipment",
  misc: "Misc",
};

export default function BatchReport() {
  const [, params] = useRoute("/batches/:batchId/report");
  const batchId = params?.batchId ?? "";
  const { t, lang } = useLang();

  const { data: summary, isLoading } = useGetBatchSummary(batchId, {
    query: { queryKey: getGetBatchSummaryQueryKey(batchId), enabled: !!batchId },
  });
  const { data: sales } = useListSales(batchId, {
    query: { queryKey: getListSalesQueryKey(batchId), enabled: !!batchId },
  });
  const { data: vaccines } = useGetVaccinationSchedule(batchId, {
    query: { queryKey: getGetVaccinationScheduleQueryKey(batchId), enabled: !!batchId },
  });

  if (isLoading || !summary) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-[900px] mx-auto">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-48 mb-4" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { batch, farmName, shedName, dayOfBatch, currentFlock, mortalityPct, fcr, avgWeight, totalCost, costPerBird, projectedMargin, costBreakdown, feedConsumedTotal, standardWeight, weightDeviationPct, healthScore, breakEvenPricePerKg } = summary;

  const placedCount = batch.placementCount;
  const mortalityCount = placedCount - currentFlock;

  const totalSold = (sales ?? []).reduce((s, x) => s + x.birdsSold, 0);
  const totalRevenue = (sales ?? []).reduce((s, x) => s + (x.revenue ?? 0), 0);
  const totalSoldWeight = (sales ?? []).reduce((s, x) => s + x.totalWeightKg, 0);
  const avgPricePerKg = totalSoldWeight > 0 ? totalRevenue / totalSoldWeight : 0;

  const remaining = currentFlock - totalSold;
  const projectedRevenueRemaining = remaining * avgWeight * (avgPricePerKg || 110);
  const totalProjectedRevenue = totalRevenue + projectedRevenueRemaining;
  const profitOrLoss = totalProjectedRevenue - totalCost;
  const profitPerBird = placedCount > 0 ? profitOrLoss / placedCount : 0;

  const completedVaccines = (vaccines ?? []).filter((v) => v.status === "completed").length;
  const totalVaccines = (vaccines ?? []).length;

  const today = new Date();

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="max-w-[900px] mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Link href={`/batches/${batchId}`} asChild>
            <a className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover-elevate -ml-2 px-2 py-1 rounded-md" data-testid="link-back-batch">
              <ChevronLeft className="h-3.5 w-3.5" /> {t("Back to batch", "बैच पर लौटें")}
            </a>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {t("Generated", "तैयार किया")} {formatDate(today)}
            </span>
            <Button
              size="sm"
              onClick={() => window.print()}
              data-testid="button-print-report"
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> {t("Print / Save PDF", "प्रिंट / PDF")}
            </Button>
          </div>
        </div>
      </div>

      {/* The report sheet */}
      <div className="max-w-[900px] mx-auto px-6 sm:px-10 py-8 print:py-6 print:px-8">
        {/* Letterhead */}
        <header className="flex items-start justify-between gap-6 pb-5 border-b-2 border-primary/30">
          <div>
            <Wordmark />
            <p className="mt-2 text-xs text-muted-foreground max-w-md">
              {t(
                "Smart broiler farm management for Indian poultry farmers.",
                "भारतीय पोल्ट्री किसानों के लिए स्मार्ट ब्रॉयलर फार्म प्रबंधन।",
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("Closure report", "समापन रिपोर्ट")}
            </div>
            <div className="text-2xl font-extrabold tabular tracking-tight mt-0.5">{batch.batchCode}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-deva">
              बैच रिपोर्ट · {formatDate(today)}
            </div>
          </div>
        </header>

        {/* Batch identity */}
        <section className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ReportField label={t("Farm", "खेत")} value={farmName ?? "—"} />
          <ReportField label={t("Shed", "शेड")} value={shedName ?? "—"} />
          <ReportField label={t("Breed", "नस्ल")} value={batch.breed} />
          <ReportField label={t("Contract", "अनुबंध")} value={batch.contractType === "integrator" ? t("Integrator", "इंटीग्रेटर") : t("Own", "स्वयं")} />
          <ReportField label={t("Chick supplier", "चूज़ा सप्लायर")} value={batch.chickSupplier ?? "—"} />
          <ReportField label={t("Placed", "रखे")} value={`${formatNumber(placedCount)} ${t("birds", "पक्षी")}`} />
          <ReportField label={t("Start date", "शुरुआत")} value={formatDate(batch.startDate)} />
          <ReportField label={t("Day of batch", "बैच का दिन")} value={`${dayOfBatch}`} />
        </section>

        {/* Headline KPIs */}
        <section className="mt-6 rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">{t("Final performance", "अंतिम प्रदर्शन")}</h2>
            <div className="text-xs">
              <span className="text-muted-foreground">{t("Health score", "स्वास्थ्य अंक")}: </span>
              <span className={cn("font-bold tabular", healthScore >= 80 ? "text-[hsl(142,46%,32%)]" : healthScore >= 60 ? "text-[hsl(28,80%,38%)]" : "text-destructive")}>
                {healthScore}/100
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Kpi label={t("Live flock", "जीवित पक्षी")} value={formatNumber(currentFlock)} sub={`${t("of", "में से")} ${formatNumber(placedCount)}`} />
            <Kpi label={t("Mortality", "मृत्यु दर")} value={formatPct(mortalityPct)} sub={`${formatNumber(mortalityCount)} ${t("died", "मरे")}`} />
            <Kpi label="FCR" value={fcr.toFixed(2)} sub={`${formatNumber(feedConsumedTotal / 1000, 1)} t ${t("feed", "फ़ीड")}`} />
            <Kpi label={t("Avg weight", "औसत वज़न")} value={formatKg(avgWeight)} sub={`${formatPct(weightDeviationPct)} vs ${batch.breed}`} />
          </div>
        </section>

        {/* Cost breakdown */}
        <section className="mt-6">
          <h2 className="text-base font-bold mb-3">{t("Cost breakdown", "खर्च विवरण")}</h2>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">{t("Category", "श्रेणी")}</th>
                  <th className="text-right px-4 py-2 font-semibold">{t("Amount", "रकम")}</th>
                  <th className="text-right px-4 py-2 font-semibold">{t("Share", "हिस्सा")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {costBreakdown.map((c) => (
                  <tr key={c.category} data-testid={`cost-row-${c.category}`}>
                    <td className="px-4 py-2.5 font-medium">{costCatLabel[c.category] ?? c.category}</td>
                    <td className="px-4 py-2.5 text-right tabular">{formatINR(c.amount)}</td>
                    <td className="px-4 py-2.5 text-right tabular text-muted-foreground">{c.pctOfTotal.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 font-bold">
                <tr>
                  <td className="px-4 py-2.5">{t("Total cost", "कुल खर्च")}</td>
                  <td className="px-4 py-2.5 text-right tabular">{formatINR(totalCost)}</td>
                  <td className="px-4 py-2.5 text-right tabular">100%</td>
                </tr>
                <tr className="border-t border-border/70">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">{t("Cost per bird", "प्रति पक्षी खर्च")}</td>
                  <td className="px-4 py-2.5 text-right tabular text-muted-foreground" colSpan={2}>{formatINR(costPerBird)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">{t("Break-even price / kg", "ब्रेक-ईवन मूल्य / किलो")}</td>
                  <td className="px-4 py-2.5 text-right tabular text-muted-foreground" colSpan={2}>{formatINR(breakEvenPricePerKg)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Sales */}
        <section className="mt-6">
          <h2 className="text-base font-bold mb-3">{t("Sales register", "बिक्री रजिस्टर")}</h2>
          {!sales || sales.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("No sales recorded yet for this batch.", "इस बैच के लिए अभी कोई बिक्री दर्ज नहीं है।")}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">{t("Date", "तारीख")}</th>
                    <th className="text-left px-4 py-2 font-semibold">{t("Buyer", "खरीदार")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("Birds", "पक्षी")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("Weight", "वज़न")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("₹/kg", "₹/किलो")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("Revenue", "आय")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((s) => (
                    <tr key={s.id} data-testid={`sale-row-${s.id}`}>
                      <td className="px-4 py-2.5">{formatDate(s.saleDate)}</td>
                      <td className="px-4 py-2.5">{s.buyer ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular">{formatNumber(s.birdsSold)}</td>
                      <td className="px-4 py-2.5 text-right tabular">{formatNumber(s.totalWeightKg, 0)} kg</td>
                      <td className="px-4 py-2.5 text-right tabular">{formatINR(s.pricePerKg)}</td>
                      <td className="px-4 py-2.5 text-right tabular font-semibold">{formatINR(s.revenue ?? s.birdsSold * s.totalWeightKg * s.pricePerKg / Math.max(s.birdsSold, 1))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-bold">
                  <tr>
                    <td className="px-4 py-2.5" colSpan={2}>{t("Sold so far", "अब तक बिका")}</td>
                    <td className="px-4 py-2.5 text-right tabular">{formatNumber(totalSold)}</td>
                    <td className="px-4 py-2.5 text-right tabular">{formatNumber(totalSoldWeight, 0)} kg</td>
                    <td className="px-4 py-2.5 text-right tabular">{avgPricePerKg ? formatINR(avgPricePerKg) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular">{formatINR(totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {/* Profitability */}
        <section className="mt-6 rounded-xl border-2 p-5" style={{ borderColor: profitOrLoss >= 0 ? "hsl(142, 30%, 60%)" : "hsl(0, 60%, 70%)" }}>
          <h2 className="text-base font-bold mb-4">{t("Profitability summary", "लाभ-हानि सारांश")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Kpi label={t("Revenue (booked)", "आय (दर्ज)")} value={formatINRShort(totalRevenue)} />
            <Kpi label={t("Revenue (projected)", "अनुमानित आय")} value={formatINRShort(totalProjectedRevenue)} sub={`${t("incl.", "शामिल")} ${formatNumber(remaining)} ${t("unsold", "बिना बिके")}`} />
            <Kpi label={t("Total cost", "कुल खर्च")} value={formatINRShort(totalCost)} />
            <Kpi
              label={profitOrLoss >= 0 ? t("Projected profit", "अनुमानित लाभ") : t("Projected loss", "अनुमानित हानि")}
              value={formatINRShort(Math.abs(profitOrLoss))}
              sub={`${formatINR(Math.abs(profitPerBird))} ${t("per bird", "प्रति पक्षी")}`}
              tone={profitOrLoss >= 0 ? "good" : "bad"}
            />
          </div>
          {projectedMargin !== null && projectedMargin !== undefined && (
            <p className="mt-3 text-xs text-muted-foreground">
              {t("System estimate of projected margin at planned sale date:", "नियोजित बिक्री तिथि पर अनुमानित मार्जिन:")} <span className="font-semibold tabular">{formatINR(projectedMargin)}</span>
            </p>
          )}
        </section>

        {/* Vaccination compliance */}
        <section className="mt-6">
          <h2 className="text-base font-bold mb-3">
            {t("Vaccination compliance", "टीकाकरण अनुपालन")}{" "}
            <span className="text-xs font-medium text-muted-foreground">
              ({completedVaccines}/{totalVaccines} {t("done", "पूर्ण")})
            </span>
          </h2>
          {!vaccines || vaccines.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("No vaccination schedule yet.", "अभी टीकाकरण कार्यक्रम नहीं है।")}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">{t("Vaccine", "टीका")}</th>
                    <th className="text-left px-4 py-2 font-semibold">{t("Route", "मार्ग")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("Day", "दिन")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("Due", "नियत")}</th>
                    <th className="text-right px-4 py-2 font-semibold">{t("Status", "स्थिति")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vaccines.map((v, i) => (
                    <tr key={i} data-testid={`vacc-row-${i}`}>
                      <td className="px-4 py-2 font-medium">{v.vaccineName}</td>
                      <td className="px-4 py-2 text-muted-foreground">{v.route ?? "—"}</td>
                      <td className="px-4 py-2 text-right tabular">{v.dueDay}</td>
                      <td className="px-4 py-2 text-right tabular">{formatDate(v.dueDate)}</td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-0.5",
                            v.status === "completed" && "bg-[hsl(142,42%,38%)]/15 text-[hsl(142,46%,26%)]",
                            v.status === "overdue" && "bg-destructive/15 text-destructive",
                            v.status === "due" && "bg-[hsl(42,78%,48%)]/15 text-[hsl(28,80%,32%)]",
                            v.status === "upcoming" && "bg-muted text-muted-foreground",
                          )}
                        >
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {batch.notes && (
          <section className="mt-6">
            <h2 className="text-base font-bold mb-2">{t("Notes", "टिप्पणियाँ")}</h2>
            <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground">
              {batch.notes}
            </div>
          </section>
        )}

        {/* Signature block */}
        <section className="mt-10 grid grid-cols-2 gap-10 print:break-inside-avoid">
          <div>
            <div className="border-t-2 border-foreground/40 pt-1 text-xs text-muted-foreground">
              {t("Farmer signature", "किसान के हस्ताक्षर")}
            </div>
            <div className="mt-3 text-xs">
              <div className="font-semibold">{t("Name", "नाम")}: ____________________</div>
              <div className="mt-2 font-semibold">{t("Date", "तारीख")}: ____________________</div>
            </div>
          </div>
          <div>
            <div className="border-t-2 border-foreground/40 pt-1 text-xs text-muted-foreground">
              {t("Integrator / Buyer signature", "इंटीग्रेटर / खरीदार के हस्ताक्षर")}
            </div>
            <div className="mt-3 text-xs">
              <div className="font-semibold">{t("Name", "नाम")}: ____________________</div>
              <div className="mt-2 font-semibold">{t("Date", "तारीख")}: ____________________</div>
            </div>
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>
            {t("Generated by", "द्वारा तैयार")} <span className="font-semibold">Murgi Mitra</span> · {formatDate(today)} · {lang === "en" ? "EN" : "हिं"}
          </span>
        </footer>
      </div>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-semibold mt-0.5 break-words">{value}</div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div
        className={cn(
          "text-2xl font-extrabold tabular mt-1",
          tone === "good" && "text-[hsl(142,46%,26%)]",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
