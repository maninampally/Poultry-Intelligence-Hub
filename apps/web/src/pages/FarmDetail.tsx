import { Link, useRoute } from "wouter";
import {
  useGetFarm,
  useListSheds,
  useListBatches,
  getGetFarmQueryKey,
  getListShedsQueryKey,
  getListBatchesQueryKey,
} from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateShedDialog } from "@/components/dialogs/CreateShedDialog";
import { CreateBatchDialog } from "@/components/dialogs/CreateBatchDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, User, Bird, Boxes, ArrowRight, ChevronLeft, Warehouse } from "lucide-react";
import { Link as WLink } from "wouter";
import { formatNumber } from "@/lib/format";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";

export default function FarmDetail() {
  const [, params] = useRoute("/farms/:farmId");
  const farmId = params?.farmId ?? "";
  const { data: farm, isLoading } = useGetFarm(farmId, { query: { queryKey: getGetFarmQueryKey(farmId), enabled: !!farmId } });
  const { data: sheds } = useListSheds(farmId, { query: { queryKey: getListShedsQueryKey(farmId), enabled: !!farmId } });
  const { data: batches } = useListBatches({ farmId }, { query: { queryKey: getListBatchesQueryKey({ farmId }), enabled: !!farmId } });
  const totalLiveBirds = batches?.reduce((sum, b) => sum + (b.currentFlock ?? 0), 0) ?? 0;
  const { t } = useLang();

  if (isLoading) {
    return (
      <AppShell><div className="p-8 max-w-[1400px] mx-auto"><Skeleton className="h-12 w-64 mb-6" /><div className="grid grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div></AppShell>
    );
  }
  if (!farm) {
    return <AppShell><div className="p-8 text-center text-muted-foreground">{t("Farm not found.", "खेत नहीं मिला।")}</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <WLink href="/farms" asChild>
          <a className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 hover-elevate -ml-2 px-2 py-1 rounded-md" data-testid="link-back-farms">
            <ChevronLeft className="h-3.5 w-3.5" /> {t("All farms", "सभी खेत")}
          </a>
        </WLink>
        <PageHeader
          title={farm.name}
          subtitle={
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{farm.village ? `${farm.village}, ` : ""}{farm.district}, {farm.state}</span>
              <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{farm.ownerName}</span>
            </span>
          }
          actions={
            <>
              <CreateShedDialog farmId={farm.id} />
              <CreateBatchDialog farmId={farm.id} />
            </>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard testId="stat-farm-sheds" label={t("Sheds", "शेड")} icon={Warehouse} value={formatNumber(farm.sheds)} />
          <StatCard testId="stat-farm-active" label={t("Active batches", "सक्रिय बैच")} icon={Boxes} value={formatNumber(farm.activeBatches)} tone="primary" />
          <StatCard testId="stat-farm-birds" label={t("Live birds", "जीवित पक्षी")} icon={Bird} value={formatNumber(totalLiveBirds)} />
          <StatCard testId="stat-farm-capacity" label={t("Total capacity", "कुल क्षमता")} value={formatNumber(farm.totalCapacity)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card shadow-xs">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-base">{t("Sheds", "शेड")}</h2>
              <span className="text-xs text-muted-foreground">{sheds?.length ?? 0} total</span>
            </div>
            <div className="divide-y divide-border">
              {sheds?.length === 0 && <div className="p-6 text-sm text-center text-muted-foreground">{t("No sheds yet.", "कोई शेड नहीं।")}</div>}
              {sheds?.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3" data-testid={`shed-${s.id}`}>
                  <div className="rounded-md bg-muted p-2"><Warehouse className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{formatNumber(s.areaSqft)} sqft</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{t("Capacity", "क्षमता")}</div>
                    <div className="font-bold tabular text-sm">{formatNumber(s.capacity)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-xs">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-base">{t("Batches", "बैच")}</h2>
              <span className="text-xs text-muted-foreground">{batches?.length ?? 0} total</span>
            </div>
            <div className="divide-y divide-border">
              {batches?.length === 0 && <div className="p-6 text-sm text-center text-muted-foreground">{t("No batches.", "कोई बैच नहीं।")}</div>}
              {batches?.map((b) => (
                <Link key={b.id} href={`/batches/${b.id}`} asChild>
                  <a className="flex items-center gap-3 px-5 py-3 hover-elevate" data-testid={`link-farm-batch-${b.batchCode}`}>
                    <div className="font-bold text-sm tabular w-12 text-center">D{b.dayOfBatch}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm">{b.batchCode}</div>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">{b.shedName} · {formatNumber(b.currentFlock)} {t("birds", "पक्षी")}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
