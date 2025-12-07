import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Migration: Convert userId to householdId for all tables
// Run this once after deploying the new schema
export const migrateToHouseholds = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      usersProcessed: 0,
      pantryItemsMigrated: 0,
      shoppingListsMigrated: 0,
      recipesSkipped: 0,
    };

    // Step 1: Ensure all users have households
    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      if (!user.householdId) {
        // Generate unique invite code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let inviteCode = "";
        for (let i = 0; i < 8; i++) {
          inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check for uniqueness
        let existing = await ctx.db
          .query("households")
          .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
          .first();

        while (existing) {
          inviteCode = "";
          for (let i = 0; i < 8; i++) {
            inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          existing = await ctx.db
            .query("households")
            .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
            .first();
        }

        // Create household for this user
        const householdName = user.name ? `${user.name}'s Household` : "My Household";
        const householdId = await ctx.db.insert("households", {
          name: householdName,
          inviteCode,
          createdBy: user._id,
          createdAt: Date.now(),
        });

        // Update user with household
        await ctx.db.patch(user._id, { householdId });
        results.usersProcessed++;
      }
    }

    // Refresh users to get updated householdIds
    const updatedUsers = await ctx.db.query("users").collect();
    const userHouseholdMap = new Map(
      updatedUsers.map((u) => [u._id, u.householdId])
    );

    // Step 2: Migrate pantry items
    const pantryItems = await ctx.db.query("pantryItems").collect();

    for (const item of pantryItems) {
      if (!item.householdId && (item as any).userId) {
        const householdId = userHouseholdMap.get((item as any).userId);
        if (householdId) {
          await ctx.db.patch(item._id, {
            householdId,
            addedBy: (item as any).userId,
          });
          results.pantryItemsMigrated++;
        }
      }
    }

    // Step 3: Migrate shopping lists
    const shoppingLists = await ctx.db.query("shoppingLists").collect();

    for (const list of shoppingLists) {
      if (!list.householdId && (list as any).userId) {
        const householdId = userHouseholdMap.get((list as any).userId);
        if (householdId) {
          await ctx.db.patch(list._id, {
            householdId,
          });
          results.shoppingListsMigrated++;
        }
      }
    }

    // Note: Recipes with userId are skipped - they may be public recipes
    // or need special handling

    return results;
  },
});

// Clean up migration: Remove legacy userId fields after migration is verified
export const cleanupLegacyFields = mutation({
  args: {},
  handler: async (ctx) => {
    let cleaned = 0;

    // Clean pantry items
    const pantryItems = await ctx.db.query("pantryItems").collect();
    for (const item of pantryItems) {
      if ((item as any).userId && item.householdId) {
        // TypeScript won't let us set userId to undefined directly since it's optional
        // We need to use db.replace to fully remove the field
        const { userId, ...rest } = item as any;
        await ctx.db.replace(item._id, rest);
        cleaned++;
      }
    }

    // Clean shopping lists
    const shoppingLists = await ctx.db.query("shoppingLists").collect();
    for (const list of shoppingLists) {
      if ((list as any).userId && list.householdId) {
        const { userId, ...rest } = list as any;
        await ctx.db.replace(list._id, rest);
        cleaned++;
      }
    }

    return { cleaned };
  },
});
