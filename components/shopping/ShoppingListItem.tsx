"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Minus, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { cn } from "@/lib/utils";

interface ShoppingListItemProps {
  item: {
    _id: Id<"shoppingListItems">;
    quantity: number;
    unit: string;
    isPurchased: boolean;
    notes?: string;
    ingredient: {
      _id: Id<"ingredients">;
      name: string;
      category: string;
    } | null;
  };
  householdId: Id<"households">;
  userId: Id<"users">;
}

export function ShoppingListItem({ item, householdId, userId }: ShoppingListItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const togglePurchased = useMutation(api.shoppingList.togglePurchased);
  const updateItem = useMutation(api.shoppingList.updateItem);
  const removeItem = useMutation(api.shoppingList.removeItem);
  const { toast } = useToast();

  const categoryInfo = getCategoryConfig(item.ingredient?.category);
  const CategoryIcon = categoryInfo.icon;

  const handleTogglePurchased = async () => {
    setIsUpdating(true);
    try {
      const newStatus = await togglePurchased({
        itemId: item._id,
        householdId,
        userId,
        addToPantry: !item.isPurchased, // Only add to pantry when marking as purchased
      });
      if (newStatus) {
        toast({
          title: "Added to pantry",
          description: `${item.ingredient?.name} has been added to your pantry`,
        });
      } else {
        toast({
          title: "Moved back to list",
          description: `${item.ingredient?.name} is back on your shopping list`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityChange = async (delta: number) => {
    const newQuantity = Math.max(0.5, item.quantity + delta);
    setIsUpdating(true);
    try {
      await updateItem({
        itemId: item._id,
        quantity: newQuantity,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (confirm(`Remove ${item.ingredient?.name} from your shopping list?`)) {
      await removeItem({ itemId: item._id });
      toast({
        title: "Item removed",
        description: `${item.ingredient?.name} removed from list`,
      });
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
        item.isPurchased
          ? "bg-muted/50 border-muted opacity-60"
          : `border-l-4 ${categoryInfo.borderColor} hover:shadow-md`,
        isUpdating && "opacity-50 pointer-events-none"
      )}
    >
      {/* Checkbox */}
      <Checkbox
        checked={item.isPurchased}
        onCheckedChange={handleTogglePurchased}
        className="h-5 w-5"
        aria-label={`Mark ${item.ingredient?.name} as purchased`}
      />

      {/* Category Icon */}
      <div className={cn(
        "flex-shrink-0 p-2 rounded-lg",
        item.isPurchased ? "bg-muted" : categoryInfo.bgColor
      )}>
        <CategoryIcon className={cn(
          "h-4 w-4",
          item.isPurchased ? "text-muted-foreground" : categoryInfo.color
        )} />
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate",
          item.isPurchased && "line-through text-muted-foreground"
        )}>
          {item.ingredient?.name || "Unknown"}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{item.quantity} {item.unit}</span>
          {item.notes && (
            <>
              <span>•</span>
              <span className="truncate italic">{item.notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {!item.isPurchased ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(-0.5)}
            disabled={isUpdating || item.quantity <= 0.5}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleQuantityChange(0.5)}
            disabled={isUpdating}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={handleTogglePurchased}
          disabled={isUpdating}
          aria-label={`Undo purchase of ${item.ingredient?.name}`}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleRemove}
        disabled={isUpdating}
        aria-label={`Remove ${item.ingredient?.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
