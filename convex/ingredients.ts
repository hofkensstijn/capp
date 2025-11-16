import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all ingredients
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ingredients").collect();
  },
});

// Search ingredients by name
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const allIngredients = await ctx.db.query("ingredients").collect();

    if (!args.searchTerm) {
      return allIngredients;
    }

    const searchLower = args.searchTerm.toLowerCase();
    return allIngredients.filter((ingredient) =>
      ingredient.name.toLowerCase().includes(searchLower)
    );
  },
});

// Get ingredients by category
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ingredients")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Add new ingredient
export const add = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    commonUnit: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ingredients", {
      name: args.name,
      category: args.category,
      commonUnit: args.commonUnit,
      createdAt: Date.now(),
    });
  },
});

// Seed initial ingredients (helper function)
export const seedIngredients = mutation({
  args: {},
  handler: async (ctx) => {
    const existingIngredients = await ctx.db.query("ingredients").first();
    if (existingIngredients) {
      return { message: "Ingredients already seeded" };
    }

    const ingredients = [
      // Vegetables
      { name: "Tomatoes", category: "vegetables", commonUnit: "pieces" },
      { name: "Onions", category: "vegetables", commonUnit: "pieces" },
      { name: "Garlic", category: "vegetables", commonUnit: "cloves" },
      { name: "Carrots", category: "vegetables", commonUnit: "pieces" },
      { name: "Potatoes", category: "vegetables", commonUnit: "pieces" },
      { name: "Bell Peppers", category: "vegetables", commonUnit: "pieces" },
      { name: "Spinach", category: "vegetables", commonUnit: "grams" },
      { name: "Lettuce", category: "vegetables", commonUnit: "pieces" },

      // Proteins
      { name: "Chicken Breast", category: "proteins", commonUnit: "grams" },
      { name: "Ground Beef", category: "proteins", commonUnit: "grams" },
      { name: "Salmon", category: "proteins", commonUnit: "grams" },
      { name: "Eggs", category: "proteins", commonUnit: "pieces" },
      { name: "Tofu", category: "proteins", commonUnit: "grams" },

      // Dairy
      { name: "Milk", category: "dairy", commonUnit: "ml" },
      { name: "Cheese", category: "dairy", commonUnit: "grams" },
      { name: "Butter", category: "dairy", commonUnit: "grams" },
      { name: "Yogurt", category: "dairy", commonUnit: "ml" },

      // Grains
      { name: "Rice", category: "grains", commonUnit: "grams" },
      { name: "Pasta", category: "grains", commonUnit: "grams" },
      { name: "Bread", category: "grains", commonUnit: "slices" },
      { name: "Flour", category: "grains", commonUnit: "grams" },

      // Condiments & Spices
      { name: "Salt", category: "spices", commonUnit: "grams" },
      { name: "Pepper", category: "spices", commonUnit: "grams" },
      { name: "Olive Oil", category: "condiments", commonUnit: "ml" },
      { name: "Soy Sauce", category: "condiments", commonUnit: "ml" },
    ];

    for (const ingredient of ingredients) {
      await ctx.db.insert("ingredients", {
        ...ingredient,
        createdAt: Date.now(),
      });
    }

    return { message: `Seeded ${ingredients.length} ingredients` };
  },
});
