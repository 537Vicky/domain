import { BillingItem, getDaysUntilExpiry, getUrgencyLevel, formatExpiresIn, renewalPeriodLabels, formatCost, UrgencyLevel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Pencil, Trash2, Globe, KeyRound, CreditCard, Users, Mail, ShieldCheck } from "lucide-react";

interface ItemCardProps {
  item: BillingItem;
  onRenew: (item: BillingItem) => void;
  onEdit: (item: BillingItem) => void;
  onDelete: (id: string) => void;
}

const urgencyBadgeStyles: Record<UrgencyLevel, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  caution: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  safe: "bg-green-500/10 text-green-500 border-green-500/20",
};

const ItemCard = ({ item, onRenew, onEdit, onDelete }: ItemCardProps) => {
  const daysLeft = getDaysUntilExpiry(item.expiryDate);
  const urgency = getUrgencyLevel(daysLeft);
  const expiresText = formatExpiresIn(daysLeft);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-xl group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary transition-transform group-hover:scale-105 border border-border">
            {item.type === "domain" ? (
              <Globe className="h-6 w-6 text-primary" />
            ) : item.type === "subscription" ? (
              <CreditCard className="h-6 w-6 text-primary" />
            ) : (
              <KeyRound className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="truncate font-bold text-foreground text-lg">{item.name}</h4>
            <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${urgency === 'critical' ? 'bg-destructive' : urgency === 'warning' ? 'bg-orange-500' : urgency === 'caution' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
              {item.type}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${urgencyBadgeStyles[urgency]}`}>
          {expiresText}
        </Badge>
      </div>


      <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-lg border border-border">
          <span>Cycle:</span>
          <span className="text-foreground">{renewalPeriodLabels[item.renewalPeriod]}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-lg border border-border">
          <span>Expiry:</span>
          <span className="text-foreground">{item.expiryDate.toLocaleDateString()}</span>
        </div>
        {item.cost > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
            <span className="text-primary font-bold">{formatCost(item.cost, item.renewalPeriod, item.currency)}</span>
          </div>
        )}
      </div>

      {item.vendorDetails && (
        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-full mb-1">
            <Mail className="h-3 w-3" />
            Vendor Information
          </div>
          <span className="text-sm font-medium text-foreground">{item.vendorDetails}</span>
        </div>
      )}

      {item.assignedUsers && item.assignedUsers.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-full mb-1">
            <Users className="h-3 w-3" />
            Active Users
          </div>
          {item.assignedUsers.map((user) => (
            <span key={user} className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border">
              {user}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
        {item.isOwner ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 text-xs font-semibold px-3"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 text-xs font-semibold px-3"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs font-bold px-4 ml-auto transition-all shadow-md"
              onClick={() => onRenew(item)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Renew
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/40">
            <ShieldCheck className="h-3 w-3" />
            Shared View Only
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
