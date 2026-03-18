import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Users, ShieldCheck, Globe, CreditCard, Search, PackageOpen, Loader2, Mail } from "lucide-react";
import { BillingItem, User as AppUser } from "@/types";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useItems } from "@/hooks/useItems";
import { api } from "@/lib/api";

const UserManagement = () => {
    const { items, loading: itemsLoading } = useItems();
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<AppUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.get("/auth/users");
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setUsersLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const loading = itemsLoading || usersLoading;

    // Map items to real users
    const userMap: Record<string, BillingItem[]> = {};

    users.forEach(user => {
        userMap[user.name] = items.filter(item =>
            item.assignedUsers?.includes(user.name)
        );
    });

    const userStr = localStorage.getItem("renewx_user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    const filteredUsers = users.filter(user => {
        // Only show other users
        if (currentUser && user.name === currentUser.name) return false;

        const matchesUser = user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase());

        const matchesItems = (userMap[user.name] || []).some(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );

        return matchesUser || matchesItems;
    });

    const getItemIcon = (type: string) => {
        switch (type) {
            case "license": return <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />;
            case "domain": return <Globe className="h-3.5 w-3.5 text-purple-500" />;
            case "subscription": return <CreditCard className="h-3.5 w-3.5 text-emerald-500" />;
            default: return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <Users className="h-8 w-8 text-primary" />
                            User Management
                        </h1>
                        <p className="text-muted-foreground mt-1">View all registered users and their assigned assets.</p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users or assets..."
                            className="pl-10 h-11 bg-card border-border rounded-xl shadow-sm focus:ring-primary transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground font-medium">Loading user data...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed">
                        <div className="bg-secondary p-4 rounded-xl mb-4 text-muted-foreground">
                            <Users className="h-10 w-10 opacity-20" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No users found</h3>
                        <p className="text-muted-foreground mt-1 max-w-xs text-center">Try adjusting your search or assign items to real users.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="group p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md hover:border-primary/20 hover:shadow-xl transition-all duration-300 animate-in zoom-in-95">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-bold text-lg text-foreground leading-none truncate">{user.name}</h4>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium italic truncate">
                                                <Mail className="h-2.5 w-2.5" />
                                                {user.email}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-bold bg-secondary/50 px-2 py-0.5 rounded-full w-fit">
                                                <PackageOpen className="h-3 w-3" />
                                                {(userMap[user.name] || []).length} Assets
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {(userMap[user.name] || []).length > 0 ? (
                                        (userMap[user.name] || []).map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 hover:border-border transition-all group/item">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-1.5 rounded-lg bg-background border border-border shadow-sm group-hover/item:scale-105 transition-transform">
                                                        {getItemIcon(item.type)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground/90 group-hover/item:text-foreground">{item.name}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-widest bg-background/50 text-muted-foreground group-hover/item:text-primary group-hover/item:border-primary/30 transition-all">
                                                    {item.type}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-[10px] text-center text-muted-foreground py-4 border border-dashed border-border rounded-xl bg-secondary/10">No assets assigned</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default UserManagement;
