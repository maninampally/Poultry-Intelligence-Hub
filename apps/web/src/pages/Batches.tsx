import { useState } from "react";
import { Link } from "wouter";
import { useListBatches, useListFarms, type ListBatchesParams } from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { CreateBatchDialog } from "@/components/dialogs/CreateBatchDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Bird } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/utils";

export default function Batches() {
  const [farmId, setFarmId] = useState<string>("__all");
  const [status, setStatus] = useState<NonNullable<ListBatchesParams["status"]> | "__all">("__all");
  const params: ListBatchesParams = {};
  if (farmId !== "__all") params.farmId = farmId;
  if (status !== "__all") params.status = status;
  const { data: batches, isLoading } = useListBatches(params);
  const { data: farms } = useListFarms();
  const { t } = useLang();

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <PageHeader
          title={t("Batches", "बैच")}
          subtitle={t("Every flock you have raised — past and present", "आपके सभी बैच — पुराने और नए")}
          actions={<CreateBatchDialog />}
        />

        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={farmId} onValueChange={setFarmId}>
            <SelectTrigger data-testid="select-batches-farm" className="w-[200px]"><SelectValue placeholder="All farms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("All farms", "सभी खेत")}</SelectItem>
              {farms?.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger data-testid="select-batches-status" className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("All statuses", "सभी स्थिति")}</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="harvesting">Harvesting</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-md" />)}</div>
          ) : batches?.length === 0 ? (
            <div className="p-12 text-center"><Bird className="h-10 w-10 mx-auto text-muted-foreground/60" /><p className="mt-3 font-semibold">{t("No batches match these filters.", "इन फ़िल्टर्स से कोई बैच नहीं।")}</p></div>
          ) : (
            <div className="divide-y divide-border">
              {/* Header row (desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 bg-muted/40 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                <div className="col-span-3">{t("Batch", "बैच")}</div>
                <div className="col-span-2">{t("Farm / shed", "खेत / शेड")}</div>
                <div className="col-span-1 text-center">Day</div>
                <div className="col-span-1 text-right">Birds</div>
                <div className="col-span-1 text-right">Mort %</div>
                <div className="col-span-1 text-right">FCR</div>
                <div className="col-span-1 text-right">Wt (kg)</div>
                <div className="col-span-2 text-right pr-2">Status</div>
              </div>
              {batches?.map((b) => {
                const fcrTone = b.fcr > 1.95 ? "text-destructive" : b.fcr > 1.8 ? "text-[hsl(28,80%,40%)]" : "text-[hsl(142,46%,30%)]";
                const mortTone = b.mortalityPct > 5 ? "text-destructive" : b.mortalityPct > 3 ? "text-[hsl(28,80%,40%)]" : "text-[hsl(142,46%,30%)]";
                return (
                  <Link key={b.id} href={`/batches/${b.id}`} asChild>
                    <a className="block hover-elevate" data-testid={`row-batch-${b.batchCode}`}>
                      {/* Mobile */}
                      <div className="md:hidden px-4 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2"><span className="font-semibold text-sm">{b.batchCode}</span><StatusBadge status={b.status} /></div>
                          <div className="font-bold tabular text-xs">D{b.dayOfBatch}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{b.farmName} · {b.shedName}</div>
                        <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/60">
                          <div><div className="text-[10px] uppercase text-muted-foreground">Birds</div><div className="font-bold tabular text-xs">{formatNumber(b.currentFlock)}</div></div>
                          <div><div className="text-[10px] uppercase text-muted-foreground">FCR</div><div className={cn("font-bold tabular text-xs", fcrTone)}>{b.fcr.toFixed(2)}</div></div>
                          <div><div className="text-[10px] uppercase text-muted-foreground">Mort</div><div className={cn("font-bold tabular text-xs", mortTone)}>{b.mortalityPct.toFixed(1)}%</div></div>
                          <div><div className="text-[10px] uppercase text-muted-foreground">Wt</div><div className="font-bold tabular text-xs">{b.avgWeight.toFixed(2)}</div></div>
                        </div>
                      </div>
                      {/* Desktop */}
                      <div className="hidden md:grid grid-cols-12 gap-3 items-center px-5 py-3.5 text-sm">
                        <div className="col-span-3 flex items-center gap-2"><span className="font-semibold">{b.batchCode}</span><span className="text-xs text-muted-foreground">{b.breed}</span></div>
                        <div className="col-span-2 truncate"><div className="text-sm truncate">{b.farmName}</div><div className="text-xs text-muted-foreground truncate">{b.shedName}</div></div>
                        <div className="col-span-1 text-center font-bold tabular">{b.dayOfBatch}</div>
                        <div className="col-span-1 text-right font-bold tabular">{formatNumber(b.currentFlock)}</div>
                        <div className={cn("col-span-1 text-right font-bold tabular", mortTone)}>{b.mortalityPct.toFixed(1)}</div>
                        <div className={cn("col-span-1 text-right font-bold tabular", fcrTone)}>{b.fcr.toFixed(2)}</div>
                        <div className="col-span-1 text-right font-bold tabular">{b.avgWeight.toFixed(2)}</div>
                        <div className="col-span-2 flex items-center justify-end gap-2 pr-2"><StatusBadge status={b.status} /><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
