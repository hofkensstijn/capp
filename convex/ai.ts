import { action } from "./_generated/server";
import { v } from "convex/values";

// Extract recipe from image using Claude API
export const extractRecipeFromImage = action({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    try {
      // Fetch the image and convert to base64
      const imageResponse = await fetch(args.imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");

      // Determine media type from URL or default to jpeg
      const mediaType = args.imageUrl.toLowerCase().includes(".png")
        ? "image/png"
        : "image/jpeg";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Image,
                  },
                },
                {
                  type: "text",
                  text: `Extract the recipe from this image. Return a JSON object with the following structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "servings": number,
  "difficulty": "easy" | "medium" | "hard",
  "cuisine": "cuisine type",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": number,
      "unit": "unit of measurement",
      "notes": "optional notes like 'diced', 'chopped'"
    }
  ],
  "instructions": ["step 1", "step 2", ...]
}

Only return the JSON object, no additional text.`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse the JSON response
      const recipe = JSON.parse(content);

      return recipe;
    } catch (error) {
      console.error("Error extracting recipe:", error);
      throw new Error(
        `Failed to extract recipe: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

// Get recipe suggestions based on available ingredients
export const getSuggestedRecipes = action({
  args: {
    availableIngredients: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Based on these available ingredients: ${args.availableIngredients.join(
                ", "
              )}, suggest 5 recipes I can make. Return a JSON array of recipe objects with this structure:
[
  {
    "title": "Recipe name",
    "description": "Brief description",
    "prepTime": number (in minutes),
    "cookTime": number (in minutes),
    "servings": number,
    "difficulty": "easy" | "medium" | "hard",
    "cuisine": "cuisine type",
    "matchPercentage": number (percentage of ingredients I have),
    "missingIngredients": ["ingredient1", "ingredient2"]
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
      const content = data.content[0].text;

      // Parse the JSON response
      const suggestions = JSON.parse(content);

      return suggestions;
    } catch (error) {
      console.error("Error getting suggestions:", error);
      throw new Error(
        `Failed to get recipe suggestions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});
