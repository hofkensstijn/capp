"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { AddPantryItemDialog } from "@/components/pantry/AddPantryItemDialog";
import { QuickAddDialog } from "@/components/pantry/QuickAddDialog";
import { ReceiptScanDialog } from "@/components/pantry/ReceiptScanDialog";
import { PantryItemCard } from "@/components/pantry/PantryItemCard";
import { PantryFilters, FilterState } from "@/components/pantry/PantryFilters";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Package, Zap, Camera, Plus } from "lucide-react";

export default function PantryPage() {
  const { user, isAuthenticated } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const { householdId, isLoading: householdLoading } = useHousehold(currentUser?._id);

  const pantryItems = useQuery(
    api.pantry.list,
    householdId ? { householdId } : "skip"
  );

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showReceiptScan, setShowReceiptScan] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchText: "",
    categories: [],
    locations: [],
    expirationFilter: "all",
  });
  const updatePreferences = useMutation(api.users.updatePreferences);

  const autoAddEnabled = currentUser?.preferences?.autoAddItems ?? false;

  // Apply filters to pantry items
  const filteredItems = useMemo(() => {
    if (!pantryItems) return [];

    return pantryItems.filter((item) => {
      // Search filter
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const itemName = item.ingredient?.name?.toLowerCase() || "";
        if (!itemName.includes(searchLower)) return false;
      }

      // Category filter
      if (filters.categories.length > 0) {
        const itemCategory = item.ingredient?.category?.toLowerCase() || "";
        if (!filters.categories.includes(itemCategory)) return false;
      }

      // Location filter
      if (filters.locations.length > 0) {
        const itemLocation = item.location?.toLowerCase() || "";
        if (!filters.locations.includes(itemLocation)) return false;
      }

      // Expiration filter
      if (filters.expirationFilter !== "all" && item.expirationDate) {
        const now = Date.now();
        const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

        if (filters.expirationFilter === "expiring-soon") {
          if (item.expirationDate > sevenDaysFromNow || item.expirationDate < now) {
            return false;
          }
        } else if (filters.expirationFilter === "expired") {
          if (item.expirationDate >= now) return false;
        }
      }

      return true;
    });
  }, [pantryItems, filters]);

  const handleAutoAddToggle = async (checked: boolean) => {
    if (currentUser) {
      await updatePreferences({
        userId: currentUser._id,
        autoAddItems: checked,
      });
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view your pantry</p>
      </div>
    );
  }

  if (user && (!currentUser || householdLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    );
  }

  if (!currentUser || !householdId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pantry</h1>
          <p className="text-muted-foreground">
            Manage your ingredient inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReceiptScan(true)}>
            <Camera className="mr-2 h-4 w-4" />
            Scan Receipt
          </Button>
          <Button variant="outline" onClick={() => setShowQuickAdd(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <AddPantryItemDialog householdId={householdId} userId={currentUser._id} />
        </div>
      </div>

      {/* Preferences */}
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <Switch
          id="auto-add"
          checked={autoAddEnabled}
          onCheckedChange={handleAutoAddToggle}
        />
        <Label htmlFor="auto-add" className="cursor-pointer">
          <div>
            <p className="font-medium">Trust AI and auto-add items</p>
            <p className="text-sm text-muted-foreground">
              Skip preview screen and add items immediately (you can edit later)
            </p>
          </div>
        </Label>
      </div>

      {/* Filters */}
      {pantryItems && pantryItems.length > 0 && (
        <PantryFilters onFilterChange={setFilters} />
      )}

      {/* Items Display */}
      {!pantryItems || pantryItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your pantry is empty</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding ingredients
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setShowReceiptScan(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Scan Receipt
            </Button>
            <Button variant="outline" onClick={() => setShowQuickAdd(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Quick Add
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No items match your filters</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredItems.length} of {pantryItems.length} items
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <PantryItemCard key={item._id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      {currentUser && householdId && (
        <>
          <QuickAddDialog
            isOpen={showQuickAdd}
            onClose={() => setShowQuickAdd(false)}
            householdId={householdId}
            userId={currentUser._id}
            autoAdd={autoAddEnabled}
          />
          <ReceiptScanDialog
            isOpen={showReceiptScan}
            onClose={() => setShowReceiptScan(false)}
            householdId={householdId}
            userId={currentUser._id}
            autoAdd={autoAddEnabled}
          />
        </>
      )}
    </div>
  );
}
