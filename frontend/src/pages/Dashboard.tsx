import { useState, useMemo, useEffect } from "react";
import { Plus, PackageOpen, Loader2, ArrowRight, ShieldCheck, Globe, CreditCard, Users, TrendingUp, Building2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItemCard from "@/components/ItemCard";
import RenewModal from "@/components/RenewModal";
import AddItemModal from "@/components/AddItemModal";
import DashboardLayout from "@/components/DashboardLayout";
import { useItems } from "@/hooks/useItems";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  BillingItem,
  RenewalPeriod,
  User,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const { items, loading, handleRenew, handleAdd, handleUpdate, handleDelete } = useItems();
  const [renewItem, setRenewItem] = useState<BillingItem | null>(null);
  const [editItem, setEditItem] = useState<BillingItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const userStr = localStorage.getItem("renewx_user");
  const currentUser = useMemo(() => userStr ? JSON.parse(userStr) : null, [userStr]);

  useEffect(() => {
    api.get("/auth/users").then(setActiveUsers).catch(console.error);
  }, []);

  const [viewFilter, setViewFilter] = useState<RenewalPeriod>("1-year");

  const ownedItems = useMemo(() => items.filter(i => i.isOwner), [items]);

  const chartData = useMemo(() => {
    const rawData = [
      { period: "1-month" as RenewalPeriod, name: "Monthly", usd: 0, inr: 0, count: 0, inrConverted: 0, breakdown: {} as Record<string, number> },
      { period: "3-months" as RenewalPeriod, name: "Quarterly", usd: 0, inr: 0, count: 0, inrConverted: 0, breakdown: {} as Record<string, number> },
      { period: "6-months" as RenewalPeriod, name: "6 Months", usd: 0, inr: 0, count: 0, inrConverted: 0, breakdown: {} as Record<string, number> },
      { period: "1-year" as RenewalPeriod, name: "Yearly", usd: 0, inr: 0, count: 0, inrConverted: 0, breakdown: {} as Record<string, number> },
    ];

    const multipliers: Record<RenewalPeriod, number[]> = {
      "1-month": [1, 3, 6, 12],
      "3-months": [0, 1, 2, 4],
      "6-months": [0, 0, 1, 2],
      "1-year": [0, 0, 0, 1],
    };

    ownedItems.forEach((item) => {
      const factors = multipliers[item.renewalPeriod];
      if (!factors) return;

      rawData.forEach((point, i) => {
        const factor = factors[i];
        if (factor > 0) {
          const costToAdd = item.cost * factor;
          if (item.currency === "USD") {
            point.usd += costToAdd;
          } else {
            point.inr += costToAdd;
            point.inrConverted += costToAdd / 84;
          }
          point.count += factor;

          // Track original item counts for tooltip breakdown
          const periodLabel = item.renewalPeriod === "1-month" ? "Monthly" :
            item.renewalPeriod === "3-months" ? "Quarterly" :
              item.renewalPeriod === "6-months" ? "6-Month" : "Yearly";
          point.breakdown[periodLabel] = (point.breakdown[periodLabel] || 0) + 1;
        }
      });
    });

    const hierarchy: Record<RenewalPeriod, RenewalPeriod[]> = {
      "1-month": ["1-month"],
      "3-months": ["1-month", "3-months"],
      "6-months": ["1-month", "3-months", "6-months"],
      "1-year": ["1-month", "3-months", "6-months", "1-year"],
    };

    return rawData.filter((d) => hierarchy[viewFilter].includes(d.period as RenewalPeriod));
  }, [ownedItems, viewFilter]);

  const stats = {
    total: items.length,
    licenses: items.filter(i => i.type === "license").length,
    domains: items.filter(i => i.type === "domain").length,
    subscriptions: items.filter(i => i.type === "subscription").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-10 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Overview</h1>
            <p className="mt-1 text-muted-foreground">Welcome back! Here's what's happening with your renewals.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              className="gap-2 rounded-xl px-6 py-6 shadow-lg shadow-primary/20 h-auto"
              onClick={() => { setEditItem(null); setAddOpen(true); }}
              disabled={loading}
            >
              <Plus className="h-5 w-5" />
              Add New Item
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-card" },
            { label: "Licenses", value: stats.licenses, color: "text-blue-500", bg: "bg-blue-500/5" },
            { label: "Domains", value: stats.domains, color: "text-purple-500", bg: "bg-purple-500/5" },
            { label: "Subscriptions", value: stats.subscriptions, color: "text-emerald-500", bg: "bg-emerald-500/5" },
          ].map((stat, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border border-border ${stat.bg} backdrop-blur-sm transition-transform hover:scale-[1.02] shadow-sm`}>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Renewal Analytics Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Renewal Forecast Divisions
              <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground font-normal border border-border">Cumulative Calculation</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">Division Horizon:</span>
              <Select value={viewFilter} onValueChange={(v: any) => setViewFilter(v)}>
                <SelectTrigger className="w-[180px] rounded-xl border-border bg-card shadow-sm h-10 ring-offset-background focus:ring-1 focus:ring-primary transition-all">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-2xl backdrop-blur-lg">
                  <SelectItem value="1-month">Monthly only</SelectItem>
                  <SelectItem value="3-months">Quarterly (inc. Monthly)</SelectItem>
                  <SelectItem value="6-months">6 Month (inc. Quarterly)</SelectItem>
                  <SelectItem value="1-year">Yearly (All Periods)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-inner">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground font-medium">Analyzing your billing data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border border-dashed">
              <div className="bg-secondary p-4 rounded-xl mb-4 text-muted-foreground">
                <PackageOpen className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No renewal data available</h3>
              <p className="text-muted-foreground mt-1 max-w-xs text-center">Add some licenses or subscriptions to see your payment graph.</p>
              <Button className="mt-6 shadow-sm" variant="secondary" onClick={() => setAddOpen(true)}>
                Add First Item
              </Button>
            </div>
          ) : (
            <Card className="rounded-2xl border-border bg-card/40 backdrop-blur-md shadow-lg border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CardContent className="p-8">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
                      <defs>
                        <linearGradient id="usdGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="inrGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 600 }}
                        dy={15}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        dx={-10}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05, radius: 10 }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background/95 border-2 border-primary/20 p-5 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[240px] border-t-4 border-t-primary animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
                                  <p className="text-sm font-bold text-foreground capitalize tracking-tight">{label} Forecast</p>
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                      <PackageOpen className="w-3 h-3 text-primary" />
                                      <span className="text-xs font-bold text-primary">{data.count} Bills</span>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1 justify-end max-w-[150px]">
                                      {Object.entries(data.breakdown).map(([period, count]: [string, any]) => (
                                        <span key={period} className="text-[9px] bg-secondary/50 px-1.5 py-0.5 rounded-md text-muted-foreground border border-border/50">
                                          {period}: {count}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                      <span>USD Components</span>
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Bills</span>
                                      </div>
                                    </div>
                                    <div className="bg-blue-500/5 p-2 rounded-xl flex justify-between items-center border border-blue-500/10">
                                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Total USD Price:</span>
                                      <span className="text-base font-black text-blue-600 font-mono tracking-tighter">${data.usd.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                      <span>INR Components</span>
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Bills</span>
                                      </div>
                                    </div>
                                    <div className="bg-emerald-500/5 p-2 rounded-xl flex justify-between items-center border border-emerald-500/10">
                                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Total INR Price:</span>
                                      <span className="text-base font-black text-emerald-600 font-mono tracking-tighter">₹{data.inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="mt-4 text-[9px] text-center text-muted-foreground italic border-t border-border pt-2 uppercase tracking-widest">Calculated using owned assets only</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="usd"
                        stackId="a"
                        fill="url(#usdGradient)"
                        radius={[0, 0, 0, 0]}
                        barSize={60}
                        animationDuration={1500}
                      />
                      <Bar
                        dataKey="inrConverted"
                        stackId="a"
                        fill="url(#inrGradient)"
                        radius={[8, 8, 0, 0]}
                        barSize={60}
                        animationDuration={1800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-8 border-t border-border/50 pt-8">
                  {[
                    { label: "USD Total", color: "bg-blue-500", desc: "US Dollar Bills" },
                    { label: "INR Total", color: "bg-emerald-500", desc: "Indian Rupee Bills" },
                    { label: "Total Count", icon: PackageOpen, color: "bg-primary/20 text-primary", desc: "Total Bill Count" },
                    { label: "Shared View", icon: ShieldCheck, color: "bg-secondary text-muted-foreground", desc: "Not Calculated" },
                  ].map((legend, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${legend.color} border border-border/50`}>
                        {legend.icon ? <legend.icon className="w-4 h-4" /> : <div className="w-4 h-4 rounded-sm" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-none">{legend.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{legend.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Shortcuts / Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Licenses", path: "/licenses", icon: ShieldCheck, color: "text-blue-500" },
            { title: "Domains", path: "/domains", icon: Globe, color: "text-purple-500" },
            { title: "Subscriptions", path: "/subscriptions", icon: CreditCard, color: "text-emerald-500" },
            { title: "User Management", path: "/users", icon: Users, color: "text-primary" },
            { title: "Vendor Directory", path: "/vendors", icon: Building2, color: "text-orange-500" },
            { title: "Vendor Budget", path: "/vendors/budget", icon: Wallet, color: "text-rose-500" },
          ].map((card, idx) => (
            <Link
              key={idx}
              to={card.path}
              className="group p-6 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-secondary transition-transform group-hover:scale-110 border border-border`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage all your {card.title.toLowerCase()} and their renewal dates.</p>
            </Link>
          ))}
        </div>

        {/* Other Active Users Section */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Users className="h-6 w-6 text-primary" />
              </div>
              Other Active Users
            </h2>
            <Link to="/users">
              <Button variant="ghost" className="gap-2 text-primary font-bold hover:bg-primary/5 rounded-xl">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeUsers
              .filter(u => u.id !== currentUser?.id)
              .slice(0, 4)
              .map((user) => {
                const userAssets = items.filter(item => item.assignedUsers?.includes(user.name));
                return (
                  <div key={user.id} className="group p-5 rounded-2xl border border-border bg-card/40 backdrop-blur-md hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-lg text-foreground leading-none group-hover:text-primary transition-colors truncate">{user.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] font-black uppercase tracking-wider bg-secondary/80 border-border/50">
                            {userAssets.length} Assets
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5 min-h-[24px]">
                      {userAssets.slice(0, 2).map((asset) => (
                        <div key={asset.id} className="p-1 px-2 rounded-lg bg-secondary/30 border border-border/40 text-[9px] font-bold text-muted-foreground truncate max-w-[100px]">
                          {asset.name}
                        </div>
                      ))}
                      {userAssets.length > 2 && (
                        <div className="p-1 px-2 rounded-lg bg-primary/5 border border-primary/10 text-[9px] font-black text-primary">
                          +{userAssets.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {activeUsers.filter(u => u.id !== currentUser?.id).length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-secondary/5">
                <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground font-medium">No other active users found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RenewModal
        item={renewItem}
        open={!!renewItem}
        onClose={() => setRenewItem(null)}
        onRenew={handleRenew}
      />
      <AddItemModal
        open={addOpen}
        onClose={() => { setAddOpen(false); setEditItem(null); }}
        onAdd={handleAdd}
        editItem={editItem}
        onUpdate={handleUpdate}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
