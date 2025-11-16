"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { UploadRecipeDialog } from "@/components/recipes/UploadRecipeDialog";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { BookOpen } from "lucide-react";
import { useState } from "react";

export default function RecipesPage() {
  const { user, isAuthenticated } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const recipes = useQuery(
    api.recipes.list,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">
          Please sign in to view recipes
        </p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Browse and manage your recipe collection
          </p>
        </div>
        <UploadRecipeDialog
          userId={currentUser._id}
          onRecipeCreated={() => setRefreshKey((k) => k + 1)}
        />
      </div>

      {!recipes || recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload a recipe photo to get started
          </p>
          <UploadRecipeDialog
            userId={currentUser._id}
            onRecipeCreated={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" key={refreshKey}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe._id}
              recipe={recipe}
              currentUserId={currentUser._id}
              onDelete={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
