import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCreateFarm, getListFarmsQueryKey } from "@murgi-mitra/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STATES = [
  "Andhra Pradesh", "Bihar", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

export function CreateFarmDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateFarm({
    mutation: {
      onSuccess: () => {
        toast({ title: "Farm added", description: `${name} is ready for sheds and batches.` });
        qc.invalidateQueries({ queryKey: getListFarmsQueryKey() });
        setOpen(false);
        setName(""); setDistrict(""); setVillage(""); setOwnerName("");
      },
      onError: (e: Error) => toast({ title: "Could not save farm", description: e.message, variant: "destructive" }),
    },
  });

  const submit = () => {
    if (!name || !district || !ownerName) {
      toast({ title: "Missing details", description: "Name, district, and owner are required.", variant: "destructive" });
      return;
    }
    create.mutate({ data: { name, state, district, village: village || null, ownerName } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-farm" className="gap-1.5">
          <Plus className="h-4 w-4" /> New farm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a farm</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Farm name</Label>
            <Input data-testid="input-farm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Selvam Poultry Farm" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Owner name</Label>
            <Input data-testid="input-farm-owner" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. R. Selvam" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger data-testid="select-farm-state" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">District</Label>
              <Input data-testid="input-farm-district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Namakkal" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Village (optional)</Label>
            <Input data-testid="input-farm-village" value={village} onChange={(e) => setVillage(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} data-testid="button-cancel-farm">Cancel</Button>
          <Button onClick={submit} disabled={create.isPending} data-testid="button-submit-farm">
            {create.isPending ? "Saving..." : "Add farm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
