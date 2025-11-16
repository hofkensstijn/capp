import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all pantry items for a user
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("pantryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
    userId: v.id("users"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    expirationDate: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if item already exists
    const existing = await ctx.db
      .query("pantryItems")
      .withIndex("by_user_and_ingredient", (q) =>
        q.eq("userId", args.userId).eq("ingredientId", args.ingredientId)
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
      userId: args.userId,
      ingredientId: args.ingredientId,
      quantity: args.quantity,
      unit: args.unit,
      expirationDate: args.expirationDate,
      location: args.location,
      notes: args.notes,
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

// Get items expiring soon (within 7 days)
export const getExpiringSoon = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const items = await ctx.db
      .query("pantryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
