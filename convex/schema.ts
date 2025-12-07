import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Households - groups of users sharing pantry, shopping list, recipes
  households: defineTable({
    name: v.string(),
    inviteCode: v.string(), // Unique 8-char code for joining
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_invite_code", ["inviteCode"]),

  // User profiles and preferences
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    householdId: v.optional(v.id("households")), // Which household the user belongs to
    preferences: v.optional(
      v.object({
        autoAddItems: v.boolean(), // true = skip preview and auto-add, false = show preview
      })
    ),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_household", ["householdId"]),

  // Master ingredient catalog
  ingredients: defineTable({
    name: v.string(),
    category: v.string(), // e.g., "vegetables", "proteins", "dairy", "grains"
    commonUnit: v.string(), // e.g., "grams", "pieces", "ml"
    createdAt: v.number(),
  }).index("by_category", ["category"]),

  // Household's pantry inventory (changed from userId to householdId)
  pantryItems: defineTable({
    householdId: v.optional(v.id("households")), // Optional during migration
    userId: v.optional(v.id("users")), // Legacy field, will be removed after migration
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    expirationDate: v.optional(v.number()),
    location: v.optional(v.string()), // e.g., "fridge", "pantry", "freezer"
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("users")), // Track who added it
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_ingredient", ["ingredientId"])
    .index("by_household_and_ingredient", ["householdId", "ingredientId"]),

  // Recipes (changed from userId to householdId)
  recipes: defineTable({
    householdId: v.optional(v.id("households")), // null for public/system recipes
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
    addedBy: v.optional(v.id("users")), // Track who added it
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household", ["householdId"])
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

  // Shopping lists (changed from userId to householdId)
  shoppingLists: defineTable({
    householdId: v.optional(v.id("households")), // Optional during migration
    userId: v.optional(v.id("users")), // Legacy field, will be removed after migration
    name: v.string(),
    isActive: v.boolean(), // Only one active list at a time
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_household_and_active", ["householdId", "isActive"]),

  // Shopping list items
  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    unit: v.string(),
    isPurchased: v.boolean(),
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("users")), // Track who added it
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_list", ["shoppingListId"])
    .index("by_list_and_purchased", ["shoppingListId", "isPurchased"]),
});
