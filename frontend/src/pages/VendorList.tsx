import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Building2,
    ShieldCheck,
    Globe,
    CreditCard,
    Search,
    PackageOpen,
    Loader2,
    Phone,
    Mail,
    ExternalLink
} from "lucide-react";
import { BillingItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useItems } from "@/hooks/useItems";

const VendorList = () => {
    const { items, loading } = useItems();
    const [search, setSearch] = useState("");

    // Extract vendors and their assets
    const vendorMap: Record<string, BillingItem[]> = {};

    items.forEach((item) => {
        if (item.vendorDetails) {
            const vendor = item.vendorDetails.trim();
            if (!vendorMap[vendor]) {
                vendorMap[vendor] = [];
            }
            vendorMap[vendor].push(item);
        }
    });

    const sortedVendors = Object.keys(vendorMap).sort().filter(v =>
        v.toLowerCase().includes(search.toLowerCase()) ||
        vendorMap[v].some(item => item.name.toLowerCase().includes(search.toLowerCase()))
    );

    const getItemIcon = (type: string) => {
        switch (type) {
            case "license": return <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />;
            case "domain": return <Globe className="h-3.5 w-3.5 text-purple-500" />;
            case "subscription": return <CreditCard className="h-3.5 w-3.5 text-emerald-500" />;
            default: return null;
        }
    };

    // Helper to determine if the vendor string looks like an email or phone for better icon display
    const renderVendorContact = (vendor: string) => {
        const isEmail = vendor.includes("@");
        const isPhone = /[\d\+\-\(\) ]{7,}/.test(vendor);

        return (
            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                {isEmail ? (
                    <Mail className="h-4 w-4 text-primary" />
                ) : isPhone ? (
                    <Phone className="h-4 w-4 text-primary" />
                ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                )}
                <span>{vendor}</span>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <Building2 className="h-8 w-8 text-primary" />
                            Vendor Directory
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage all your external service providers and their assigned assets.</p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search vendors or items..."
                            className="pl-10 h-11 bg-card border-border rounded-xl shadow-sm focus:ring-primary transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground font-medium">Scanning vendor records...</p>
                    </div>
                ) : sortedVendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed">
                        <div className="bg-secondary p-4 rounded-xl mb-4 text-muted-foreground">
                            <Building2 className="h-10 w-10 opacity-20" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No vendors listed</h3>
                        <p className="text-muted-foreground mt-1 max-w-xs text-center">Add vendor details to your licenses, domains, or subscriptions to see them listed here.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedVendors.map((vendor) => (
                            <div key={vendor} className="group p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md hover:border-primary/20 hover:shadow-xl transition-all duration-300 animate-in zoom-in-95">
                                <div className="flex flex-col mb-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                                            {vendorMap[vendor].length} Assets
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Provider Details</h4>
                                        {renderVendorContact(vendor)}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Assigned Managed Assets</h4>
                                    {vendorMap[vendor].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 hover:border-border transition-all group/item">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-background border border-border shadow-sm group-hover/item:scale-105 transition-transform">
                                                    {getItemIcon(item.type)}
                                                </div>
                                                <span className="text-sm font-semibold text-foreground/90 group-hover/item:text-foreground truncate max-w-[120px]">{item.name}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-widest bg-background/50 text-muted-foreground group-hover/item:text-primary group-hover/item:border-primary/30 transition-all">
                                                {item.type}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default VendorList;
