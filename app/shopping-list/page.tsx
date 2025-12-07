"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Check, Package } from "lucide-react";
import { ShoppingListItem } from "@/components/shopping/ShoppingListItem";
import { AddShoppingItemDialog } from "@/components/shopping/AddShoppingItemDialog";
import { useToast } from "@/hooks/use-toast";
import { getCategoryConfig } from "@/lib/categoryConfig";

export default function ShoppingListPage() {
  const { user } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const { householdId, isLoading: householdLoading } = useHousehold(currentUser?._id);

  const shoppingList = useQuery(
    api.shoppingList.getActiveList,
    householdId ? { householdId } : "skip"
  );

  const clearPurchased = useMutation(api.shoppingList.clearPurchased);
  const clearList = useMutation(api.shoppingList.clearList);
  const { toast } = useToast();

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!shoppingList?.items) return { unpurchased: {}, purchased: [] };

    const unpurchased: Record<string, typeof shoppingList.items> = {};
    const purchased: typeof shoppingList.items = [];

    for (const item of shoppingList.items) {
      if (item.isPurchased) {
        purchased.push(item);
      } else {
        const category = item.ingredient?.category || "other";
        if (!unpurchased[category]) {
          unpurchased[category] = [];
        }
        unpurchased[category].push(item);
      }
    }

    return { unpurchased, purchased };
  }, [shoppingList?.items]);

  const unpurchasedCount = shoppingList?.items.filter((i) => !i.isPurchased).length || 0;
  const purchasedCount = shoppingList?.items.filter((i) => i.isPurchased).length || 0;
  const totalCount = shoppingList?.items.length || 0;

  const handleClearPurchased = async () => {
    if (!shoppingList?._id) return;
    if (confirm("Remove all purchased items from the list?")) {
      const count = await clearPurchased({ listId: shoppingList._id });
      toast({
        title: "Items cleared",
        description: `${count} purchased items removed`,
      });
    }
  };

  const handleClearAll = async () => {
    if (!shoppingList?._id) return;
    if (confirm("Clear the entire shopping list?")) {
      const count = await clearList({ listId: shoppingList._id });
      toast({
        title: "List cleared",
        description: `${count} items removed`,
      });
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view your shopping list</p>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-muted-foreground">
            {totalCount > 0
              ? `${unpurchasedCount} items to buy${purchasedCount > 0 ? `, ${purchasedCount} purchased` : ""}`
              : "Your shopping list is empty"}
          </p>
        </div>
        <div className="flex gap-2">
          {purchasedCount > 0 && (
            <Button variant="outline" onClick={handleClearPurchased}>
              <Check className="mr-2 h-4 w-4" />
              Clear Purchased
            </Button>
          )}
          {totalCount > 0 && (
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
          <AddShoppingItemDialog householdId={householdId} userId={currentUser._id} />
        </div>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Shopping Progress</span>
              <span className="text-sm text-muted-foreground">
                {purchasedCount} / {totalCount} items
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (purchasedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your shopping list is empty</h3>
          <p className="text-muted-foreground mb-4">
            Add items you need to buy
          </p>
          <AddShoppingItemDialog householdId={householdId} userId={currentUser._id} />
        </div>
      )}

      {/* Items by Category */}
      {Object.keys(groupedItems.unpurchased).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedItems.unpurchased)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, items]) => {
              const categoryInfo = getCategoryConfig(category);
              const CategoryIcon = categoryInfo.icon;
              return (
                <Card key={category} className={`border-l-4 ${categoryInfo.borderColor}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`${categoryInfo.bgColor} p-2 rounded-lg`}>
                        <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                      </div>
                      <CardTitle className="text-lg capitalize">{categoryInfo.label}</CardTitle>
                      <Badge variant="secondary" className="ml-auto">
                        {items.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((item) => (
                      <ShoppingListItem
                        key={item._id}
                        item={item}
                        householdId={householdId}
                        userId={currentUser._id}
                      />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Purchased Items */}
      {groupedItems.purchased.length > 0 && (
        <Card className="opacity-75">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="bg-muted p-2 rounded-lg">
                <Check className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg text-muted-foreground">Purchased</CardTitle>
              <Badge variant="outline" className="ml-auto">
                {groupedItems.purchased.length}
              </Badge>
            </div>
            <CardDescription>
              Items purchased and added to your pantry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {groupedItems.purchased.map((item) => (
              <ShoppingListItem
                key={item._id}
                item={item}
                householdId={householdId}
                userId={currentUser._id}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
