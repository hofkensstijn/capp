"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoreUser } from "@/lib/hooks/useStoreUser";
import { useHousehold } from "@/lib/hooks/useHousehold";
import { usePostHogIdentify } from "@/providers/PostHogProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, BookOpen, ShoppingCart, Sparkles, Camera, Zap, Plus, ChefHat, AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { getCategoryConfig } from "@/lib/categoryConfig";

export default function DashboardPage() {
  const { user } = useStoreUser();
  usePostHogIdentify();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { clerkId: user.id } : "skip"
  );
  const { householdId, isLoading: householdLoading } = useHousehold(currentUser?._id);

  const pantryItems = useQuery(
    api.pantry.list,
    householdId ? { householdId } : "skip"
  );
  const recipes = useQuery(
    api.recipes.list,
    householdId ? { householdId } : "skip"
  );
  const recipesYouCanMake = useQuery(
    api.recipes.getRecipesYouCanMake,
    householdId ? { householdId } : "skip"
  );
  const shoppingList = useQuery(
    api.shoppingList.getActiveList,
    householdId ? { householdId } : "skip"
  );

  const pantryCount = pantryItems?.length || 0;
  const recipesCount = recipes?.length || 0;
  const canMakeCount = recipesYouCanMake?.length || 0;
  const shoppingCount = shoppingList?.items.filter((i) => !i.isPurchased).length || 0;

  // Calculate expiring items
  const now = Date.now();
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  const expiringItems = pantryItems?.filter((item) => {
    if (!item.expirationDate) return false;
    return item.expirationDate <= sevenDaysFromNow && item.expirationDate >= now;
  }).sort((a, b) => (a.expirationDate || 0) - (b.expirationDate || 0)) || [];

  const expiredItems = pantryItems?.filter((item) => {
    if (!item.expirationDate) return false;
    return item.expirationDate < now;
  }) || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const diffDays = Math.ceil((timestamp - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Expired";
    return `${diffDays} days`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Capp, your smart cooking assistant
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pantry Items */}
        <Link href="/pantry">
          <Card className="border-l-4 border-l-green-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pantry Items</CardTitle>
              <div className="bg-green-100 dark:bg-green-950/50 p-2 rounded-lg">
                <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={pantryCount} className="text-3xl font-bold" />
              <p className="text-xs text-muted-foreground mt-1">
                Items in your pantry
              </p>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                View pantry <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Saved Recipes */}
        <Link href="/recipes">
          <Card className="border-l-4 border-l-amber-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Recipes</CardTitle>
              <div className="bg-amber-100 dark:bg-amber-950/50 p-2 rounded-lg">
                <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={recipesCount} className="text-3xl font-bold" />
              <p className="text-xs text-muted-foreground mt-1">
                Recipes in your collection
              </p>
              <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                View recipes <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Shopping List */}
        <Link href="/shopping-list">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shopping List</CardTitle>
              <div className="bg-blue-100 dark:bg-blue-950/50 p-2 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={shoppingCount} className="text-3xl font-bold" />
              <p className="text-xs text-muted-foreground mt-1">
                Items to purchase
              </p>
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                View list <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Recipes You Can Make */}
        <Link href="/recipes?filter=can-make">
          <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-transparent hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Cook</CardTitle>
              <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <AnimatedCounter value={canMakeCount} className="text-3xl font-bold text-primary" />
              <p className="text-xs text-muted-foreground mt-1">
                Recipes with your ingredients
              </p>
              <div className="flex items-center text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Start cooking <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/pantry" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-950/20">
                <div className="bg-green-100 dark:bg-green-950/50 p-1.5 rounded">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Add to Pantry</p>
                  <p className="text-xs text-muted-foreground">Scan receipt or quick add items</p>
                </div>
              </Button>
            </Link>
            <Link href="/recipes" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                <div className="bg-amber-100 dark:bg-amber-950/50 p-1.5 rounded">
                  <Camera className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Add a Recipe</p>
                  <p className="text-xs text-muted-foreground">Upload a photo or enter manually</p>
                </div>
              </Button>
            </Link>
            <Link href="/recipes" className="block">
              <Button variant="outline" className="w-full justify-start gap-3 h-12 hover:border-primary/50 hover:bg-primary/5">
                <div className="bg-primary/10 p-1.5 rounded">
                  <ChefHat className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Find Recipes</p>
                  <p className="text-xs text-muted-foreground">Search based on your pantry</p>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Expiring Soon
                </CardTitle>
                <CardDescription>Items that need your attention</CardDescription>
              </div>
              {(expiringItems.length > 0 || expiredItems.length > 0) && (
                <Badge variant="outline" className="border-warning text-warning">
                  {expiringItems.length + expiredItems.length} items
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {expiredItems.length === 0 && expiringItems.length === 0 ? (
              <div className="text-center py-6">
                <div className="bg-muted/50 rounded-full p-3 w-fit mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">All clear!</p>
                <p className="text-xs text-muted-foreground">No items expiring soon</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {/* Expired items first */}
                {expiredItems.slice(0, 3).map((item) => {
                  const categoryInfo = getCategoryConfig(item.ingredient?.category);
                  const CategoryIcon = categoryInfo.icon;
                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <div className={`${categoryInfo.bgColor} p-1.5 rounded`}>
                        <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.ingredient?.name}</p>
                        <p className="text-xs text-destructive font-medium">Expired</p>
                      </div>
                      <Badge variant="destructive" className="text-xs shrink-0">
                        Expired
                      </Badge>
                    </div>
                  );
                })}

                {/* Expiring soon items */}
                {expiringItems.slice(0, 5 - Math.min(expiredItems.length, 3)).map((item) => {
                  const categoryInfo = getCategoryConfig(item.ingredient?.category);
                  const CategoryIcon = categoryInfo.icon;
                  return (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-warning/10 border border-warning/20"
                    >
                      <div className={`${categoryInfo.bgColor} p-1.5 rounded`}>
                        <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.ingredient?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs border-warning text-warning shrink-0">
                        {formatDate(item.expirationDate!)}
                      </Badge>
                    </div>
                  );
                })}

                {/* Show more link */}
                {(expiredItems.length + expiringItems.length) > 5 && (
                  <Link href="/pantry?filter=expiring">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground mt-2">
                      View all {expiredItems.length + expiringItems.length} items
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
