import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all recipes for a user (includes public recipes)
export const list = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) {
      // Return only public recipes if no user specified
      return await ctx.db
        .query("recipes")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .collect();
    }

    // Get user's private recipes and public recipes
    const userRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const publicRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Combine and deduplicate
    const allRecipes = [...userRecipes, ...publicRecipes];
    const uniqueRecipes = Array.from(
      new Map(allRecipes.map((recipe) => [recipe._id, recipe])).values()
    );

    return uniqueRecipes;
  },
});

// Get a single recipe with ingredients
export const get = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    // Get recipe ingredients
    const recipeIngredients = await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();

    // Fetch ingredient details
    const ingredientsWithDetails = await Promise.all(
      recipeIngredients.map(async (ri) => {
        const ingredient = await ctx.db.get(ri.ingredientId);
        return {
          ...ri,
          ingredient,
        };
      })
    );

    return {
      ...recipe,
      ingredients: ingredientsWithDetails,
    };
  },
});

// Create a new recipe
export const create = mutation({
  args: {
    userId: v.optional(v.id("users")),
    title: v.string(),
    description: v.optional(v.string()),
    instructions: v.array(v.string()),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    difficulty: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("recipes", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      instructions: args.instructions,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      isPublic: args.isPublic,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Add ingredient to recipe
export const addIngredient = mutation({
  args: {
    recipeId: v.id("recipes"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipeIngredients", {
      recipeId: args.recipeId,
      ingredientId: args.ingredientId,
      quantity: args.quantity,
      unit: args.unit,
      notes: args.notes,
    });
  },
});

// Delete recipe
export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    // Delete associated recipe ingredients
    const recipeIngredients = await ctx.db
      .query("recipeIngredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();

    for (const ri of recipeIngredients) {
      await ctx.db.delete(ri._id);
    }

    // Delete recipe
    await ctx.db.delete(args.id);
  },
});

// Get recipes user can make with current pantry
export const getRecipesYouCanMake = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get user's pantry items
    const pantryItems = await ctx.db
      .query("pantryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const availableIngredientIds = new Set(
      pantryItems.map((item) => item.ingredientId)
    );

    // Get all recipes
    const recipes = await ctx.db.query("recipes").collect();

    // Filter recipes that can be made
    const recipesYouCanMake = [];

    for (const recipe of recipes) {
      const recipeIngredients = await ctx.db
        .query("recipeIngredients")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();

      // Check if all ingredients are available
      const canMake = recipeIngredients.every((ri) =>
        availableIngredientIds.has(ri.ingredientId)
      );

      if (canMake && recipeIngredients.length > 0) {
        recipesYouCanMake.push(recipe);
      }
    }

    return recipesYouCanMake;
  },
});

// Generate image upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
