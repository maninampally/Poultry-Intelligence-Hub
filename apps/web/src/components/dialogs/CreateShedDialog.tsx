import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCreateShed, getListShedsQueryKey, getGetFarmQueryKey } from "@murgi-mitra/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function CreateShedDialog({ farmId }: { farmId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("8000");
  const [areaSqft, setAreaSqft] = useState("8000");
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateShed({
    mutation: {
      onSuccess: () => {
        toast({ title: "Shed added" });
        qc.invalidateQueries({ queryKey: getListShedsQueryKey(farmId) });
        qc.invalidateQueries({ queryKey: getGetFarmQueryKey(farmId) });
        setOpen(false);
        setName("");
      },
      onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-add-shed" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add shed
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add a shed</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Shed name</Label>
            <Input data-testid="input-shed-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shed A1" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Capacity (birds)</Label>
              <Input data-testid="input-shed-capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 tabular" />
            </div>
            <div>
              <Label className="text-xs">Area (sqft)</Label>
              <Input data-testid="input-shed-area" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} className="mt-1 tabular" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            data-testid="button-submit-shed"
            onClick={() => {
              if (!name) return;
              create.mutate({ farmId, data: { name, capacity: parseInt(capacity, 10), areaSqft: parseInt(areaSqft, 10) } });
            }}
            disabled={create.isPending}
          >
            {create.isPending ? "Saving..." : "Add shed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
