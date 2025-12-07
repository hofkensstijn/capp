"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, MapPin, Calendar, Minus, Plus, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCategoryConfig } from "@/lib/categoryConfig";

interface PantryItem {
  _id: Id<"pantryItems">;
  quantity: number;
  unit: string;
  expirationDate?: number;
  location?: string;
  notes?: string;
  ingredient: {
    _id: Id<"ingredients">;
    name: string;
    category: string;
  } | null;
}

interface PantryItemCardProps {
  item: PantryItem;
}

export function PantryItemCard({ item }: PantryItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState(item.quantity);
  const [editedUnit, setEditedUnit] = useState(item.unit);
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePantryItem = useMutation(api.pantry.update);
  const removePantryItem = useMutation(api.pantry.remove);
  const { toast } = useToast();

  // Get category-specific styling
  const categoryInfo = getCategoryConfig(item.ingredient?.category);
  const CategoryIcon = categoryInfo.icon;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this item?")) {
      await removePantryItem({ id: item._id });
      toast({
        title: "Item removed",
        description: `${item.ingredient?.name} removed from pantry`,
      });
    }
  };

  const handleQuickAdjust = async (delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    if (newQuantity === 0) {
      if (confirm(`Remove ${item.ingredient?.name} from pantry?`)) {
        await removePantryItem({ id: item._id });
        toast({
          title: "Item removed",
          description: "Quantity reached 0",
        });
      }
      return;
    }

    setIsUpdating(true);
    try {
      await updatePantryItem({
        id: item._id,
        quantity: newQuantity,
      });
      toast({
        title: "Quantity updated",
        description: `${item.ingredient?.name}: ${newQuantity} ${item.unit}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editedQuantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!editedUnit.trim()) {
      toast({
        title: "Invalid unit",
        description: "Unit cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updatePantryItem({
        id: item._id,
        quantity: editedQuantity,
        unit: editedUnit.trim(),
      });
      setIsEditing(false);
      toast({
        title: "Item updated",
        description: `${item.ingredient?.name} updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedQuantity(item.quantity);
    setEditedUnit(item.unit);
    setIsEditing(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isExpiringSoon = (expirationDate?: number) => {
    if (!expirationDate) return false;
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return expirationDate <= sevenDaysFromNow;
  };

  const isExpired = (expirationDate?: number) => {
    if (!expirationDate) return false;
    return expirationDate < Date.now();
  };

  const getStockLevel = () => {
    if (item.quantity === 0) return "out";
    if (item.quantity <= 1) return "low";
    if (item.quantity <= 3) return "medium";
    return "good";
  };

  const stockLevel = getStockLevel();

  return (
    <Card
      className={`relative overflow-hidden border-l-4 ${categoryInfo.borderColor} hover:shadow-xl hover:scale-[1.02] transition-all duration-200 hover:border-primary/20 ${
        isUpdating ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Category Icon */}
          <div className={`flex-shrink-0 mt-0.5 ${categoryInfo.bgColor} p-2.5 rounded-lg`}>
            <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
          </div>

          {/* Item Info */}
          <div className="space-y-1.5 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight">
              {item.ingredient?.name || "Unknown"}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-medium">
                {categoryInfo.label}
              </Badge>
              {stockLevel === "low" && (
                <Badge variant="destructive" className="text-xs">Low Stock</Badge>
              )}
              {stockLevel === "medium" && (
                <Badge variant="outline" className="text-xs border-warning text-warning">Medium</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={isUpdating}
              aria-label="Edit item"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={isUpdating}
            aria-label={`Delete ${item.ingredient?.name || "item"}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quantity Display/Edit Section */}
        <div className="space-y-2">
          {!isEditing ? (
            <>
              {/* Display Mode with Quick Adjust Buttons */}
              <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-2xl font-bold hover:text-primary transition-colors tabular-nums"
                    aria-label={`Edit quantity: ${item.quantity} ${item.unit}`}
                  >
                    {item.quantity}
                  </button>
                  <span className="text-sm font-medium text-muted-foreground">{item.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-background"
                    onClick={() => handleQuickAdjust(-1)}
                    disabled={isUpdating}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-background"
                    onClick={() => handleQuickAdjust(1)}
                    disabled={isUpdating}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-3 p-3 border-2 border-primary/20 rounded-lg bg-background">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label htmlFor="edit-quantity" className="text-xs text-muted-foreground mb-1 block font-medium">Quantity</label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      value={editedQuantity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setEditedQuantity(isNaN(value) ? 0 : value);
                      }}
                      step="0.5"
                      min="0"
                      className="h-9"
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="edit-unit" className="text-xs text-muted-foreground mb-1 block font-medium">Unit</label>
                    <Input
                      id="edit-unit"
                      type="text"
                      value={editedUnit}
                      onChange={(e) => setEditedUnit(e.target.value)}
                      className="h-9"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isUpdating}
                    className="flex-1 h-8"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="flex-1 h-8"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Location */}
        {item.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.location.charAt(0).toUpperCase() + item.location.slice(1)}</span>
          </div>
        )}

        {/* Expiration Date */}
        {item.expirationDate && (
          <div className={`flex items-center gap-1.5 text-sm rounded-lg p-2 ${
            isExpired(item.expirationDate)
              ? "bg-destructive/10 border border-destructive/20"
              : isExpiringSoon(item.expirationDate)
              ? "bg-warning/10 border border-warning/20"
              : "bg-muted/30"
          }`}>
            <Calendar className={`h-4 w-4 ${
              isExpired(item.expirationDate)
                ? "text-destructive"
                : isExpiringSoon(item.expirationDate)
                ? "text-warning"
                : "text-muted-foreground"
            }`} />
            <span
              className={`font-medium ${
                isExpired(item.expirationDate)
                  ? "text-destructive"
                  : isExpiringSoon(item.expirationDate)
                  ? "text-warning"
                  : "text-muted-foreground"
              }`}
            >
              {isExpired(item.expirationDate)
                ? "Expired: "
                : isExpiringSoon(item.expirationDate)
                ? "Expires soon: "
                : "Expires: "}
              {formatDate(item.expirationDate)}
            </span>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="bg-muted/30 rounded-lg p-2.5 border border-dashed border-border">
            <p className="text-sm text-muted-foreground italic leading-relaxed">{item.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
