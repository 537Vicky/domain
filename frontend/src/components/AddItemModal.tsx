import { useState, useEffect } from "react";
import { Plus, X, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { User, ItemType, RenewalPeriod, renewalPeriodLabels, renewalPeriodDays, BillingItem, Currency } from "@/types";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<BillingItem, "id" | "createdAt" | "updatedAt">) => void;
  editItem?: BillingItem | null;
  onUpdate?: (item: BillingItem) => void;
}

const AddItemModal = ({ open, onClose, onAdd, editItem, onUpdate }: AddItemModalProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("license");
  const [period, setPeriod] = useState<RenewalPeriod>("1-month");
  const [cost, setCost] = useState("0");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [vendorDetails, setVendorDetails] = useState("");
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");

  useEffect(() => {
    if (open) {
      if (editItem) {
        setName(editItem.name || "");
        setType(editItem.type || "license");
        setPeriod(editItem.renewalPeriod || "1-month");
        setCost(editItem.cost?.toString() || "0");
        setCurrency(editItem.currency || "USD");
        setAssignedUsers(editItem.assignedUsers || []);
        setVendorDetails(editItem.vendorDetails || "");
      } else {
        resetForm();
      }
    }
  }, [editItem, open]);

  const resetForm = () => {
    setName("");
    setType("license");
    setPeriod("1-month");
    setCost("0");
    setCurrency("USD");
    setAssignedUsers([]);
    setVendorDetails("");
    setSelectedUserToAdd("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseFloat(cost) || 0;
    if (editItem && onUpdate) {
      onUpdate({ ...editItem, name, type, renewalPeriod: period, cost: costNum, currency, assignedUsers, vendorDetails });
    } else {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + renewalPeriodDays[period]);
      onAdd({ name, type, renewalPeriod: period, expiryDate, cost: costNum, currency, assignedUsers, vendorDetails });
    }
    onClose();
  };

  const addUser = () => {
    if (selectedUserToAdd && !assignedUsers.includes(selectedUserToAdd)) {
      setAssignedUsers([...assignedUsers, selectedUserToAdd]);
      setSelectedUserToAdd("");
    }
  };

  const removeUser = (user: string) => {
    setAssignedUsers(assignedUsers.filter((u) => u !== user));
  };

  const daysUntilExpiry = renewalPeriodDays[period];
  const months = Math.floor(daysUntilExpiry / 30);
  const expiresText = months >= 1 ? `Expires in ${months} month${months > 1 ? "s" : ""}` : `Expires in ${daysUntilExpiry} days`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {editItem ? "Update the details below." : "Add a new license, domain or subscription to track."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="itemName">Name</Label>
            <Input id="itemName" placeholder="e.g., Adobe Suite or mysite.com" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Renewal Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as RenewalPeriod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(renewalPeriodLabels) as RenewalPeriod[]).map((p) => (
                    <SelectItem key={p} value={p}>{renewalPeriodLabels[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input id="cost" type="number" min="0" step="0.01" placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorDetails">Vendor Details (Phone / Email)</Label>
            <Input id="vendorDetails" placeholder="e.g., support@vendor.com or +1 234 567 890" value={vendorDetails} onChange={(e) => setVendorDetails(e.target.value)} />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign User (By Email)
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Lookup user by email..." 
                value={selectedUserToAdd}
                onChange={(e) => setSelectedUserToAdd(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={async () => {
                  if (!selectedUserToAdd) return;
                  try {
                    const response = await api.get(`/auth/users?email=${selectedUserToAdd}`);
                    if (response && response[0]) {
                       const found = response[0];
                       if (!assignedUsers.includes(found.email)) {
                         setAvailableUsers(prev => [...prev.filter(u => u.id !== found.id), found]);
                         setAssignedUsers([...assignedUsers, found.email]);
                       }
                       setSelectedUserToAdd("");
                    }
                  } catch (e: any) {
                    // Fail gracefully
                  }
                }} 
                className="shrink-0" 
                disabled={!selectedUserToAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {assignedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {assignedUsers.map((userEmail) => (
                  <div key={userEmail} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/20 animate-in zoom-in-95">
                    {availableUsers.find(u => u.email === userEmail)?.name || userEmail}
                    <button type="button" onClick={() => removeUser(userEmail)} className="ml-1 hover:text-destructive transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!editItem && (
            <p className="text-sm text-muted-foreground">{expiresText} from today</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{editItem ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;
