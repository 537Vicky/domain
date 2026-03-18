import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BillingItem, RenewalPeriod, renewalPeriodLabels } from "@/types";

interface RenewModalProps {
  item: BillingItem | null;
  open: boolean;
  onClose: () => void;
  onRenew: (id: string, period: RenewalPeriod) => void;
}

const periods: RenewalPeriod[] = ["1-month", "3-months", "6-months", "1-year"];

const RenewModal = ({ item, open, onClose, onRenew }: RenewModalProps) => {
  const [selected, setSelected] = useState<RenewalPeriod>("1-month");

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renew {item.name}</DialogTitle>
          <DialogDescription>Select a renewal period to extend the expiry date.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setSelected(p)}
              className={`rounded-lg border-2 p-4 text-center text-sm font-medium transition-all ${
                selected === p
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {renewalPeriodLabels[p]}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onRenew(item.id, selected); onClose(); }}>
            Confirm Renewal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenewModal;
