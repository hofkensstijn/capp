import { action } from "./_generated/server";
import { v } from "convex/values";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedExpirationDays: number;
  category: string;
  price?: number;
}

// Extract pantry items from receipt image
export const extractItemsFromReceipt = action({
  args: {
    base64Image: v.string(),
    mediaType: v.string(),
  },
  handler: async (ctx, args) => {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    try {
      const { base64Image, mediaType } = args;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
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
                  text: `Analyze this grocery receipt image and extract all food/grocery items.

For each item, provide:
- name: the ingredient/item name (standardized, e.g., "Milk" not "MLKWHL2%")
- quantity: numeric quantity (default to 1 if not clear)
- unit: measurement unit (pieces, kg, grams, liters, ml, etc.)
- estimatedExpirationDays: estimate shelf life in days based on item type
- category: one of: vegetables, fruits, proteins, dairy, grains, spices, condiments, frozen, other
- price: price if visible (optional)

Guidelines for expiration estimates:
- Fresh produce: 5-10 days
- Dairy: 7-14 days
- Fresh meat/fish: 3-5 days
- Frozen items: 90 days
- Canned goods: 365 days
- Dry goods (pasta, rice): 365 days
- Bread: 5-7 days
- Eggs: 21 days

Return ONLY a JSON object with this structure:
{
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "unit": "liters",
      "estimatedExpirationDays": 10,
      "category": "dairy",
      "price": 4.99
    }
  ]
}`,
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
      let content = data.content[0].text;

      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      const result = JSON.parse(content);
      return result.items as ExtractedItem[];
    } catch (error) {
      console.error("Error extracting items from receipt:", error);
      throw new Error(
        `Failed to extract items: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

// Parse text list into structured items
export const parseTextList = action({
  args: {
    text: v.string(),
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
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Parse this shopping list into individual items with quantities and units:

"${args.text}"

For each item, provide:
- name: the ingredient/item name (standardized)
- quantity: numeric quantity (default to 1 if not specified)
- unit: measurement unit (pieces, kg, grams, liters, ml, etc.)
- estimatedExpirationDays: estimate shelf life based on item type
- category: one of: vegetables, fruits, proteins, dairy, grains, spices, condiments, frozen, other

Guidelines for expiration estimates:
- Fresh produce: 5-10 days
- Dairy: 7-14 days
- Fresh meat/fish: 3-5 days
- Frozen items: 90 days
- Canned goods: 365 days
- Dry goods (pasta, rice): 365 days
- Bread: 5-7 days
- Eggs: 21 days

Examples:
"2kg flour" → {name: "Flour", quantity: 2, unit: "kg", estimatedExpirationDays: 365, category: "grains"}
"milk" → {name: "Milk", quantity: 1, unit: "liters", estimatedExpirationDays: 10, category: "dairy"}
"dozen eggs" → {name: "Eggs", quantity: 12, unit: "pieces", estimatedExpirationDays: 21, category: "proteins"}

Return ONLY a JSON object with this structure:
{
  "items": [
    {
      "name": "Milk",
      "quantity": 1,
      "unit": "liters",
      "estimatedExpirationDays": 10,
      "category": "dairy"
    }
  ]
}`,
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
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      const result = JSON.parse(content);
      return result.items as ExtractedItem[];
    } catch (error) {
      console.error("Error parsing text list:", error);
      throw new Error(
        `Failed to parse items: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});
