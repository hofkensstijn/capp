import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles and preferences
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // Master ingredient catalog
  ingredients: defineTable({
    name: v.string(),
    category: v.string(), // e.g., "vegetables", "proteins", "dairy", "grains"
    commonUnit: v.string(), // e.g., "grams", "pieces", "ml"
    createdAt: v.number(),
  }).index("by_category", ["category"]),

  // User's pantry inventory
  pantryItems: defineTable({
    userId: v.id("users"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    expirationDate: v.optional(v.number()),
    location: v.optional(v.string()), // e.g., "fridge", "pantry", "freezer"
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_ingredient", ["ingredientId"])
    .index("by_user_and_ingredient", ["userId", "ingredientId"]),

  // Recipes
  recipes: defineTable({
    userId: v.optional(v.id("users")), // null for public/system recipes
    title: v.string(),
    description: v.optional(v.string()),
    instructions: v.array(v.string()), // Step-by-step instructions
    prepTime: v.optional(v.number()), // in minutes
    cookTime: v.optional(v.number()), // in minutes
    servings: v.optional(v.number()),
    difficulty: v.optional(v.string()), // "easy", "medium", "hard"
    cuisine: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  // Recipe ingredients (junction table)
  recipeIngredients: defineTable({
    recipeId: v.id("recipes"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    notes: v.optional(v.string()), // e.g., "diced", "chopped", "optional"
  })
    .index("by_recipe", ["recipeId"])
    .index("by_ingredient", ["ingredientId"]),

  // Shopping lists
  shoppingLists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    isActive: v.boolean(), // Only one active list at a time
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_active", ["userId", "isActive"]),

  // Shopping list items
  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    isPurchased: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_list", ["shoppingListId"])
    .index("by_list_and_purchased", ["shoppingListId", "isPurchased"]),
});
