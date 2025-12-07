import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get or create the active shopping list for a household
export const getActiveList = query({
  args: { householdId: v.id("households") },
  handler: async (ctx, { householdId }) => {
    // Find or understand there's no active list
    const activeList = await ctx.db
      .query("shoppingLists")
      .withIndex("by_household_and_active", (q) =>
        q.eq("householdId", householdId).eq("isActive", true)
      )
      .first();

    if (!activeList) {
      return null;
    }

    // Get all items for this list
    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_list", (q) => q.eq("shoppingListId", activeList._id))
      .collect();

    // Enrich with ingredient data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const ingredient = await ctx.db.get(item.ingredientId);
        return {
          ...item,
          ingredient,
        };
      })
    );

    return {
      ...activeList,
      items: enrichedItems,
    };
  },
});

// Create a new shopping list (deactivates any existing active list)
export const createList = mutation({
  args: {
    householdId: v.id("households"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { householdId, name }) => {
    // Deactivate any existing active list
    const existingActive = await ctx.db
      .query("shoppingLists")
      .withIndex("by_household_and_active", (q) =>
        q.eq("householdId", householdId).eq("isActive", true)
      )
      .first();

    if (existingActive) {
      await ctx.db.patch(existingActive._id, { isActive: false });
    }

    const now = Date.now();
    const listName = name || `Shopping List ${new Date().toLocaleDateString()}`;

    const listId = await ctx.db.insert("shoppingLists", {
      householdId,
      name: listName,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return listId;
  },
});

// Add item to shopping list
export const addItem = mutation({
  args: {
    householdId: v.id("households"),
    addedBy: v.optional(v.id("users")),
    ingredientName: v.string(),
    category: v.optional(v.string()),
    quantity: v.number(),
    unit: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { householdId, addedBy, ingredientName, category, quantity, unit, notes }) => {
    // Get or create active list
    let activeList = await ctx.db
      .query("shoppingLists")
      .withIndex("by_household_and_active", (q) =>
        q.eq("householdId", householdId).eq("isActive", true)
      )
      .first();

    if (!activeList) {
      const now = Date.now();
      const listId = await ctx.db.insert("shoppingLists", {
        householdId,
        name: `Shopping List ${new Date().toLocaleDateString()}`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      activeList = await ctx.db.get(listId);
    }

    if (!activeList) {
      throw new Error("Failed to create shopping list");
    }

    // Find or create ingredient
    const normalizedName = ingredientName.toLowerCase().trim();
    let ingredient = await ctx.db
      .query("ingredients")
      .filter((q) => q.eq(q.field("name"), normalizedName))
      .first();

    if (!ingredient) {
      const ingredientId = await ctx.db.insert("ingredients", {
        name: normalizedName,
        category: category || "other",
        commonUnit: unit,
        createdAt: Date.now(),
      });
      ingredient = await ctx.db.get(ingredientId);
    }

    if (!ingredient) {
      throw new Error("Failed to create ingredient");
    }

    // Check if item already exists in list
    const existingItem = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_list", (q) => q.eq("shoppingListId", activeList._id))
      .filter((q) => q.eq(q.field("ingredientId"), ingredient._id))
      .first();

    const now = Date.now();

    if (existingItem) {
      // Update quantity
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + quantity,
        updatedAt: now,
      });
      return existingItem._id;
    }

    // Create new item
    const itemId = await ctx.db.insert("shoppingListItems", {
      shoppingListId: activeList._id,
      ingredientId: ingredient._id,
      quantity,
      unit,
      isPurchased: false,
      notes,
      addedBy,
      createdAt: now,
      updatedAt: now,
    });

    return itemId;
  },
});

// Toggle item purchased status (and optionally add to pantry)
export const togglePurchased = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
    householdId: v.id("households"),
    userId: v.optional(v.id("users")),
    addToPantry: v.optional(v.boolean()),
  },
  handler: async (ctx, { itemId, householdId, userId, addToPantry = true }) => {
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    const newPurchasedStatus = !item.isPurchased;

    // Update the item
    await ctx.db.patch(itemId, {
      isPurchased: newPurchasedStatus,
      updatedAt: Date.now(),
    });

    // If marking as purchased and addToPantry is true, add to pantry
    if (newPurchasedStatus && addToPantry) {
      const now = Date.now();

      // Check if already in pantry
      const existingPantryItem = await ctx.db
        .query("pantryItems")
        .withIndex("by_household_and_ingredient", (q) =>
          q.eq("householdId", householdId).eq("ingredientId", item.ingredientId)
        )
        .first();

      if (existingPantryItem) {
        // Update quantity
        await ctx.db.patch(existingPantryItem._id, {
          quantity: existingPantryItem.quantity + item.quantity,
          updatedAt: now,
        });
      } else {
        // Get ingredient for category-based location
        const ingredient = await ctx.db.get(item.ingredientId);
        const location = getStorageLocation(ingredient?.category || "other");

        await ctx.db.insert("pantryItems", {
          householdId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
          location,
          addedBy: userId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return newPurchasedStatus;
  },
});

// Remove item from shopping list
export const removeItem = mutation({
  args: { itemId: v.id("shoppingListItems") },
  handler: async (ctx, { itemId }) => {
    await ctx.db.delete(itemId);
  },
});

// Update item quantity
export const updateItem = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { itemId, quantity, unit, notes }) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (quantity !== undefined) updates.quantity = quantity;
    if (unit !== undefined) updates.unit = unit;
    if (notes !== undefined) updates.notes = notes;

    await ctx.db.patch(itemId, updates);
  },
});

// Clear all purchased items
export const clearPurchased = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, { listId }) => {
    const purchasedItems = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_list_and_purchased", (q) =>
        q.eq("shoppingListId", listId).eq("isPurchased", true)
      )
      .collect();

    for (const item of purchasedItems) {
      await ctx.db.delete(item._id);
    }

    return purchasedItems.length;
  },
});

// Clear entire list
export const clearList = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, { listId }) => {
    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_list", (q) => q.eq("shoppingListId", listId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return items.length;
  },
});

// Helper function to determine storage location based on category
function getStorageLocation(category: string): string {
  const categoryLower = category.toLowerCase();

  if (["dairy", "meat", "proteins", "fish", "seafood"].includes(categoryLower)) {
    return "fridge";
  }
  if (["frozen", "ice cream"].includes(categoryLower)) {
    return "freezer";
  }
  if (["vegetables", "fruits"].includes(categoryLower)) {
    return "fridge";
  }
  return "pantry";
}
