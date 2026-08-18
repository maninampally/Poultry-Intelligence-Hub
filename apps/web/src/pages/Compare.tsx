import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  useListBatches,
  useGetBatchSummary,
  getListBatchesQueryKey,
  getGetBatchSummaryQueryKey,
  type BatchSummary,
  type BatchListItem,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X, GitCompareArrows, ChevronRight, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { formatINR, formatINRShort, formatNumber, formatPct, formatKg } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

const MAX_SLOTS = 3;

type Direction = "higherBetter" | "lowerBetter";

interface MetricRow {
  key: string;
  label: string;
  hi: string;
  direction: Direction;
  format: (v: number | null | undefined) => string;
  pick: (s: BatchSummary) => number | null | undefined;
  hint?: { en: string; hi: string };
}

const metrics: MetricRow[] = [
  {
    key: "healthScore",
    label: "Health score",
    hi: "स्वास्थ्य अंक",
    direction: "higherBetter",
    format: (v) => (v == null ? "—" : `${Math.round(v)}/100`),
    pick: (s) => s.healthScore,
    hint: { en: "Higher is better", hi: "ज़्यादा बेहतर" },
  },
  {
    key: "fcr",
    label: "FCR",
    hi: "FCR",
    direction: "lowerBetter",
    format: (v) => (v == null ? "—" : v.toFixed(2)),
    pick: (s) => s.fcr,
    hint: { en: "Lower is better", hi: "कम बेहतर" },
  },
  {
    key: "mortalityPct",
    label: "Mortality",
    hi: "मृत्यु दर",
    direction: "lowerBetter",
    format: (v) => (v == null ? "—" : formatPct(v)),
    pick: (s) => s.mortalityPct,
    hint: { en: "Lower is better", hi: "कम बेहतर" },
  },
  {
    key: "avgWeight",
    label: "Avg weight",
    hi: "औसत वज़न",
    direction: "higherBetter",
    format: (v) => (v == null ? "—" : formatKg(v)),
    pick: (s) => s.avgWeight,
  },
  {
    key: "weightDeviationPct",
    label: "Weight vs standard",
    hi: "मानक से अंतर",
    direction: "higherBetter",
    format: (v) => (v == null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`),
    pick: (s) => s.weightDeviationPct,
  },
  {
    key: "costPerBird",
    label: "Cost per bird",
    hi: "प्रति पक्षी खर्च",
    direction: "lowerBetter",
    format: (v) => (v == null ? "—" : formatINR(v)),
    pick: (s) => s.costPerBird,
  },
  {
    key: "totalCost",
    label: "Total cost so far",
    hi: "कुल खर्च",
    direction: "lowerBetter",
    format: (v) => (v == null ? "—" : formatINRShort(v)),
    pick: (s) => s.totalCost,
  },
  {
    key: "feedConsumedTotal",
    label: "Feed consumed",
    hi: "खपत फ़ीड",
    direction: "lowerBetter",
    format: (v) => (v == null ? "—" : `${formatNumber((v ?? 0) / 1000, 2)} t`),
    pick: (s) => s.feedConsumedTotal,
  },
  {
    key: "projectedMargin",
    label: "Projected margin",
    hi: "अनुमानित मार्जिन",
    direction: "higherBetter",
    format: (v) => (v == null ? "—" : formatINRShort(v)),
    pick: (s) => s.projectedMargin,
    hint: { en: "Higher is better", hi: "ज़्यादा बेहतर" },
  },
  {
    key: "currentFlock",
    label: "Live flock",
    hi: "जीवित पक्षी",
    direction: "higherBetter",
    format: (v) => (v == null ? "—" : formatNumber(v)),
    pick: (s) => s.currentFlock,
  },
  {
    key: "dayOfBatch",
    label: "Day of batch",
    hi: "बैच का दिन",
    direction: "higherBetter",
    format: (v) => (v == null ? "—" : `${v}`),
    pick: (s) => s.dayOfBatch,
  },
];

function bestIndex(values: (number | null | undefined)[], dir: Direction): number | null {
  const validIdx: number[] = [];
  values.forEach((v, i) => {
    if (typeof v === "number" && Number.isFinite(v)) validIdx.push(i);
  });
  if (validIdx.length < 2) return null;
  return validIdx.reduce((bestI, i) => {
    const v = values[i] as number;
    const b = values[bestI] as number;
    if (dir === "higherBetter") return v > b ? i : bestI;
    return v < b ? i : bestI;
  }, validIdx[0]);
}

function worstIndex(values: (number | null | undefined)[], dir: Direction): number | null {
  return bestIndex(values, dir === "higherBetter" ? "lowerBetter" : "higherBetter");
}

export default function Compare() {
  const { t, lang } = useLang();
  const { data: allBatches } = useListBatches({}, { query: { queryKey: getListBatchesQueryKey({}) } });
  const search = useSearch();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("ids");
    if (fromUrl) {
      return fromUrl.split(",").filter(Boolean).slice(0, MAX_SLOTS);
    }
    const saved = window.localStorage.getItem("murgi:compare:selected");
    if (!saved) return [];
    try {
      return JSON.parse(saved) as string[];
    } catch {
      return [];
    }
  });

  // React to URL changes after initial mount
  useEffect(() => {
    const params = new URLSearchParams(search);
    const fromUrl = params.get("ids");
    if (fromUrl) {
      const ids = fromUrl.split(",").filter(Boolean).slice(0, MAX_SLOTS);
      setSelectedIds(ids);
    }
  }, [search]);

  const persist = (ids: string[]) => {
    setSelectedIds(ids);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("murgi:compare:selected", JSON.stringify(ids));
    }
  };

  const addBatch = (id: string) => {
    if (selectedIds.includes(id) || selectedIds.length >= MAX_SLOTS) return;
    persist([...selectedIds, id]);
  };
  const removeBatch = (id: string) => persist(selectedIds.filter((x) => x !== id));
  const reset = () => persist([]);

  // Always call the same number of hooks (rules of hooks). Pad with empty IDs.
  const id0 = selectedIds[0] ?? "";
  const id1 = selectedIds[1] ?? "";
  const id2 = selectedIds[2] ?? "";
  const q0 = useGetBatchSummary(id0, { query: { queryKey: getGetBatchSummaryQueryKey(id0), enabled: !!id0 } });
  const q1 = useGetBatchSummary(id1, { query: { queryKey: getGetBatchSummaryQueryKey(id1), enabled: !!id1 } });
  const q2 = useGetBatchSummary(id2, { query: { queryKey: getGetBatchSummaryQueryKey(id2), enabled: !!id2 } });
  const summaries = [q0, q1, q2].slice(0, selectedIds.length);

  const loading = summaries.some((q) => q.isLoading);
  const summaryData = summaries.map((q) => q.data).filter(Boolean) as BatchSummary[];

  const candidates: BatchListItem[] = useMemo(
    () => (allBatches ?? []).filter((b) => !selectedIds.includes(b.id)),
    [allBatches, selectedIds],
  );

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <PageHeader
          title={t("Compare batches", "बैच तुलना")}
          subtitle={t(
            `Stack up to ${MAX_SLOTS} batches side-by-side to spot what's working`,
            `${MAX_SLOTS} बैच तक एक-दूसरे के बगल में रखकर देखें क्या काम कर रहा है`,
          )}
          actions={
            selectedIds.length > 0 ? (
              <Button variant="outline" size="sm" onClick={reset} data-testid="button-reset-compare" className="gap-1.5">
                <X className="h-3.5 w-3.5" /> {t("Clear all", "सब हटाएँ")}
              </Button>
            ) : null
          }
        />

        {selectedIds.length === 0 ? (
          <EmptyState candidates={candidates} addBatch={addBatch} t={t} />
        ) : (
          <>
            {/* Slot row with header cards */}
            <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: `220px repeat(${selectedIds.length}, minmax(0, 1fr)) ${selectedIds.length < MAX_SLOTS ? "220px" : ""}` }}>
              <div />
              {selectedIds.map((id, i) => {
                const sum = summaries[i].data;
                if (!sum) {
                  return <Skeleton key={id} className="h-32 rounded-xl" />;
                }
                return (
                  <div key={id} className="rounded-xl border bg-card shadow-xs p-4 relative" data-testid={`compare-slot-${i}`}>
                    <button
                      onClick={() => removeBatch(id)}
                      className="absolute top-2 right-2 rounded-md p-1 hover-elevate"
                      data-testid={`button-remove-${i}`}
                      aria-label="Remove batch"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-base font-extrabold tabular tracking-tight">{sum.batch.batchCode}</div>
                      <StatusBadge status={sum.batch.status} />
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{sum.farmName}</div>
                    <div className="text-xs text-muted-foreground truncate">{sum.shedName} · {sum.batch.breed}</div>
                    <Link href={`/batches/${id}`} asChild>
                      <a className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline" data-testid={`link-open-batch-${i}`}>
                        {t("Open batch", "बैच खोलें")} <ArrowRight className="h-3 w-3" />
                      </a>
                    </Link>
                  </div>
                );
              })}
              {selectedIds.length < MAX_SLOTS && (
                <AddSlot candidates={candidates} addBatch={addBatch} t={t} />
              )}
            </div>

            {/* Comparison table */}
            {loading && summaryData.length === 0 ? (
              <Skeleton className="h-96 rounded-xl" />
            ) : (
              <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/30 flex items-center gap-2">
                  <GitCompareArrows className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">{t("Side-by-side metrics", "तुलनात्मक मीट्रिक्स")}</h2>
                  <span className="text-xs text-muted-foreground ml-auto inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[hsl(142,42%,38%)]" /> {t("Best", "सर्वश्रेष्ठ")}</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/80" /> {t("Worst", "सबसे कमज़ोर")}</span>
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody className="divide-y">
                      {metrics.map((m) => {
                        const values = summaryData.map((s) => m.pick(s));
                        const showCompare = summaryData.length >= 2;
                        const bestI = showCompare ? bestIndex(values, m.direction) : null;
                        const worstI = showCompare ? worstIndex(values, m.direction) : null;
                        return (
                          <tr key={m.key} data-testid={`metric-row-${m.key}`}>
                            <td className="px-5 py-3 w-[220px] align-top">
                              <div className="font-semibold text-sm">{t(m.label, m.hi)}</div>
                              {m.hint && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {lang === "en" ? m.hint.en : m.hint.hi}
                                </div>
                              )}
                            </td>
                            {summaryData.map((s, i) => {
                              const v = values[i];
                              const isBest = bestI === i;
                              const isWorst = worstI === i && bestI !== i;
                              return (
                                <td
                                  key={s.batch.id}
                                  className={cn(
                                    "px-5 py-3 tabular text-base font-bold align-top",
                                    isBest && "bg-[hsl(142,42%,38%)]/8",
                                    isWorst && "bg-destructive/5",
                                  )}
                                  data-testid={`metric-cell-${m.key}-${i}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        isBest && "text-[hsl(142,46%,26%)]",
                                        isWorst && "text-destructive",
                                      )}
                                    >
                                      {m.format(v)}
                                    </span>
                                    {isBest && <TrendingUp className="h-3.5 w-3.5 text-[hsl(142,46%,32%)]" />}
                                    {isWorst && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                                    {!isBest && !isWorst && showCompare && typeof v === "number" && (
                                      <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {selectedIds.length < MAX_SLOTS && <td className="px-5 py-3 w-[220px]" />}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {summaryData.length >= 2 && <WinnerCard summaries={summaryData} t={t} />}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({
  candidates,
  addBatch,
  t,
}: {
  candidates: BatchListItem[];
  addBatch: (id: string) => void;
  t: (en: string, hi: string) => string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed bg-card/40 p-10 text-center">
      <div className="mx-auto rounded-full bg-primary/10 text-primary h-14 w-14 flex items-center justify-center">
        <GitCompareArrows className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold">{t("Pick batches to compare", "तुलना के लिए बैच चुनें")}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        {t(
          "Select two or three batches and we'll line up FCR, mortality, cost-per-bird and profit so you can see what's working.",
          "दो या तीन बैच चुनें और हम FCR, मृत्यु दर, प्रति पक्षी खर्च और लाभ की तुलना दिखाएँगे।",
        )}
      </p>
      <div className="mt-5 inline-flex">
        <AddSlot candidates={candidates} addBatch={addBatch} t={t} compact />
      </div>
      {candidates.length > 0 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 text-left">
            {t("Quick add from active batches", "सक्रिय बैच जल्दी जोड़ें")}
          </div>
          <div className="flex flex-wrap gap-2 justify-start">
            {candidates.slice(0, 6).map((b) => (
              <button
                key={b.id}
                onClick={() => addBatch(b.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border bg-card hover-elevate inline-flex items-center gap-1.5"
                data-testid={`quick-add-${b.id}`}
              >
                <Plus className="h-3 w-3" /> {b.batchCode} <span className="text-muted-foreground">· {b.farmName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AddSlot({
  candidates,
  addBatch,
  t,
  compact = false,
}: {
  candidates: BatchListItem[];
  addBatch: (id: string) => void;
  t: (en: string, hi: string) => string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "rounded-xl border-2 border-dashed text-muted-foreground hover-elevate transition-colors flex flex-col items-center justify-center gap-1",
            compact ? "px-5 py-3 flex-row gap-2 border" : "h-32",
          )}
          data-testid="button-add-slot"
        >
          <Plus className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
          <span className="text-sm font-semibold">{t("Add batch", "बैच जोड़ें")}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0 overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("Select a batch", "बैच चुनें")}
        </div>
        {candidates.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {t("No more batches available.", "कोई और बैच नहीं।")}
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y">
            {candidates.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  addBatch(b.id);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover-elevate flex items-center gap-3"
                data-testid={`option-batch-${b.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm tabular">{b.batchCode}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{b.farmName} · {b.shedName} · {b.breed}</div>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={b.status} />
                  <div className="text-[10px] text-muted-foreground mt-0.5 tabular">
                    {t("Day", "दिन")} {b.dayOfBatch}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function WinnerCard({
  summaries,
  t,
}: {
  summaries: BatchSummary[];
  t: (en: string, hi: string) => string;
}) {
  // Score each batch on key metrics
  const scores = summaries.map((s) => {
    let pts = 0;
    pts += (s.healthScore ?? 0);
    pts -= (s.fcr ?? 3) * 20;
    pts -= (s.mortalityPct ?? 0) * 3;
    pts += (s.weightDeviationPct ?? 0);
    return { id: s.batch.id, code: s.batch.batchCode, farm: s.farmName, pts };
  });
  const sorted = [...scores].sort((a, b) => b.pts - a.pts);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];
  if (!winner || winner === loser) return null;

  return (
    <div className="mt-5 rounded-xl border bg-gradient-to-br from-primary/8 to-accent/10 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-primary mb-2">
        <TrendingUp className="h-4 w-4" />
        {t("Overall winner", "कुल मिलाकर विजेता")}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold tabular tracking-tight">{winner.code}</div>
          <div className="text-sm text-muted-foreground">{winner.farm}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t("Edges out", "आगे")}
          </div>
          <div className="text-sm font-semibold tabular">{loser.code}</div>
          <div className="text-[11px] text-muted-foreground">{loser.farm}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-foreground/80">
        {t(
          `Based on a weighted blend of health score, FCR, mortality, and weight gain. Replicate ${winner.code}'s practices in your other sheds.`,
          `स्वास्थ्य अंक, FCR, मृत्यु दर और वज़न वृद्धि के मिश्रण पर आधारित। ${winner.code} के तरीकों को अन्य शेड में अपनाएँ।`,
        )}
      </p>
    </div>
  );
}
