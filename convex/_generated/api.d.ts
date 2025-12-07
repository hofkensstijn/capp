/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as aiPantry from "../aiPantry.js";
import type * as aiSearch from "../aiSearch.js";
import type * as households from "../households.js";
import type * as ingredients from "../ingredients.js";
import type * as migrations from "../migrations.js";
import type * as pantry from "../pantry.js";
import type * as recipeScraper from "../recipeScraper.js";
import type * as recipes from "../recipes.js";
import type * as seedMealDB from "../seedMealDB.js";
import type * as shoppingList from "../shoppingList.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  aiPantry: typeof aiPantry;
  aiSearch: typeof aiSearch;
  households: typeof households;
  ingredients: typeof ingredients;
  migrations: typeof migrations;
  pantry: typeof pantry;
  recipeScraper: typeof recipeScraper;
  recipes: typeof recipes;
  seedMealDB: typeof seedMealDB;
  shoppingList: typeof shoppingList;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
