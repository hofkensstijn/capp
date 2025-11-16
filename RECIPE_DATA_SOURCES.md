# Recipe Data Sources

## Free APIs

### 1. **TheMealDB** (Free, No API Key Required)
- **URL**: https://www.themealdb.com/api.php
- **Features**:
  - 300+ recipes with ingredients, instructions, images
  - Categories, cuisines, areas
  - Search by name, ingredient, category
- **Example**:
  ```bash
  # Get random recipe
  curl https://www.themealdb.com/api/json/v1/1/random.php

  # Search by ingredient
  curl https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken

  # Get recipe details
  curl https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772
  ```
- **Best For**: Quick start with free data

### 2. **Spoonacular** (Free Tier: 150 requests/day)
- **URL**: https://spoonacular.com/food-api
- **Features**:
  - 5000+ recipes
  - Detailed nutrition info
  - Ingredient substitutions
  - Recipe search by ingredients
- **Cost**: Free tier available, then paid plans
- **Example**:
  ```bash
  curl "https://api.spoonacular.com/recipes/complexSearch?apiKey=YOUR_KEY&query=pasta"
  ```

### 3. **Edamam Recipe API** (Free Tier: 10 requests/min)
- **URL**: https://developer.edamam.com/edamam-recipe-api
- **Features**:
  - 2.3M+ recipes
  - Nutrition data
  - Diet labels
  - Health restrictions
- **Cost**: Free tier available

### 4. **RecipeDB** (Free)
- **URL**: https://cosylab.iiitd.edu.in/recipedb/
- **Features**:
  - Open dataset of Indian recipes
  - Academic/research focused
- **Best For**: Indian cuisine

---

## Web Scraping Sources

### Recipe Sites with Structured Data (JSON-LD)
Most major recipe sites use JSON-LD format that's easy to parse:

1. **AllRecipes.com**
2. **Food Network**
3. **Bon Appétit**
4. **Serious Eats**
5. **NYT Cooking** (requires subscription)

**Example JSON-LD** (found in `<script type="application/ld+json">`):
```json
{
  "@type": "Recipe",
  "name": "Chicken Parmesan",
  "description": "Classic Italian-American dish",
  "recipeIngredient": [
    "2 chicken breasts",
    "1 cup marinara sauce",
    "1 cup mozzarella cheese"
  ],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Preheat oven to 400°F"},
    {"@type": "HowToStep", "text": "Season chicken..."}
  ],
  "prepTime": "PT15M",
  "cookTime": "PT25M",
  "recipeYield": "4 servings"
}
```

---

## Option 3: Public Datasets

### 1. **Recipe1M+** Dataset
- **URL**: http://pic2recipe.csail.mit.edu/
- **Size**: 1M+ recipes with images
- **Format**: JSON
- **Use Case**: Academic/research, requires download

### 2. **Kaggle Recipe Datasets**
- Search "recipes" on https://kaggle.com/datasets
- Popular ones:
  - "Food.com Recipes and Reviews" (500k+ recipes)
  - "Epicurious Recipes" (20k recipes)
  - "Recipe Ingredients Dataset" (40k recipes)

---

## Implementation Recommendations

### For Your App, I Recommend:

#### **Phase 1: Quick Start - TheMealDB**
- Free, no API key
- ~300 recipes with images
- Easy to implement
- Good for MVP

#### **Phase 2: Rich Data - Spoonacular**
- Sign up for free tier
- Much larger recipe database
- Better search and filtering
- Nutrition data included

#### **Phase 3: User-Generated**
- Let users upload their own recipes (✅ already implemented!)
- Users scrape from URLs
- AI extraction from photos (✅ already implemented!)

---

## Quick Implementation Examples

### Example 1: Bulk Import from TheMealDB

```typescript
// convex/seedRecipesFromAPI.ts
import { action } from "./_generated/server";

export const seedFromMealDB = action({
  args: {},
  handler: async (ctx) => {
    const categories = ["Chicken", "Beef", "Seafood", "Vegetarian", "Pasta"];

    for (const category of categories) {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
      );
      const data = await response.json();

      // Get first 10 recipes per category
      const recipes = data.meals?.slice(0, 10) || [];

      for (const meal of recipes) {
        // Fetch full recipe details
        const detailsResponse = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        );
        const details = await detailsResponse.json();
        const recipe = details.meals[0];

        // Save to database (would call mutation here)
        console.log(`Imported: ${recipe.strMeal}`);
      }
    }

    return { message: "Import complete" };
  },
});
```

### Example 2: Search by Ingredients (Spoonacular)

```typescript
export const findRecipesByIngredients = action({
  args: { ingredients: v.array(v.string()) },
  handler: async (ctx, args) => {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    const ingredientString = args.ingredients.join(",");

    const response = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${ingredientString}&number=10`
    );

    const recipes = await response.json();
    return recipes;
  },
});
```

---

## Legal Considerations

⚠️ **Important**:
- Check Terms of Service before scraping
- Respect rate limits
- Give attribution where required
- TheMealDB requires attribution link
- Some sites prohibit automated scraping

**Safest Approaches**:
1. Use official APIs (TheMealDB, Spoonacular, Edamam)
2. Use open datasets (Kaggle, Recipe1M+)
3. Let users import their own recipes
4. User-generated content only
