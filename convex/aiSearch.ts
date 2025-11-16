import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// AI-powered recipe search based on pantry items
export const searchRecipesWithAI = action({
  args: {
    userId: v.id("users"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Get user's pantry items
    const pantryItems = await ctx.runQuery(api.pantry.list, {
      userId: args.userId,
    });

    // Extract ingredient names
    const availableIngredients = pantryItems
      .map((item) => item.ingredient?.name)
      .filter(Boolean);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: `I'm looking for recipe ideas. Here's what I'm interested in: "${args.searchQuery}"

Here are the ingredients I currently have in my pantry:
${availableIngredients.join(", ")}

Please suggest 5 recipes that:
1. Match my search query "${args.searchQuery}"
2. Prioritize recipes I can make with my available ingredients
3. If I don't have all ingredients, show me what I'm missing

Return a JSON array with this structure:
[
  {
    "title": "Recipe name",
    "description": "Brief description",
    "prepTime": number (minutes),
    "cookTime": number (minutes),
    "servings": number,
    "difficulty": "easy" | "medium" | "hard",
    "cuisine": "cuisine type",
    "canMakeWithPantry": boolean,
    "matchPercentage": number (0-100, percentage of ingredients you have),
    "missingIngredients": ["ingredient1", "ingredient2"],
    "ingredients": [
      {
        "name": "ingredient name",
        "quantity": number,
        "unit": "unit",
        "notes": "optional notes"
      }
    ],
    "instructions": ["step 1", "step 2", ...]
  }
]

Only return the JSON array, no additional text.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      let content = data.content[0].text;

      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse the JSON response
      const suggestions = JSON.parse(content);

      return suggestions;
    } catch (error) {
      console.error("Error searching recipes with AI:", error);
      throw new Error(
        `Failed to search recipes: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});
