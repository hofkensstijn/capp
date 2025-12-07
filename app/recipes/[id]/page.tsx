"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { Id } from "@/convex/_generated/dataModel";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useStoreUser();
  const resolvedParams = React.use(params);

  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const { householdId } = useHousehold(currentUser?._id);

  const recipe = useQuery(api.recipes.get, {
    id: resolvedParams.id as Id<"recipes">,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view recipes</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Loading recipe...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <RecipeDetailView recipe={recipe} currentUser={currentUser ?? undefined} householdId={householdId} />
    </div>
  );
}
