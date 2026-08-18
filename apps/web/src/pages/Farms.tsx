import { Link } from "wouter";
import { useListFarms } from "@murgi-mitra/api-client-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { CreateFarmDialog } from "@/components/dialogs/CreateFarmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, User, Boxes, ArrowRight, Tractor } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/format";
import { useLang } from "@/lib/lang";

export default function Farms() {
  const { data: farms, isLoading } = useListFarms();
  const { t } = useLang();

  return (
    <AppShell>
      <div className="px-5 sm:px-8 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <PageHeader
          title={t("Farms", "खेत")}
          subtitle={t("Your registered locations and sheds", "आपके पंजीकृत खेत और शेड")}
          actions={<CreateFarmDialog />}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
          </div>
        ) : farms?.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
            <Tractor className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <p className="mt-3 font-semibold">{t("No farms yet", "अभी कोई खेत नहीं")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("Add your first farm to start tracking batches.", "बैच ट्रैक करने के लिए पहला खेत जोड़ें।")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {farms?.map((f) => (
              <Link key={f.id} href={`/farms/${f.id}`} asChild>
                <a
                  data-testid={`link-farm-${f.id}`}
                  className="block rounded-xl border bg-card shadow-xs p-5 hover-elevate"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary border border-primary/15">
                      <Tractor className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-base">{f.name}</h3>
                  <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{f.village ? `${f.village}, ` : ""}{f.district}, {f.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>{f.ownerName}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-border">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t("Sheds", "शेड")}</div>
                      <div className="font-bold tabular text-base">{f.sheds}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t("Active", "सक्रिय")}</div>
                      <div className="font-bold tabular text-base">{f.activeBatches}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t("Capacity", "क्षमता")}</div>
                      <div className="font-bold tabular text-base">{formatNumber(f.totalCapacity)}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                    <Boxes className="h-3 w-3" /> {t("Joined", "जुड़ा")} {f.createdAt ? formatDate(f.createdAt) : "—"}
                  </div>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
