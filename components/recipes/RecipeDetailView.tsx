"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, CheckCircle2, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CookRecipeDialog } from "./CookRecipeDialog";

interface RecipeIngredient {
  ingredient: {
    name: string;
    category: string;
  } | null;
  quantity: number;
  unit: string;
  notes?: string;
}

interface Recipe {
  _id: string;
  title: string;
  description?: string;
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  imageUrl?: string;
  ingredients?: RecipeIngredient[];
  userId?: string;
}

interface RecipeDetailViewProps {
  recipe: Recipe;
  currentUser?: {
    _id: string;
  };
  householdId?: string;
}

export function RecipeDetailView({ recipe, currentUser, householdId }: RecipeDetailViewProps) {
  const [showCookDialog, setShowCookDialog] = useState(false);
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const removeRecipe = useMutation(api.recipes.remove);
  const router = useRouter();
  const { toast } = useToast();

  const canDelete = recipe.userId === currentUser?._id;
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;

  const handleDelete = async () => {
    if (!canDelete) return;

    if (confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      try {
        await removeRecipe({ id: recipe._id as Id<"recipes"> });
        toast({
          title: "Recipe deleted",
          description: `"${recipe.title}" has been removed from your collection.`,
        });
        router.push("/recipes");
      } catch (error) {
        toast({
          title: "Failed to delete recipe",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Image */}
      {recipe.imageUrl && (
        <div className="relative w-full h-96 rounded-lg overflow-hidden">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title & Metadata */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-4xl font-bold tracking-tight">{recipe.title}</h1>
          <div className="flex gap-2">
            {hasIngredients && currentUser && (
              <Button
                onClick={() => setShowCookDialog(true)}
                className="flex-shrink-0"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Cook This Recipe
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {recipe.description && (
          <p className="text-lg text-muted-foreground">{recipe.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {recipe.difficulty && (
            <Badge variant="secondary">{recipe.difficulty}</Badge>
          )}
          {recipe.cuisine && <Badge variant="outline">{recipe.cuisine}</Badge>}
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} servings</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Ingredients */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ing, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">
                        {ing.quantity} {ing.unit}
                      </span>{" "}
                      <span>{ing.ingredient?.name || "Unknown ingredient"}</span>
                      {ing.notes && (
                        <span className="text-sm text-muted-foreground block">
                          {ing.notes}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No ingredients listed
                </p>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p>{step}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Cook Recipe Dialog */}
      {hasIngredients && currentUser && householdId && (
        <CookRecipeDialog
          isOpen={showCookDialog}
          onClose={() => setShowCookDialog(false)}
          recipeId={recipe._id as Id<"recipes">}
          recipeTitle={recipe.title}
          householdId={householdId as Id<"households">}
          userId={currentUser._id as Id<"users">}
          defaultServings={recipe.servings}
        />
      )}
    </div>
  );
}
