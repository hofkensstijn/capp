"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Clock, Users, Loader2, ChefHat } from "lucide-react";

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

export default function SearchPage() {
  const { user } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const pantryItems = useQuery(
    api.pantry.list,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<AIRecipeSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchRecipes = useAction(api.aiSearch.searchRecipesWithAI);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim() || !currentUser) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const suggestions = await searchRecipes({
        userId: currentUser._id,
        searchQuery: searchQuery.trim(),
      });

      // Sort by match percentage (highest first)
      const sorted = suggestions.sort(
        (a: AIRecipeSuggestion, b: AIRecipeSuggestion) =>
          b.matchPercentage - a.matchPercentage
      );

      setResults(sorted);
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
        <p className="text-muted-foreground">Please sign in to search recipes</p>
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

  const pantryCount = pantryItems?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Smart Recipe Search</h1>
        </div>
        <p className="text-muted-foreground">
          AI-powered search using your pantry ({pantryCount} ingredients)
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="What would you like to cook? (e.g., 'quick pasta dinner', 'healthy chicken')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {pantryCount === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-900">
              💡 <strong>Tip:</strong> Add ingredients to your pantry to get better,
              personalized recipe suggestions!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Finding the best recipes for you...</p>
        </div>
      )}

      {!isSearching && hasSearched && results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No recipes found</h3>
            <p className="text-muted-foreground">Try a different search query</p>
          </CardContent>
        </Card>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {results.length} recipe{results.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {results.map((recipe, index) => {
              const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

              return (
                <Card
                  key={index}
                  className={`overflow-hidden hover:shadow-lg transition-shadow ${
                    recipe.canMakeWithPantry ? "border-green-200" : ""
                  }`}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl">{recipe.title}</CardTitle>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge
                          variant={recipe.canMakeWithPantry ? "default" : "secondary"}
                        >
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
                      {recipe.difficulty && (
                        <Badge variant="secondary">{recipe.difficulty}</Badge>
                      )}
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
