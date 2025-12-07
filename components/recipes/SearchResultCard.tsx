"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Sparkles, Loader2, Heart } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface AIRecipeSuggestion {
  title: string;
  description: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  canMakeWithPantry: boolean;
  matchPercentage: number;
  missingIngredients: string[];
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  instructions: string[];
}

interface SearchResultCardProps {
  recipe: AIRecipeSuggestion;
  householdId: Id<"households">;
  userId: Id<"users">;
}

export function SearchResultCard({ recipe, householdId, userId }: SearchResultCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const saveRecipe = useMutation(api.recipes.saveAIRecipe);
  const { toast } = useToast();
  const router = useRouter();
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const recipeId = await saveRecipe({
        householdId,
        addedBy: userId,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        ingredients: recipe.ingredients,
      });

      toast({
        title: "Recipe saved!",
        description: `"${recipe.title}" has been added to your collection.`,
      });

      // Navigate to the saved recipe
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      toast({
        title: "Failed to save recipe",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-shadow ${
        recipe.canMakeWithPantry ? "border-green-200" : ""
      }`}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{recipe.title}</CardTitle>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant={recipe.canMakeWithPantry ? "default" : "secondary"}>
              {recipe.matchPercentage}% Match
            </Badge>
            {recipe.canMakeWithPantry && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Sparkles className="h-3 w-3 mr-1" />
                Can Make!
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{recipe.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {recipe.difficulty && <Badge variant="secondary">{recipe.difficulty}</Badge>}
          {recipe.cuisine && <Badge variant="outline">{recipe.cuisine}</Badge>}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime}m</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings}</span>
            </div>
          )}
        </div>

        {recipe.missingIngredients.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm font-medium text-orange-900 mb-1">
              Missing ingredients:
            </p>
            <div className="flex flex-wrap gap-1">
              {recipe.missingIngredients.map((ing) => (
                <Badge key={ing} variant="outline" className="text-orange-700">
                  {ing}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-2">Ingredients:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {recipe.ingredients.slice(0, 5).map((ing, i) => (
              <li key={i}>
                • {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
            {recipe.ingredients.length > 5 && (
              <li className="text-xs italic">
                + {recipe.ingredients.length - 5} more...
              </li>
            )}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Instructions:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            {recipe.instructions.slice(0, 3).map((step, i) => (
              <li key={i} className="line-clamp-2">
                {step}
              </li>
            ))}
            {recipe.instructions.length > 3 && (
              <li className="text-xs italic">
                + {recipe.instructions.length - 3} more steps...
              </li>
            )}
          </ol>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Heart className="mr-2 h-4 w-4" />
              Save to My Recipes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
