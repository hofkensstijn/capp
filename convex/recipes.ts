import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all recipes for a household (includes public recipes)
export const list = query({
  args: { householdId: v.optional(v.id("households")) },
  handler: async (ctx, args) => {
    if (!args.householdId) {
      // Return only public recipes if no household specified
      return await ctx.db
        .query("recipes")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .collect();
    }

    // Get household's private recipes and public recipes
    const householdRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    const publicRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Combine and deduplicate
    const allRecipes = [...householdRecipes, ...publicRecipes];
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
    householdId: v.optional(v.id("households")),
    addedBy: v.optional(v.id("users")),
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
      householdId: args.householdId,
      addedBy: args.addedBy,
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

// Get recipes household can make with current pantry
export const getRecipesYouCanMake = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    // Get household's pantry items
    const pantryItems = await ctx.db
      .query("pantryItems")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Create a map of ingredient ID to pantry quantity
    const pantryMap = new Map(
      pantryItems.map((item) => [item.ingredientId.toString(), item.quantity])
    );

    // Get all recipes (household's + public)
    const householdRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    const publicRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    const allRecipes = [...householdRecipes, ...publicRecipes];
    const recipes = Array.from(
      new Map(allRecipes.map((recipe) => [recipe._id, recipe])).values()
    );

    // Filter recipes with detailed availability info
    const recipesWithAvailability = [];

    for (const recipe of recipes) {
      const recipeIngredients = await ctx.db
        .query("recipeIngredients")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .collect();

      if (recipeIngredients.length === 0) continue;

      let totalIngredients = recipeIngredients.length;
      let availableCount = 0;
      let sufficientCount = 0;
      const missingIngredients = [];
      const insufficientIngredients = [];

      for (const recipeIngredient of recipeIngredients) {
        const pantryQuantity = pantryMap.get(recipeIngredient.ingredientId.toString()) || 0;
        const ingredient = await ctx.db.get(recipeIngredient.ingredientId);

        if (pantryQuantity === 0) {
          missingIngredients.push({
            name: ingredient?.name || "Unknown",
            needed: recipeIngredient.quantity,
            unit: recipeIngredient.unit,
          });
        } else if (pantryQuantity < recipeIngredient.quantity) {
          availableCount++;
          insufficientIngredients.push({
            name: ingredient?.name || "Unknown",
            needed: recipeIngredient.quantity,
            have: pantryQuantity,
            unit: recipeIngredient.unit,
          });
        } else {
          availableCount++;
          sufficientCount++;
        }
      }

      // Calculate match percentage (0-100)
      const matchPercentage = Math.round((sufficientCount / totalIngredients) * 100);

      // Only include recipes where at least some ingredients are available
      if (availableCount > 0) {
        recipesWithAvailability.push({
          ...recipe,
          matchPercentage,
          totalIngredients,
          sufficientCount,
          missingIngredients,
          insufficientIngredients,
          canMake: sufficientCount === totalIngredients,
        });
      }
    }

    // Sort by match percentage (best matches first)
    return recipesWithAvailability.sort((a, b) => b.matchPercentage - a.matchPercentage);
  },
});

// Save AI-generated recipe to household's collection
export const saveAIRecipe = mutation({
  args: {
    householdId: v.id("households"),
    addedBy: v.optional(v.id("users")),
    title: v.string(),
    description: v.string(),
    instructions: v.array(v.string()),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    servings: v.optional(v.number()),
    difficulty: v.optional(v.string()),
    cuisine: v.optional(v.string()),
    ingredients: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: v.string(),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the recipe
    const recipeId = await ctx.db.insert("recipes", {
      householdId: args.householdId,
      addedBy: args.addedBy,
      title: args.title,
      description: args.description,
      instructions: args.instructions,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      servings: args.servings,
      difficulty: args.difficulty,
      cuisine: args.cuisine,
      imageUrl: undefined,
      imageStorageId: undefined,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    // Add ingredients
    for (const ing of args.ingredients) {
      // Find or create ingredient
      const allIngredients = await ctx.db.query("ingredients").collect();
      let ingredientId = allIngredients.find(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase()
      )?._id;

      if (!ingredientId) {
        // Create new ingredient
        ingredientId = await ctx.db.insert("ingredients", {
          name: ing.name,
          category: "other",
          commonUnit: ing.unit,
          createdAt: now,
        });
      }

      // Link ingredient to recipe
      await ctx.db.insert("recipeIngredients", {
        recipeId,
        ingredientId,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes,
      });
    }

    return recipeId;
  },
});

// Generate image upload URL
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
