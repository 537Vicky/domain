import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    LayoutDashboard,
    ShieldCheck,
    Globe,
    CreditCard,
    LogOut,
    Menu,
    X,
    Users,
    Building2,
    Wallet
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
    icon: any;
    label: string;
    path: string;
    active: boolean;
    onClick: () => void;
}

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: SidebarItemProps) => (
    <Link
        to={path}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group mb-2",
            active
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
    >
        <Icon className={cn("h-5 w-5", active ? "text-primary-foreground" : "group-hover:text-primary")} />
        <span className="font-medium">{label}</span>
    </Link>
);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem("renewx_token");
        localStorage.removeItem("renewx_user");
        navigate("/login");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: ShieldCheck, label: "Licenses", path: "/licenses" },
        { icon: Globe, label: "Domains", path: "/domains" },
        { icon: CreditCard, label: "Subscriptions", path: "/subscriptions" },
        { icon: Users, label: "User Management", path: "/users" },
        { icon: Building2, label: "Vendor Directory", path: "/vendors" },
        { icon: Wallet, label: "Vendor Budget", path: "/vendors/budget" },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 border-r border-border bg-card p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-10 px-2 text-primary">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">RenewX</span>
                </div>

                <nav className="flex-1">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            active={location.pathname === item.path}
                            onClick={() => { }}
                        />
                    ))}
                </nav>

                <div className="pt-6 border-t border-border">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Top Header */}
            <div className="md:hidden flex items-center justify-between w-full h-16 px-4 bg-card border-b border-border fixed top-0 z-50">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                    <ShieldCheck className="h-5 w-5" />
                    <span>RenewX</span>
                </div>
                <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-muted-foreground">
                    {mobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm pt-20 px-4 animate-in fade-in">
                    <div className="bg-card rounded-2xl p-4 border border-border shadow-2xl">
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                {...item}
                                active={location.pathname === item.path}
                                onClick={() => setMobileOpen(false)}
                            />
                        ))}
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 pt-20 md:pt-8 p-4 md:p-8 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
