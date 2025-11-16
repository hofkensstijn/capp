import { action } from "./_generated/server";
import { v } from "convex/values";

// Scrape recipe from a URL (server-side)
export const scrapeRecipeFromUrl = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.url);
      const html = await response.text();

      // Parse recipe using Open Graph tags and JSON-LD
      const recipeData = extractRecipeData(html);

      return recipeData;
    } catch (error) {
      console.error("Failed to scrape recipe:", error);
      throw new Error("Failed to scrape recipe from URL");
    }
  },
});

// Helper function to extract recipe data from HTML
function extractRecipeData(html: string) {
  // Look for JSON-LD structured data (most recipe sites use this)
  const jsonLdRegex = new RegExp(
    '<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>',
    'i'
  );
  const jsonLdMatch = html.match(jsonLdRegex);

  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);

      // Find Recipe object (might be in an array)
      const recipe = Array.isArray(jsonLd)
        ? jsonLd.find((item) => item["@type"] === "Recipe")
        : jsonLd["@type"] === "Recipe"
        ? jsonLd
        : null;

      if (recipe) {
        return {
          title: recipe.name || "",
          description: recipe.description || "",
          instructions: extractInstructions(recipe),
          ingredients: extractIngredients(recipe),
          prepTime: parseTime(recipe.prepTime),
          cookTime: parseTime(recipe.cookTime),
          servings: recipe.recipeYield
            ? parseInt(String(recipe.recipeYield))
            : undefined,
          cuisine: recipe.recipeCuisine || undefined,
          imageUrl: recipe.image?.url || recipe.image || undefined,
        };
      }
    } catch (e) {
      console.error("Failed to parse JSON-LD:", e);
    }
  }

  // Fallback: try Open Graph tags
  return extractFromOpenGraph(html);
}

function extractInstructions(recipe: any): string[] {
  if (Array.isArray(recipe.recipeInstructions)) {
    return recipe.recipeInstructions.map((step: any) => {
      if (typeof step === "string") return step;
      if (step.text) return step.text;
      return "";
    });
  }
  if (typeof recipe.recipeInstructions === "string") {
    return recipe.recipeInstructions.split("\n").filter(Boolean);
  }
  return [];
}

function extractIngredients(recipe: any): Array<{ name: string; quantity: string }> {
  if (Array.isArray(recipe.recipeIngredient)) {
    return recipe.recipeIngredient.map((ing: string) => {
      // Try to parse ingredient string (e.g., "2 cups flour")
      const match = ing.match(/^([\d\/\s]+)?\s*(.+)/);
      return {
        quantity: match?.[1]?.trim() || "1",
        name: match?.[2]?.trim() || ing,
      };
    });
  }
  return [];
}

function parseTime(timeString?: string): number | undefined {
  if (!timeString) return undefined;

  // Parse ISO 8601 duration (e.g., "PT30M" = 30 minutes)
  const match = timeString.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return undefined;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  return hours * 60 + minutes;
}

function extractFromOpenGraph(html: string) {
  const getMetaContent = (property: string) => {
    const regex = new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i"
    );
    const match = html.match(regex);
    return match ? match[1] : "";
  };

  return {
    title: getMetaContent("og:title"),
    description: getMetaContent("og:description"),
    imageUrl: getMetaContent("og:image"),
    instructions: [],
    ingredients: [],
  };
}
