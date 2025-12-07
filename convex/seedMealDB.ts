import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Seed recipes from TheMealDB (free API)
export const importFromMealDB = action({
  args: {},
  handler: async (ctx) => {
    const categories = ["Chicken", "Beef", "Seafood", "Vegetarian", "Pasta", "Dessert"];
    let imported = 0;

    for (const category of categories) {
      try {
        // Get recipes by category
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
        );
        const data = await response.json();

        if (!data.meals) continue;

        // Import first 5 recipes per category
        const meals = data.meals.slice(0, 5);

        for (const meal of meals) {
          // Get full recipe details
          const detailsResponse = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
          );
          const details = await detailsResponse.json();

          if (!details.meals || details.meals.length === 0) continue;

          const recipe = details.meals[0];

          // Parse ingredients
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];

            if (ingredient && ingredient.trim()) {
              ingredients.push({
                name: ingredient.trim(),
                quantity: measure?.trim() || "to taste",
              });
            }
          }

          // Parse instructions
          const instructions = recipe.strInstructions
            ? recipe.strInstructions
                .split("\r\n")
                .filter((step: string) => step.trim())
            : [];

          // Create recipe
          const recipeId = await ctx.runMutation(api.recipes.create, {
            householdId: undefined, // Public recipe
            title: recipe.strMeal,
            description: `${recipe.strCategory} - ${recipe.strArea || "International"}`,
            instructions,
            prepTime: undefined,
            cookTime: undefined,
            servings: undefined,
            difficulty: "medium",
            cuisine: recipe.strArea || undefined,
            imageUrl: recipe.strMealThumb,
            isPublic: true,
          });

          // Add ingredients
          for (const ing of ingredients) {
            // First, create or find ingredient
            let ingredientId;

            // Try to find existing ingredient
            const existingIngredients = await ctx.runQuery(api.ingredients.search, {
              searchTerm: ing.name,
            });

            if (existingIngredients && existingIngredients.length > 0) {
              // Use existing
              ingredientId = existingIngredients[0]._id;
            } else {
              // Create new ingredient
              ingredientId = await ctx.runMutation(api.ingredients.add, {
                name: ing.name,
                category: guessCategory(ing.name),
                commonUnit: guessUnit(ing.quantity),
              });
            }

            // Parse quantity
            const { quantity, unit } = parseQuantity(ing.quantity);

            // Add to recipe
            await ctx.runMutation(api.recipes.addIngredient, {
              recipeId,
              ingredientId,
              quantity,
              unit,
              notes: undefined,
            });
          }

          imported++;
          console.log(`Imported: ${recipe.strMeal}`);
        }
      } catch (error) {
        console.error(`Error importing category ${category}:`, error);
      }
    }

    return {
      message: `Successfully imported ${imported} recipes from TheMealDB`,
      count: imported,
    };
  },
});

// Helper: Guess ingredient category
function guessCategory(name: string): string {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("chicken") ||
    lowerName.includes("beef") ||
    lowerName.includes("pork") ||
    lowerName.includes("fish") ||
    lowerName.includes("salmon") ||
    lowerName.includes("shrimp") ||
    lowerName.includes("egg")
  ) {
    return "proteins";
  }

  if (
    lowerName.includes("onion") ||
    lowerName.includes("tomato") ||
    lowerName.includes("garlic") ||
    lowerName.includes("pepper") ||
    lowerName.includes("carrot") ||
    lowerName.includes("celery") ||
    lowerName.includes("lettuce") ||
    lowerName.includes("spinach")
  ) {
    return "vegetables";
  }

  if (
    lowerName.includes("rice") ||
    lowerName.includes("pasta") ||
    lowerName.includes("flour") ||
    lowerName.includes("bread")
  ) {
    return "grains";
  }

  if (
    lowerName.includes("milk") ||
    lowerName.includes("cheese") ||
    lowerName.includes("butter") ||
    lowerName.includes("cream") ||
    lowerName.includes("yogurt")
  ) {
    return "dairy";
  }

  if (
    lowerName.includes("salt") ||
    lowerName.includes("pepper") ||
    lowerName.includes("cumin") ||
    lowerName.includes("paprika")
  ) {
    return "spices";
  }

  return "other";
}

// Helper: Guess unit
function guessUnit(quantity: string): string {
  const lower = quantity.toLowerCase();

  if (lower.includes("cup")) return "cups";
  if (lower.includes("tbsp") || lower.includes("tablespoon")) return "tbsp";
  if (lower.includes("tsp") || lower.includes("teaspoon")) return "tsp";
  if (lower.includes("oz")) return "oz";
  if (lower.includes("lb")) return "lbs";
  if (lower.includes("g")) return "grams";
  if (lower.includes("ml")) return "ml";

  return "pieces";
}

// Helper: Parse quantity string
function parseQuantity(quantityStr: string): { quantity: number; unit: string } {
  // Try to extract number
  const match = quantityStr.match(/([\d.\/]+)\s*(\w+)?/);

  if (match) {
    let quantity = 1;

    // Handle fractions (e.g., "1/2")
    if (match[1].includes("/")) {
      const [num, den] = match[1].split("/").map(Number);
      quantity = num / den;
    } else {
      quantity = parseFloat(match[1]) || 1;
    }

    const unit = match[2] || guessUnit(quantityStr);

    return { quantity, unit };
  }

  return { quantity: 1, unit: guessUnit(quantityStr) };
}
