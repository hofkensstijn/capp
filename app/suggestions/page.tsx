"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, Users, ChefHat } from "lucide-react";

export default function SuggestionsPage() {
  const { user } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const recipesYouCanMake = useQuery(
    api.recipes.getRecipesYouCanMake,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );
  const pantryItems = useQuery(
    api.pantry.list,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view suggestions</p>
      </div>
    );
  }

  if (user && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const pantryCount = pantryItems?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Recipe Suggestions</h1>
        </div>
        <p className="text-muted-foreground">
          Recipes you can make with your current pantry items
        </p>
      </div>

      {pantryCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Your pantry is empty</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              Add ingredients to your pantry to see recipe suggestions based on what
              you have!
            </p>
            <Button asChild>
              <a href="/pantry">Go to Pantry</a>
            </Button>
          </CardContent>
        </Card>
      ) : !recipesYouCanMake || recipesYouCanMake.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching recipes yet</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-md">
              You have {pantryCount} ingredient{pantryCount !== 1 ? "s" : ""} in
              your pantry, but no recipes match yet. Try uploading more recipes or
              adding more ingredients!
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/pantry">Add Ingredients</a>
              </Button>
              <Button asChild>
                <a href="/recipes">Upload Recipes</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">
              🎉 Great news! You can make {recipesYouCanMake.length} recipe
              {recipesYouCanMake.length !== 1 ? "s" : ""} with your current ingredients!
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipesYouCanMake.map((recipe) => {
              const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

              return (
                <Card
                  key={recipe._id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
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
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl line-clamp-2">
                        {recipe.title}
                      </CardTitle>
                      <Badge variant="default" className="shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Match!
                      </Badge>
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

                    <Button className="w-full" asChild>
                      <a href={`/recipes/${recipe._id}`}>View Recipe</a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
