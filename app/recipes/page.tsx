"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { UploadRecipeDialog } from "@/components/recipes/UploadRecipeDialog";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeSearchBar } from "@/components/recipes/RecipeSearchBar";
import { SearchResultCard } from "@/components/recipes/SearchResultCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BookOpen, ChefHat, Loader2, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function RecipesPage() {
  const { user, isAuthenticated } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const { householdId, isLoading: householdLoading } = useHousehold(currentUser?._id);

  const recipes = useQuery(
    api.recipes.list,
    householdId ? { householdId } : "skip"
  );
  const pantryItems = useQuery(
    api.pantry.list,
    householdId ? { householdId } : "skip"
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchResults, setSearchResults] = useState<AIRecipeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyCanMake, setShowOnlyCanMake] = useState(false);

  const searchRecipes = useAction(api.aiSearch.searchRecipesWithAI);

  // Get recipes with availability info
  const recipesYouCanMake = useQuery(
    api.recipes.getRecipesYouCanMake,
    householdId ? { householdId } : "skip"
  );

  // Filter recipes based on the toggle
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!showOnlyCanMake) return recipes;
    if (!recipesYouCanMake) return [];

    // Get IDs of recipes that can be made (100% match)
    const canMakeIds = new Set(
      recipesYouCanMake
        .filter((r: any) => r.canMake)
        .map((r: any) => r._id)
    );

    return recipes.filter((recipe) => canMakeIds.has(recipe._id));
  }, [recipes, recipesYouCanMake, showOnlyCanMake]);

  const handleSearch = async (query: string) => {
    if (!householdId) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchQuery(query);

    try {
      const suggestions = await searchRecipes({
        householdId,
        searchQuery: query,
      });

      const sorted = suggestions.sort(
        (a: AIRecipeSuggestion, b: AIRecipeSuggestion) =>
          b.matchPercentage - a.matchPercentage
      );

      setSearchResults(sorted);
    } catch (error) {
      console.error("Search error:", error);
      alert(`Search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSearching(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">
          Please sign in to view recipes
        </p>
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

  const pantryCount = pantryItems?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
        <p className="text-muted-foreground">
          Discover and manage your recipe collection
        </p>
      </div>

      <Tabs defaultValue="my-recipes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-recipes">My Recipes</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* My Recipes Tab */}
        <TabsContent value="my-recipes" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {showOnlyCanMake ? (
                  <>
                    {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""} you can make
                    {filteredRecipes.length !== recipes?.length && (
                      <span className="text-muted-foreground/60">
                        {" "}(of {recipes?.length || 0} total)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {recipes?.length || 0} recipe{recipes?.length !== 1 ? "s" : ""} in your collection
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Filter Toggle */}
              {recipes && recipes.length > 0 && pantryItems && pantryItems.length > 0 && (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <Switch
                    id="can-make-filter"
                    checked={showOnlyCanMake}
                    onCheckedChange={setShowOnlyCanMake}
                  />
                  <Label htmlFor="can-make-filter" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Can make with pantry</span>
                  </Label>
                </div>
              )}

              <UploadRecipeDialog
                householdId={householdId}
                userId={currentUser._id}
                onRecipeCreated={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>

          {!recipes || recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload a recipe photo or search for recipes to save
              </p>
              <UploadRecipeDialog
                householdId={householdId}
                userId={currentUser._id}
                onRecipeCreated={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          ) : filteredRecipes.length === 0 && showOnlyCanMake ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recipes you can make right now</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Add more ingredients to your pantry to unlock recipes, or turn off the filter to see all recipes.
              </p>
              <Button variant="outline" onClick={() => setShowOnlyCanMake(false)}>
                Show All Recipes
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" key={refreshKey}>
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  householdId={householdId}
                  currentUserId={currentUser._id}
                  onDelete={() => setRefreshKey((k) => k + 1)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <RecipeSearchBar
            onSearch={handleSearch}
            isSearching={isSearching}
            pantryCount={pantryCount}
          />

          {pantryCount === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>Tip:</strong> Add ingredients to your pantry to get better,
                personalized recipe suggestions!
              </p>
            </div>
          )}

          {isSearching && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Finding the best recipes for you...</p>
            </div>
          )}

          {!isSearching && hasSearched && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recipes found</h3>
              <p className="text-muted-foreground">Try a different search query</p>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.length} recipe{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {searchResults.map((recipe, index) => (
                  <SearchResultCard
                    key={index}
                    recipe={recipe}
                    householdId={householdId}
                    userId={currentUser._id}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
