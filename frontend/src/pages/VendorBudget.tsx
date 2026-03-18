import { useState, useEffect, useMemo } from "react";
import {
    Wallet,
    Target,
    AlertTriangle,
    TrendingUp,
    Loader2,
    PiggyBank,
    ArrowRight,
    ShieldCheck,
    Globe,
    CreditCard,
    Sparkles,
    PencilLine,
    CheckCircle2,
    XCircle,
    BadgeDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Currency, currencySymbols } from "@/types";

interface BudgetData {
    id: string;
    yearlyBudget: number;
    currency: Currency;
    year: number;
}

interface SpendingBreakdown {
    usd: number;
    inr: number;
    count: number;
}

interface SpendingData {
    totalUSD: number;
    totalINR: number;
    totalUSDEquivalent: number;
    itemCount: number;
    breakdown: {
        license: SpendingBreakdown;
        domain: SpendingBreakdown;
        subscription: SpendingBreakdown;
    };
}

interface BudgetResponse {
    hasBudget: boolean;
    budget: BudgetData | null;
    spending: SpendingData;
}

const COLORS = {
    spent: "#f43f5e",
    remaining: "#10b981",
    license: "#3b82f6",
    domain: "#a855f7",
    subscription: "#10b981",
    overBudget: "#ef4444",
};

const VendorBudget = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasBudget, setHasBudget] = useState(false);
    const [budget, setBudget] = useState<BudgetData | null>(null);
    const [spending, setSpending] = useState<SpendingData | null>(null);
    const [editMode, setEditMode] = useState(false);

    // Form state
    const [budgetAmount, setBudgetAmount] = useState("");
    const [budgetCurrency, setBudgetCurrency] = useState<Currency>("USD");

    // Fetch budget data
    useEffect(() => {
        fetchBudget();
    }, []);

    const fetchBudget = async () => {
        setLoading(true);
        try {
            const data: BudgetResponse = await api.get("/budget");
            setHasBudget(data.hasBudget);
            setBudget(data.budget);
            setSpending(data.spending);
            if (data.budget) {
                setBudgetAmount(data.budget.yearlyBudget.toString());
                setBudgetCurrency(data.budget.currency);
            }
        } catch (err: any) {
            toast({
                title: "Failed to load budget",
                description: err.message || "Could not fetch budget data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSetBudget = async () => {
        if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid budget amount greater than 0.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const data: BudgetResponse = await api.post("/budget", {
                yearlyBudget: parseFloat(budgetAmount),
                currency: budgetCurrency,
            });
            setHasBudget(data.hasBudget);
            setBudget(data.budget);
            setSpending(data.spending);
            setEditMode(false);
            toast({
                title: hasBudget ? "Budget Updated" : "Budget Set!",
                description: `Your yearly budget has been set to ${currencySymbols[budgetCurrency]}${parseFloat(budgetAmount).toLocaleString()}.`,
            });
        } catch (err: any) {
            toast({
                title: "Failed to save budget",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // Compute chart data
    const totalSpent = useMemo(() => {
        if (!spending || !budget) return 0;
        if (budget.currency === "USD") {
            return spending.totalUSDEquivalent;
        }
        // If budget is INR, convert USD to INR
        return spending.totalINR + spending.totalUSD * 84;
    }, [spending, budget]);

    const remaining = useMemo(() => {
        if (!budget) return 0;
        return Math.max(0, budget.yearlyBudget - totalSpent);
    }, [budget, totalSpent]);

    const isOverBudget = useMemo(() => {
        if (!budget) return false;
        return totalSpent > budget.yearlyBudget;
    }, [budget, totalSpent]);

    const overAmount = useMemo(() => {
        if (!budget || !isOverBudget) return 0;
        return totalSpent - budget.yearlyBudget;
    }, [budget, totalSpent, isOverBudget]);

    const usagePercent = useMemo(() => {
        if (!budget || budget.yearlyBudget === 0) return 0;
        return Math.min((totalSpent / budget.yearlyBudget) * 100, 100);
    }, [budget, totalSpent]);

    const pieData = useMemo(() => {
        if (!budget) return [];

        if (isOverBudget) {
            return [
                { name: "Spent (Over Budget)", value: budget.yearlyBudget, fill: COLORS.overBudget },
                { name: "Over by", value: overAmount, fill: "#991b1b" },
            ];
        }

        return [
            { name: "Spent", value: totalSpent, fill: COLORS.spent },
            { name: "Remaining", value: remaining, fill: COLORS.remaining },
        ];
    }, [budget, totalSpent, remaining, isOverBudget, overAmount]);

    const breakdownPieData = useMemo(() => {
        if (!spending) return [];

        const data = [];
        const bd = spending.breakdown;

        if (bd.license.usd + bd.license.inr > 0) {
            const val = budget?.currency === "INR"
                ? bd.license.inr + bd.license.usd * 84
                : bd.license.usd + bd.license.inr / 84;
            data.push({ name: "Licenses", value: parseFloat(val.toFixed(2)), fill: COLORS.license, count: bd.license.count });
        }
        if (bd.domain.usd + bd.domain.inr > 0) {
            const val = budget?.currency === "INR"
                ? bd.domain.inr + bd.domain.usd * 84
                : bd.domain.usd + bd.domain.inr / 84;
            data.push({ name: "Domains", value: parseFloat(val.toFixed(2)), fill: COLORS.domain, count: bd.domain.count });
        }
        if (bd.subscription.usd + bd.subscription.inr > 0) {
            const val = budget?.currency === "INR"
                ? bd.subscription.inr + bd.subscription.usd * 84
                : bd.subscription.usd + bd.subscription.inr / 84;
            data.push({ name: "Subscriptions", value: parseFloat(val.toFixed(2)), fill: COLORS.subscription, count: bd.subscription.count });
        }

        return data;
    }, [spending, budget]);

    const symbol = budget ? currencySymbols[budget.currency] : "$";

    // ─── New user Setup View ────────────────────────────────────
    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-medium text-lg">Loading budget data...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!hasBudget && !editMode) {
        return (
            <DashboardLayout>
                <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in duration-700">
                    <div className="w-full max-w-lg">
                        <Card className="rounded-3xl border-2 border-dashed border-primary/20 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                            <CardContent className="p-8 md:p-12 text-center">
                                {/* Decorative header */}
                                <div className="relative mb-8">
                                    <div className="inline-flex items-center justify-center p-5 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10 mb-6">
                                        <PiggyBank className="h-12 w-12 text-primary animate-bounce" style={{ animationDuration: "2s" }} />
                                    </div>
                                    <div className="absolute -top-2 -right-2 md:right-16">
                                        <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                                    </div>
                                </div>

                                <h2 className="text-3xl font-black text-foreground tracking-tight mb-3">
                                    Set Your Yearly Budget
                                </h2>
                                <p className="text-muted-foreground text-base mb-10 max-w-sm mx-auto leading-relaxed">
                                    Track your spending against a yearly budget to stay on top of your renewals and avoid overspending.
                                </p>

                                <div className="space-y-5">
                                    <div className="relative">
                                        <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="budget-amount-setup"
                                            type="number"
                                            placeholder="Enter yearly budget (e.g. 5000)"
                                            className="pl-12 h-14 text-lg rounded-2xl bg-background border-border shadow-sm focus:ring-2 focus:ring-primary/30 transition-all"
                                            value={budgetAmount}
                                            onChange={(e) => setBudgetAmount(e.target.value)}
                                            min={0}
                                            step={100}
                                        />
                                    </div>

                                    <Select value={budgetCurrency} onValueChange={(v: any) => setBudgetCurrency(v)}>
                                        <SelectTrigger className="w-full h-14 rounded-2xl border-border bg-background shadow-sm text-lg">
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="USD">🇺🇸 USD — US Dollar ($)</SelectItem>
                                            <SelectItem value="INR">🇮🇳 INR — Indian Rupee (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/25 gap-3 transition-all hover:scale-[1.02]"
                                        onClick={handleSetBudget}
                                        disabled={saving || !budgetAmount}
                                    >
                                        {saving ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Target className="h-5 w-5" />
                                        )}
                                        {saving ? "Setting up..." : "Set Yearly Budget"}
                                    </Button>
                                </div>

                                <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                                    {[
                                        { icon: ShieldCheck, label: "Licenses" },
                                        { icon: Globe, label: "Domains" },
                                        { icon: CreditCard, label: "Subs" },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5">
                                            <item.icon className="h-3.5 w-3.5" />
                                            <span>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ─── Main Budget Dashboard ────────────────────────────────────
    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                <Wallet className="h-7 w-7 text-primary" />
                            </div>
                            Vendor Budget
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Track your {new Date().getFullYear()} spending against your yearly budget.
                        </p>
                    </div>
                    <Button
                        variant={editMode ? "destructive" : "outline"}
                        className="gap-2 rounded-xl h-11 px-5 font-bold shadow-sm transition-all"
                        onClick={() => {
                            if (editMode) {
                                // Reset form
                                if (budget) {
                                    setBudgetAmount(budget.yearlyBudget.toString());
                                    setBudgetCurrency(budget.currency);
                                }
                                setEditMode(false);
                            } else {
                                setEditMode(true);
                            }
                        }}
                    >
                        {editMode ? (
                            <>
                                <XCircle className="h-4 w-4" /> Cancel
                            </>
                        ) : (
                            <>
                                <PencilLine className="h-4 w-4" /> Update Budget
                            </>
                        )}
                    </Button>
                </div>

                {/* Over Budget Warning */}
                {isOverBudget && !editMode && (
                    <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/20 shrink-0">
                                <AlertTriangle className="h-7 w-7 text-red-500 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-red-500 mb-1">Budget Exceeded!</h3>
                                <p className="text-sm text-red-400/80 leading-relaxed">
                                    You have exceeded your yearly budget by{" "}
                                    <span className="font-black text-red-500">
                                        {symbol}{overAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>.
                                    Consider updating your budget or reviewing your active subscriptions.
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-3 gap-2 text-red-500 hover:bg-red-500/10 font-bold rounded-xl"
                                    onClick={() => setEditMode(true)}
                                >
                                    Update Budget Now <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Budget Form */}
                {editMode && (
                    <Card className="rounded-2xl border-2 border-primary/20 bg-card/60 backdrop-blur-md shadow-xl animate-in slide-in-from-top-4 zoom-in-95 duration-500">
                        <CardContent className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                    <Target className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Update Yearly Budget</h3>
                                    <p className="text-xs text-muted-foreground">Change your budget cap for {new Date().getFullYear()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <BadgeDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="budget-amount-edit"
                                        type="number"
                                        placeholder="New budget amount"
                                        className="pl-12 h-12 rounded-xl bg-background"
                                        value={budgetAmount}
                                        onChange={(e) => setBudgetAmount(e.target.value)}
                                        min={0}
                                    />
                                </div>
                                <Select value={budgetCurrency} onValueChange={(v: any) => setBudgetCurrency(v)}>
                                    <SelectTrigger className="w-full sm:w-40 h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="USD">🇺🇸 USD</SelectItem>
                                        <SelectItem value="INR">🇮🇳 INR</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02]"
                                    onClick={handleSetBudget}
                                    disabled={saving || !budgetAmount}
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Main Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md transition-transform hover:scale-[1.02] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <Target className="h-5 w-5 text-emerald-500" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Yearly Budget</span>
                        </div>
                        <p className="text-3xl font-black text-foreground">
                            {symbol}{budget?.yearlyBudget.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{budget?.currency} • {budget?.year}</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md transition-transform hover:scale-[1.02] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-xl ${isOverBudget ? "bg-red-500/10 border-red-500/20" : "bg-rose-500/10 border-rose-500/20"} border`}>
                                <TrendingUp className={`h-5 w-5 ${isOverBudget ? "text-red-500" : "text-rose-500"}`} />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
                        </div>
                        <p className={`text-3xl font-black ${isOverBudget ? "text-red-500" : "text-foreground"}`}>
                            {symbol}{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Annualized • {spending?.itemCount ?? 0} items</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md transition-transform hover:scale-[1.02] shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-xl ${isOverBudget ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"} border`}>
                                <Wallet className={`h-5 w-5 ${isOverBudget ? "text-red-500" : "text-emerald-500"}`} />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                                {isOverBudget ? "Over By" : "Remaining"}
                            </span>
                        </div>
                        <p className={`text-3xl font-black ${isOverBudget ? "text-red-500" : "text-emerald-500"}`}>
                            {isOverBudget ? "-" : ""}{symbol}{(isOverBudget ? overAmount : remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {usagePercent.toFixed(1)}% of budget used
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <Card className="rounded-2xl border-border bg-card/40 backdrop-blur-md shadow-lg border overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Budget Usage</span>
                            <Badge
                                variant={isOverBudget ? "destructive" : "secondary"}
                                className={`rounded-lg font-black text-xs px-3 py-1 ${isOverBudget
                                        ? ""
                                        : usagePercent > 80
                                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    }`}
                            >
                                {isOverBudget
                                    ? `${((totalSpent / (budget?.yearlyBudget || 1)) * 100).toFixed(1)}% — EXCEEDED`
                                    : `${usagePercent.toFixed(1)}% used`}
                            </Badge>
                        </div>
                        <div className="w-full h-4 bg-secondary rounded-full overflow-hidden shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget
                                        ? "bg-gradient-to-r from-red-500 to-red-600"
                                        : usagePercent > 80
                                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                            : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                    }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>{symbol}0</span>
                            <span>{symbol}{budget?.yearlyBudget.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart — Spent vs Remaining */}
                    <Card className="rounded-2xl border-border bg-card/40 backdrop-blur-md shadow-lg border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                    <Wallet className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Budget Overview</h3>
                                    <p className="text-xs text-muted-foreground">Spent vs Remaining</p>
                                </div>
                            </div>

                            <div className="h-[300px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={2}
                                            stroke="hsl(var(--background))"
                                            animationDuration={1200}
                                            animationBegin={200}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0];
                                                    return (
                                                        <div className="bg-background/95 border-2 border-primary/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                                            <p className="text-sm font-bold text-foreground">{data.name}</p>
                                                            <p className="text-lg font-black text-primary mt-1">
                                                                {symbol}{(data.value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center label */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className={`text-2xl font-black ${isOverBudget ? "text-red-500" : "text-foreground"}`}>
                                            {usagePercent.toFixed(0)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">used</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-border/50">
                                {pieData.map((entry, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                                        <span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pie Chart — Breakdown by Type */}
                    <Card className="rounded-2xl border-border bg-card/40 backdrop-blur-md shadow-lg border-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "200ms" }}>
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Spending Breakdown</h3>
                                    <p className="text-xs text-muted-foreground">By category (annualized)</p>
                                </div>
                            </div>

                            {breakdownPieData.length === 0 ? (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <PiggyBank className="h-16 w-16 opacity-20 mb-4" />
                                    <p className="font-medium">No spending data yet</p>
                                    <p className="text-xs mt-1">Add items to see the breakdown</p>
                                </div>
                            ) : (
                                <>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={breakdownPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    strokeWidth={2}
                                                    stroke="hsl(var(--background))"
                                                    animationDuration={1200}
                                                    animationBegin={400}
                                                >
                                                    {breakdownPieData.map((entry, index) => (
                                                        <Cell key={`cell-bd-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-background/95 border-2 border-primary/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                                                    <p className="text-sm font-bold text-foreground">{data.name}</p>
                                                                    <p className="text-lg font-black mt-1" style={{ color: data.fill }}>
                                                                        {symbol}{data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground mt-1">{data.count} items</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Breakdown Legend */}
                                    <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-border/50">
                                        {breakdownPieData.map((entry, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                <div>
                                                    <span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
                                                    <span className="text-xs text-muted-foreground/70 ml-1">({entry.count})</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Spending Breakdown */}
                {spending && (
                    <Card className="rounded-2xl border-border bg-card/40 backdrop-blur-md shadow-lg border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "400ms" }}>
                        <CardContent className="p-6 md:p-8">
                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-secondary border border-border">
                                    <BadgeDollarSign className="h-5 w-5 text-muted-foreground" />
                                </div>
                                Annualized Cost Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        label: "Licenses",
                                        icon: ShieldCheck,
                                        color: "text-blue-500",
                                        bg: "bg-blue-500/10",
                                        border: "border-blue-500/20",
                                        data: spending.breakdown.license,
                                    },
                                    {
                                        label: "Domains",
                                        icon: Globe,
                                        color: "text-purple-500",
                                        bg: "bg-purple-500/10",
                                        border: "border-purple-500/20",
                                        data: spending.breakdown.domain,
                                    },
                                    {
                                        label: "Subscriptions",
                                        icon: CreditCard,
                                        color: "text-emerald-500",
                                        bg: "bg-emerald-500/10",
                                        border: "border-emerald-500/20",
                                        data: spending.breakdown.subscription,
                                    },
                                ].map((cat, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-5 rounded-2xl ${cat.bg} border ${cat.border} transition-transform hover:scale-[1.02]`}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <cat.icon className={`h-5 w-5 ${cat.color}`} />
                                            <span className="font-bold text-foreground">{cat.label}</span>
                                            <Badge variant="secondary" className="ml-auto text-[10px] font-black uppercase tracking-widest">
                                                {cat.data.count} items
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {cat.data.usd > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">USD</span>
                                                    <span className="font-bold text-foreground">
                                                        ${cat.data.usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                            {cat.data.inr > 0 && (
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-muted-foreground">INR</span>
                                                    <span className="font-bold text-foreground">
                                                        ₹{cat.data.inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                            {cat.data.usd === 0 && cat.data.inr === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No expenses</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
};

export default VendorBudget;
