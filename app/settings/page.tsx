"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HouseholdCard } from "@/components/household/HouseholdCard";
import { CreateHouseholdDialog } from "@/components/household/CreateHouseholdDialog";
import { JoinHouseholdDialog } from "@/components/household/JoinHouseholdDialog";
import { Home, Users } from "lucide-react";

export default function SettingsPage() {
  const { user } = useStoreUser();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const { household, isLoading } = useHousehold(currentUser?._id);

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and household</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and household</p>
      </div>

      {/* Household Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Household
        </h2>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : household ? (
          <HouseholdCard household={household} userId={currentUser._id} />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-muted p-3 rounded-lg">
                  <Home className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>No Household</CardTitle>
                  <CardDescription>
                    Create or join a household to share your pantry, recipes, and shopping list
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-3">
              <CreateHouseholdDialog
                userId={currentUser._id}
                userName={currentUser.name}
              />
              <JoinHouseholdDialog userId={currentUser._id} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
