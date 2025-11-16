"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { AddPantryItemDialog } from "@/components/pantry/AddPantryItemDialog";
import { PantryItemCard } from "@/components/pantry/PantryItemCard";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function PantryPage() {
  const { user, isAuthenticated } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const pantryItems = useQuery(
    api.pantry.list,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Please sign in to view your pantry</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Pantry</h1>
          <p className="text-muted-foreground">
            Manage your ingredient inventory
          </p>
        </div>
        <AddPantryItemDialog userId={currentUser._id} />
      </div>

      {!pantryItems || pantryItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Your pantry is empty</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your first ingredient
          </p>
          <AddPantryItemDialog userId={currentUser._id} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pantryItems.map((item) => (
            <PantryItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
