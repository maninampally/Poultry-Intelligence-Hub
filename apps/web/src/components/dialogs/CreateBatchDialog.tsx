import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  useCreateBatch,
  useListSheds,
  useListFarms,
  getListBatchesQueryKey,
  getGetFarmQueryKey,
  getListFarmsQueryKey,
  getListShedsQueryKey,
} from "@murgi-mitra/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function CreateBatchDialog({ farmId, label = "Start batch" }: { farmId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(farmId ?? "");
  const [shedId, setShedId] = useState("");
  const [placement, setPlacement] = useState("8000");
  const [supplier, setSupplier] = useState("Suguna Hatcheries");
  const [breed, setBreed] = useState("Cobb 500");
  const [contract, setContract] = useState<"own" | "integrator">("integrator");

  const { data: farms } = useListFarms({ query: { queryKey: getListFarmsQueryKey(), enabled: open && !farmId } });
  const { data: sheds } = useListSheds(selectedFarm, { query: { queryKey: getListShedsQueryKey(selectedFarm), enabled: open && !!selectedFarm } });
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(todayStr);
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useCreateBatch({
    mutation: {
      onSuccess: () => {
        toast({ title: "Batch started", description: "Logging is now active for this flock." });
        qc.invalidateQueries({ queryKey: getListBatchesQueryKey() });
        if (farmId) qc.invalidateQueries({ queryKey: getGetFarmQueryKey(farmId) });
        setOpen(false);
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-batch" className="gap-1.5">
          <Plus className="h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Start a new batch</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {!farmId && (
            <div>
              <Label className="text-xs">Farm</Label>
              <Select value={selectedFarm} onValueChange={(v) => { setSelectedFarm(v); setShedId(""); }}>
                <SelectTrigger data-testid="select-batch-farm" className="mt-1"><SelectValue placeholder="Choose farm" /></SelectTrigger>
                <SelectContent>
                  {farms?.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Shed</Label>
            <Select value={shedId} onValueChange={setShedId}>
              <SelectTrigger data-testid="select-batch-shed" className="mt-1"><SelectValue placeholder={selectedFarm ? "Choose shed" : "Pick farm first"} /></SelectTrigger>
              <SelectContent>
                {sheds?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.capacity.toLocaleString()} cap</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Placement count</Label>
              <Input data-testid="input-batch-placement" type="number" className="mt-1 tabular" value={placement} onChange={(e) => setPlacement(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Start date</Label>
              <Input data-testid="input-batch-start" type="date" className="mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Chick supplier</Label>
            <Input data-testid="input-batch-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Breed</Label>
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger data-testid="select-batch-breed" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cobb 500">Cobb 500</SelectItem>
                  <SelectItem value="Ross 308">Ross 308</SelectItem>
                  <SelectItem value="Vencobb 400">Vencobb 400</SelectItem>
                  <SelectItem value="Hubbard">Hubbard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Contract</Label>
              <Select value={contract} onValueChange={(v) => setContract(v as "own" | "integrator")}>
                <SelectTrigger data-testid="select-batch-contract" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="integrator">Integrator</SelectItem>
                  <SelectItem value="own">Own / open market</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            data-testid="button-submit-batch"
            disabled={create.isPending || !selectedFarm || !shedId}
            onClick={() => {
              create.mutate({
                data: {
                  farmId: selectedFarm,
                  shedId,
                  startDate: new Date(startDate).toISOString(),
                  placementCount: parseInt(placement, 10),
                  chickSupplier: supplier,
                  breed,
                  contractType: contract,
                  targetSaleDate: null,
                  notes: null,
                },
              });
            }}
          >
            {create.isPending ? "Saving..." : "Start batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
