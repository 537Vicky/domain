import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, ShieldCheck, Globe, CreditCard, Search, ExternalLink } from "lucide-react";
import { BillingItem } from "@/types";
import { Badge } from "@/components/ui/badge";

interface UserManagementModalProps {
    open: boolean;
    onClose: () => void;
    items: BillingItem[];
}

const UserManagementModal = ({ open, onClose, items }: UserManagementModalProps) => {
    const [search, setSearch] = useState("");

    // Extract users and their assets
    const userMap: Record<string, BillingItem[]> = {};

    items.forEach((item) => {
        if (item.assignedUsers && item.assignedUsers.length > 0) {
            item.assignedUsers.forEach((user) => {
                if (!userMap[user]) {
                    userMap[user] = [];
                }
                userMap[user].push(item);
            });
        }
    });

    const sortedUsers = Object.keys(userMap).sort().filter(u =>
        u.toLowerCase().includes(search.toLowerCase())
    );

    const getItemIcon = (type: string) => {
        switch (type) {
            case "license": return <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />;
            case "domain": return <Globe className="h-3.5 w-3.5 text-purple-500" />;
            case "subscription": return <CreditCard className="h-3.5 w-3.5 text-emerald-500" />;
            default: return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            User Management
                        </DialogTitle>
                        <DialogDescription>
                            View all users and the assets currently assigned to them.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative mt-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-10 h-11 bg-secondary/50 border-border"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 pt-4">
                    {sortedUsers.length === 0 ? (
                        <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border">
                            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                            <p className="text-muted-foreground">No users found.</p>
                        </div>
                    ) : (
                        sortedUsers.map((user) => (
                            <div key={user} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                                            {user.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground leading-none">{user}</h4>
                                            <p className="text-xs text-muted-foreground mt-1">{userMap[user].length} assets assigned</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    {userMap[user].map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/50 border border-border/50 group hover:border-border transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-background border border-border shadow-sm">
                                                    {getItemIcon(item.type)}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{item.name}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                                                {item.type}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                    >
                        Done
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UserManagementModal;
