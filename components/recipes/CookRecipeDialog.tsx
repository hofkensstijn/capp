"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChefHat,
  Check,
  X,
  AlertTriangle,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Confetti } from "@/components/ui/confetti";

interface CookRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: Id<"recipes">;
  recipeTitle: string;
  householdId: Id<"households">;
  userId?: Id<"users">;
  defaultServings?: number;
}

interface RecipeIngredient {
  _id: Id<"recipeIngredients">;
  ingredientId: Id<"ingredients">;
  quantity: number;
  unit: string;
  notes?: string;
}

interface PantryItem {
  _id: Id<"pantryItems">;
  ingredientId: Id<"ingredients">;
  quantity: number;
  unit: string;
}

interface IngredientWithAvailability extends RecipeIngredient {
  name: string;
  status: "available" | "insufficient" | "not-found";
  pantryQuantity?: number;
}

export function CookRecipeDialog({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
  householdId,
  userId,
  defaultServings = 1,
}: CookRecipeDialogProps) {
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [isCooking, setIsCooking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const recipeIngredients = useQuery(
    api.recipes.get,
    isOpen ? { id: recipeId } : "skip"
  );

  const pantryItems = useQuery(
    api.pantry.list,
    isOpen && householdId ? { householdId } : "skip"
  );

  const consumeIngredients = useMutation(api.pantry.consumeRecipeIngredients);
  const { toast } = useToast();

  // Calculate ingredient availability
  const ingredientsWithAvailability: IngredientWithAvailability[] =
    recipeIngredients?.ingredients?.map((ri: any) => {
      const pantryItem = pantryItems?.find(
        (pi) => pi.ingredientId === ri.ingredient._id
      );

      const adjustedQuantity = ri.quantity * servingsMultiplier;
      const pantryQuantity = pantryItem?.quantity || 0;

      let status: "available" | "insufficient" | "not-found" = "not-found";
      if (pantryQuantity >= adjustedQuantity) {
        status = "available";
      } else if (pantryQuantity > 0) {
        status = "insufficient";
      }

      return {
        ...ri,
        name: ri.ingredient?.name || "Unknown",
        status,
        pantryQuantity,
        quantity: adjustedQuantity,
      };
    }) || [];

  const availableCount = ingredientsWithAvailability.filter(
    (i) => i.status === "available"
  ).length;
  const insufficientCount = ingredientsWithAvailability.filter(
    (i) => i.status === "insufficient"
  ).length;
  const missingCount = ingredientsWithAvailability.filter(
    (i) => i.status === "not-found"
  ).length;

  const canCook = missingCount === 0 && insufficientCount === 0;

  const handleServingsChange = (delta: number) => {
    const newMultiplier = Math.max(0.25, servingsMultiplier + delta);
    setServingsMultiplier(Math.round(newMultiplier * 4) / 4); // Round to nearest 0.25
  };

  const handleCook = async () => {
    setIsCooking(true);
    try {
      const results = await consumeIngredients({
        householdId,
        recipeId,
        servingsMultiplier,
      });

      const consumedCount = results.filter((r) => r.status === "consumed").length;
      const totalCount = results.length;

      // Show confetti
      setShowConfetti(true);

      toast({
        title: "Recipe cooked!",
        description: `Consumed ${consumedCount} of ${totalCount} ingredients from your pantry`,
      });

      // Close after showing confetti
      setTimeout(() => {
        setShowConfetti(false);
        setServingsMultiplier(1);
        onClose();
      }, 3000);
    } catch (error) {
      toast({
        title: "Failed to cook recipe",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setIsCooking(false);
    }
  };

  const handleClose = () => {
    if (!isCooking) {
      setServingsMultiplier(1);
      onClose();
    }
  };

  return (
    <>
      <Confetti show={showConfetti} />
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Cook: {recipeTitle}
            </DialogTitle>
            <DialogDescription>
              Review ingredient availability and adjust servings before cooking
            </DialogDescription>
          </DialogHeader>

          {/* Servings Adjuster */}
          <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
            <Label>Servings Multiplier</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleServingsChange(-0.25)}
                disabled={servingsMultiplier <= 0.25 || isCooking}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center">
                <Input
                  type="number"
                  value={servingsMultiplier}
                  onChange={(e) =>
                    setServingsMultiplier(Math.max(0.25, parseFloat(e.target.value) || 1))
                  }
                  step="0.25"
                  min="0.25"
                  className="text-center font-bold text-lg"
                  disabled={isCooking}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {servingsMultiplier === 1
                    ? "Original serving size"
                    : servingsMultiplier < 1
                    ? `${servingsMultiplier * 100}% of recipe`
                    : `${servingsMultiplier}x the recipe`}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleServingsChange(0.25)}
                disabled={isCooking}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="space-y-2">
            <h3 className="font-semibold">Ingredients ({ingredientsWithAvailability.length})</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {ingredientsWithAvailability.map((ingredient, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    ingredient.status === "available"
                      ? "bg-success/5 border-success/20"
                      : ingredient.status === "insufficient"
                      ? "bg-warning/5 border-warning/20"
                      : "bg-destructive/5 border-destructive/20"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {ingredient.status === "available" ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : ingredient.status === "insufficient" ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{ingredient.name}</span>
                  </div>
                  <div className="text-sm text-right">
                    <div className="font-mono">
                      {ingredient.quantity.toFixed(2)} {ingredient.unit}
                    </div>
                    {ingredient.status === "available" && (
                      <div className="text-xs text-success">
                        Have: {ingredient.pantryQuantity?.toFixed(2)}
                      </div>
                    )}
                    {ingredient.status === "insufficient" && (
                      <div className="text-xs text-warning">
                        Have: {ingredient.pantryQuantity?.toFixed(2)} / Need: {ingredient.quantity.toFixed(2)}
                      </div>
                    )}
                    {ingredient.status === "not-found" && (
                      <div className="text-xs text-destructive">Not in pantry</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex gap-4 p-4 border rounded-lg bg-card">
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-success">{availableCount}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-warning">{insufficientCount}</div>
              <div className="text-xs text-muted-foreground">Insufficient</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-destructive">{missingCount}</div>
              <div className="text-xs text-muted-foreground">Missing</div>
            </div>
          </div>

          {/* Warning/Info Messages */}
          {!canCook && (
            <div className="p-3 border rounded-lg bg-warning/10 border-warning/20 text-sm">
              <p className="font-medium text-warning">
                ⚠️ You don't have all ingredients in sufficient quantities
              </p>
              <p className="text-muted-foreground mt-1">
                You can still cook this recipe, and we'll deduct what you have. You may need to
                substitute or adjust.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isCooking}>
              Cancel
            </Button>
            <Button
              onClick={handleCook}
              disabled={isCooking || ingredientsWithAvailability.length === 0}
            >
              {isCooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cooking...
                </>
              ) : (
                <>
                  <ChefHat className="mr-2 h-4 w-4" />
                  {canCook ? "Cook Now" : "Cook Anyway"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
