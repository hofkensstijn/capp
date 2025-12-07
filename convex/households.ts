import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a random 8-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing characters like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get current user's household
export const getMyHousehold = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      return null;
    }

    const household = await ctx.db.get(user.householdId);
    if (!household) {
      return null;
    }

    // Get all members
    const members = await ctx.db
      .query("users")
      .withIndex("by_household", (q) => q.eq("householdId", household._id))
      .collect();

    return {
      ...household,
      members: members.map((m) => ({
        _id: m._id,
        name: m.name,
        email: m.email,
        isCreator: m._id === household.createdBy,
      })),
    };
  },
});

// Create a new household
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, { userId, name }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has a household
    if (user.householdId) {
      throw new Error("You are already in a household. Leave it first to create a new one.");
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("households")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    // Keep generating until we find a unique code
    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("households")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    // Create household
    const householdId = await ctx.db.insert("households", {
      name,
      inviteCode,
      createdBy: userId,
      createdAt: Date.now(),
    });

    // Update user to belong to this household
    await ctx.db.patch(userId, { householdId });

    return { householdId, inviteCode };
  },
});

// Join a household using invite code
export const join = mutation({
  args: {
    userId: v.id("users"),
    inviteCode: v.string(),
  },
  handler: async (ctx, { userId, inviteCode }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has a household
    if (user.householdId) {
      throw new Error("You are already in a household. Leave it first to join another.");
    }

    // Find household by invite code
    const normalizedCode = inviteCode.toUpperCase().trim();
    const household = await ctx.db
      .query("households")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", normalizedCode))
      .first();

    if (!household) {
      throw new Error("Invalid invite code. Please check and try again.");
    }

    // Update user to belong to this household
    await ctx.db.patch(userId, { householdId: household._id });

    return { householdId: household._id, householdName: household.name };
  },
});

// Leave household
export const leave = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.householdId) {
      throw new Error("You are not in a household");
    }

    const household = await ctx.db.get(user.householdId);
    if (!household) {
      throw new Error("Household not found");
    }

    // Count remaining members
    const members = await ctx.db
      .query("users")
      .withIndex("by_household", (q) => q.eq("householdId", household._id))
      .collect();

    // Remove user from household
    await ctx.db.patch(userId, { householdId: undefined });

    // If this was the last member, delete the household
    if (members.length <= 1) {
      await ctx.db.delete(household._id);
      return { householdDeleted: true };
    }

    // If user was creator and there are other members, transfer ownership
    if (household.createdBy === userId) {
      const newOwner = members.find((m) => m._id !== userId);
      if (newOwner) {
        await ctx.db.patch(household._id, { createdBy: newOwner._id });
      }
    }

    return { householdDeleted: false };
  },
});

// Regenerate invite code
export const regenerateInviteCode = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      throw new Error("You are not in a household");
    }

    const household = await ctx.db.get(user.householdId);
    if (!household) {
      throw new Error("Household not found");
    }

    // Generate new unique invite code
    let inviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("households")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("households")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    await ctx.db.patch(household._id, { inviteCode });

    return { inviteCode };
  },
});

// Update household name
export const updateName = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, { userId, name }) => {
    const user = await ctx.db.get(userId);
    if (!user?.householdId) {
      throw new Error("You are not in a household");
    }

    await ctx.db.patch(user.householdId, { name });
  },
});

// Ensure user has a household (auto-create if needed)
export const ensureHousehold = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Already has a household
    if (user.householdId) {
      return { householdId: user.householdId, created: false };
    }

    // Create a default household for the user
    let inviteCode = generateInviteCode();
    let existing = await ctx.db
      .query("households")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("households")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    const householdName = user.name ? `${user.name}'s Household` : "My Household";

    const householdId = await ctx.db.insert("households", {
      name: householdName,
      inviteCode,
      createdBy: userId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(userId, { householdId });

    return { householdId, created: true };
  },
});
