import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all pantry items for a household
export const list = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("pantryItems")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Fetch ingredient details for each item
    const itemsWithIngredients = await Promise.all(
      items.map(async (item) => {
        const ingredient = await ctx.db.get(item.ingredientId);
        return {
          ...item,
          ingredient,
        };
      })
    );

    return itemsWithIngredients;
  },
});

// Add item to pantry
export const add = mutation({
  args: {
    householdId: v.id("households"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    expirationDate: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if item already exists
    const existing = await ctx.db
      .query("pantryItems")
      .withIndex("by_household_and_ingredient", (q) =>
        q.eq("householdId", args.householdId).eq("ingredientId", args.ingredientId)
      )
      .first();

    if (existing) {
      // Update quantity if item exists
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + args.quantity,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new pantry item
    const now = Date.now();
    return await ctx.db.insert("pantryItems", {
      householdId: args.householdId,
      ingredientId: args.ingredientId,
      quantity: args.quantity,
      unit: args.unit,
      expirationDate: args.expirationDate,
      location: args.location,
      notes: args.notes,
      addedBy: args.addedBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update pantry item
export const update = mutation({
  args: {
    id: v.id("pantryItems"),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    expirationDate: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

// Remove item from pantry
export const remove = mutation({
  args: { id: v.id("pantryItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Add multiple items to pantry (batch operation)
export const addBatch = mutation({
  args: {
    householdId: v.id("households"),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        category: v.string(),
        estimatedExpirationDays: v.number(),
        location: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    addedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<Array<{ success: boolean; name: string; id?: any; error?: string }>> => {
    const results: Array<{ success: boolean; name: string; id?: any; error?: string }> = [];

    for (const item of args.items) {
      try {
        // Find or create ingredient
        let ingredientId;

        // Search for existing ingredient by name
        const allIngredients = await ctx.db.query("ingredients").collect();
        const existingIngredient = allIngredients.find(
          (ing) => ing.name.toLowerCase() === item.name.toLowerCase()
        );

        if (existingIngredient) {
          // Use existing ingredient
          ingredientId = existingIngredient._id;
        } else {
          // Create new ingredient
          ingredientId = await ctx.db.insert("ingredients", {
            name: item.name,
            category: item.category,
            commonUnit: item.unit,
            createdAt: Date.now(),
          });
        }

        // Calculate expiration date
        const expirationDate = item.estimatedExpirationDays
          ? Date.now() + item.estimatedExpirationDays * 24 * 60 * 60 * 1000
          : undefined;

        // Auto-detect location based on category if not provided
        const location = item.location || detectLocation(item.category);

        // Check if item already exists
        const existing = await ctx.db
          .query("pantryItems")
          .withIndex("by_household_and_ingredient", (q) =>
            q.eq("householdId", args.householdId).eq("ingredientId", ingredientId)
          )
          .first();

        let pantryItemId;
        if (existing) {
          // Update quantity if item exists
          await ctx.db.patch(existing._id, {
            quantity: existing.quantity + item.quantity,
            updatedAt: Date.now(),
          });
          pantryItemId = existing._id;
        } else {
          // Create new pantry item
          const now = Date.now();
          pantryItemId = await ctx.db.insert("pantryItems", {
            householdId: args.householdId,
            ingredientId,
            quantity: item.quantity,
            unit: item.unit,
            expirationDate,
            location,
            notes: item.notes,
            addedBy: args.addedBy,
            createdAt: now,
            updatedAt: now,
          });
        }

        results.push({
          success: true,
          name: item.name,
          id: pantryItemId,
        });
      } catch (error) {
        results.push({
          success: false,
          name: item.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

// Helper function to auto-detect storage location based on category
function detectLocation(category: string): string {
  const locationMap: Record<string, string> = {
    dairy: "fridge",
    proteins: "fridge",
    vegetables: "fridge",
    fruits: "fridge",
    frozen: "freezer",
    grains: "pantry",
    spices: "pantry",
    condiments: "pantry",
    other: "pantry",
  };

  return locationMap[category] || "pantry";
}

// Consume recipe ingredients - deduct quantities when cooking
export const consumeRecipeIngredients = mutation({
  args: {
    householdId: v.id("households"),
    recipeId: v.id("recipes"),
    servingsMultiplier: v.optional(v.number()), // e.g., 0.5 for half recipe, 2 for double
  },
  handler: async (ctx, args) => {
    const multiplier = args.servingsMultiplier || 1;

    // Get recipe ingredients
    const recipeIngredients = await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    const results: Array<{
      ingredientName: string;
      status: "consumed" | "insufficient" | "not-found";
      requested: number;
      available?: number;
      consumed: number;
      unit: string;
    }> = [];

    for (const recipeIngredient of recipeIngredients) {
      const ingredient = await ctx.db.get(recipeIngredient.ingredientId);
      const ingredientName = ingredient?.name || "Unknown";
      const requestedQuantity = recipeIngredient.quantity * multiplier;

      // Find pantry item for this ingredient
      const pantryItem = await ctx.db
        .query("pantryItems")
        .withIndex("by_household_and_ingredient", (q) =>
          q.eq("householdId", args.householdId).eq("ingredientId", recipeIngredient.ingredientId)
        )
        .first();

      if (!pantryItem) {
        results.push({
          ingredientName,
          status: "not-found",
          requested: requestedQuantity,
          consumed: 0,
          unit: recipeIngredient.unit,
        });
        continue;
      }

      // Check if we have enough
      if (pantryItem.quantity < requestedQuantity) {
        // Partial consumption - use what we have
        const consumedAmount = pantryItem.quantity;
        await ctx.db.patch(pantryItem._id, {
          quantity: 0,
          updatedAt: Date.now(),
        });

        results.push({
          ingredientName,
          status: "insufficient",
          requested: requestedQuantity,
          available: pantryItem.quantity,
          consumed: consumedAmount,
          unit: pantryItem.unit,
        });
      } else {
        // Full consumption - deduct requested amount
        const newQuantity = pantryItem.quantity - requestedQuantity;

        if (newQuantity === 0) {
          // Remove item if quantity reaches 0
          await ctx.db.delete(pantryItem._id);
        } else {
          await ctx.db.patch(pantryItem._id, {
            quantity: newQuantity,
            updatedAt: Date.now(),
          });
        }

        results.push({
          ingredientName,
          status: "consumed",
          requested: requestedQuantity,
          available: pantryItem.quantity,
          consumed: requestedQuantity,
          unit: pantryItem.unit,
        });
      }
    }

    return results;
  },
});

// Get items expiring soon (within 7 days)
export const getExpiringSoon = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const items = await ctx.db
      .query("pantryItems")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    const expiringSoon = items.filter(
      (item) => item.expirationDate && item.expirationDate <= sevenDaysFromNow
    );

    // Fetch ingredient details
    const itemsWithIngredients = await Promise.all(
      expiringSoon.map(async (item) => {
        const ingredient = await ctx.db.get(item.ingredientId);
        return {
          ...item,
          ingredient,
        };
      })
    );

    return itemsWithIngredients;
  },
});
