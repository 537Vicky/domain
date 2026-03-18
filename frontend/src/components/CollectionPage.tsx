import { useState } from "react";
import { Plus, PackageOpen, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ItemCard from "@/components/ItemCard";
import RenewModal from "@/components/RenewModal";
import AddItemModal from "@/components/AddItemModal";
import DashboardLayout from "@/components/DashboardLayout";
import { useItems } from "@/hooks/useItems";
import { cn } from "@/lib/utils";
import {
    BillingItem,
    ItemType,
} from "@/types";

interface CollectionPageProps {
    type: ItemType;
    title: string;
    description: string;
}

const CollectionPage = ({ type, title, description }: CollectionPageProps) => {
    const { items, loading, handleRenew, handleAdd, handleUpdate, handleDelete } = useItems();
    const [renewItem, setRenewItem] = useState<BillingItem | null>(null);
    const [editItem, setEditItem] = useState<BillingItem | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredItems = items.filter((item) => {
        const matchesType = item.type === type;
        const matchesSearch =
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.vendorDetails?.toLowerCase().includes(search.toLowerCase()) || false);
        return matchesType && matchesSearch;
    });

    return (
        <DashboardLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                        <p className="mt-1 text-muted-foreground">{description}</p>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${type}s...`}
                            className="pl-10 h-11 bg-card border-border rounded-xl shadow-sm focus:ring-primary transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-border">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Fetching your {type}s...</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-card rounded-2xl border border-border border-dashed">
                        <div className="bg-secondary p-4 rounded-xl mb-4 text-muted-foreground">
                            <PackageOpen className="h-10 w-10" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No {type}s found</h3>
                        <p className="text-muted-foreground mt-1 max-w-xs text-center">You haven't added any {type}s yet. Go to the dashboard to add your first one.</p>
                    </div>
                )}

                {/* Grid View */}
                {!loading && filteredItems.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredItems
                            .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
                            .map((item) => (
                                <ItemCard
                                    key={item.id}
                                    item={item}
                                    onRenew={setRenewItem}
                                    onEdit={(item) => { setEditItem(item); setAddOpen(true); }}
                                    onDelete={handleDelete}
                                />
                            ))}
                    </div>
                )}
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

export default CollectionPage;
