import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
    BillingItem,
    RenewalPeriod,
} from "@/types";

// Parse ISO date strings returned by the API into Date objects
const parseItem = (raw: any): BillingItem => ({
    ...raw,
    expiryDate: new Date(raw.expiryDate),
    createdAt: new Date(raw.createdAt),
});

export const useItems = () => {
    const [items, setItems] = useState<BillingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get("/items");
            setItems(data.map(parseItem));
        } catch (err: any) {
            if (err.message?.toLowerCase().includes("unauthorized") || err.message?.toLowerCase().includes("token")) {
                localStorage.removeItem("renewx_token");
                localStorage.removeItem("renewx_user");
                navigate("/login");
            } else {
                toast({
                    title: "Failed to load items",
                    description: err.message || "Could not fetch your items from the server.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, toast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleRenew = async (id: string, period: RenewalPeriod) => {
        try {
            const res = await api.post(`/items/${id}/renew`, { period });
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...item, expiryDate: new Date(res.expiryDate), renewalPeriod: res.renewalPeriod }
                        : item
                )
            );
            toast({ title: "Renewal Successful", description: "The expiry date has been updated." });
        } catch (err: any) {
            toast({ title: "Renewal Failed", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const handleAdd = async (data: Omit<BillingItem, "id" | "createdAt" | "updatedAt">) => {
        try {
            const res = await api.post("/items", {
                ...data,
                expiryDate: data.expiryDate.toISOString(),
            });
            const newItem = parseItem(res);
            setItems((prev) => [newItem, ...prev]);
            toast({ title: "Item Added", description: `${data.name} has been added.` });
            return newItem;
        } catch (err: any) {
            toast({ title: "Failed to Add Item", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const handleUpdate = async (updated: BillingItem) => {
        try {
            await api.put(`/items/${updated.id}`, {
                name: updated.name,
                type: updated.type,
                renewalPeriod: updated.renewalPeriod,
                cost: updated.cost,
                currency: updated.currency,
                assignedUsers: updated.assignedUsers,
                vendorDetails: updated.vendorDetails,
            });
            setItems((prev) =>
                prev.map((item) => (item.id === updated.id ? updated : item))
            );
            toast({ title: "Item Updated", description: `${updated.name} has been updated.` });
        } catch (err: any) {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/items/${id}`);
            setItems((prev) => prev.filter((item) => item.id !== id));
            toast({ title: "Item Deleted", description: "The item has been removed." });
        } catch (err: any) {
            toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    return {
        items,
        loading,
        handleRenew,
        handleAdd,
        handleUpdate,
        handleDelete,
        refreshItems: fetchItems,
    };
};
