"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, Trash2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Recipe {
  _id: Id<"recipes">;
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  imageUrl?: string;
  isPublic: boolean;
  userId?: Id<"users">;
}

interface RecipeCardProps {
  recipe: Recipe;
  currentUserId?: Id<"users">;
  onDelete?: () => void;
}

export function RecipeCard({
  recipe,
  currentUserId,
  onDelete,
}: RecipeCardProps) {
  const removeRecipe = useMutation(api.recipes.remove);

  const canDelete = recipe.userId === currentUserId;

  const handleDelete = async () => {
    if (!canDelete) return;

    if (confirm(`Are you sure you want to delete "${recipe.title}"?`)) {
      await removeRecipe({ id: recipe._id });
      if (onDelete) onDelete();
    }
  };

  const totalTime =
    (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {recipe.imageUrl && (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl line-clamp-1">
            {recipe.title}
          </CardTitle>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {recipe.difficulty && (
            <Badge variant="secondary">{recipe.difficulty}</Badge>
          )}
          {recipe.cuisine && (
            <Badge variant="outline">{recipe.cuisine}</Badge>
          )}
          {recipe.isPublic && (
            <Badge variant="outline">Public</Badge>
          )}
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
      </CardContent>
    </Card>
  );
}
