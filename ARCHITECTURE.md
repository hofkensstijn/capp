# Capp - Architecture Documentation

## Application Overview

**Capp** is a smart cooking assistant that helps users manage pantry inventory, discover recipes, and reduce food waste using AI. It's built with Next.js 16, Convex (serverless backend), Clerk (auth), and Claude Sonnet 4.5 for AI features.

### Core Value Proposition
- Manage pantry inventory with AI-powered input methods (receipt scanning, natural language parsing)
- Search and save recipes with intelligent pantry matching
- Track expiration dates to minimize food waste
- Generate shopping lists based on recipes

---

## Tech Stack

### Frontend
- **Next.js 16** - App Router with React 19.2.0
- **TypeScript 5** - Full type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library (Radix UI primitives)
- **Lucide React** - Icons
- **React Hook Form + Zod** - Form validation
- **Sonner** - Toast notifications

### Backend
- **Convex** - Serverless database + real-time queries + file storage + serverless functions
- **Convex Actions** - AI integration

### Authentication
- **Clerk** - User authentication
- **JWT** - Integration with Convex

### AI/ML
- **Anthropic Claude Sonnet 4.5** - Model ID: `claude-sonnet-4-5-20250929`
- **Vision API** - Image analysis (receipts, recipes)
- **Text Generation** - Recipe search and suggestions

### Analytics
- **PostHog** - With proxy setup to bypass ad blockers

### Deployment
- Configured for **Vercel** deployment

---

## Architecture Pattern

**Server-side React with Client Components + Serverless Backend**

### Key Architectural Decisions

1. **App Router (Next.js 15+):** Modern routing with server/client component separation
2. **Convex Backend:** Real-time reactive queries, no REST API needed
3. **Authentication Flow:** Clerk handles auth → syncs to Convex via custom hook
4. **AI Integration:** Convex Actions make direct API calls to Anthropic
5. **Type Safety:** Full TypeScript coverage from frontend to backend

### Data Flow

```
User Input → Next.js Client Component → Convex Query/Mutation/Action → Database/AI
                                                ↓
                                         Real-time Updates
                                                ↓
                                    React Component Re-renders
```

---

## Folder Structure

```
/Users/stijnhofkens/Documents/Projects/capp/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes (PostHog proxy)
│   │   └── ingest/              # PostHog analytics proxy to bypass ad blockers
│   ├── dashboard/               # Main dashboard page
│   ├── pantry/                  # Pantry management page
│   ├── recipes/                 # Recipe browsing and search
│   │   └── [id]/               # Dynamic recipe detail pages
│   ├── shopping-list/          # Shopping list page
│   ├── suggestions/            # AI recipe suggestions
│   ├── sign-in/ & sign-up/    # Auth pages (Clerk)
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global styles
│
├── components/                  # React components
│   ├── layout/                 # Navigation component
│   ├── pantry/                 # Pantry-related components
│   │   ├── AddPantryItemDialog.tsx
│   │   ├── QuickAddDialog.tsx  # Natural language input
│   │   ├── ReceiptScanDialog.tsx  # Receipt photo scanning
│   │   ├── ItemPreviewTable.tsx   # Preview before adding
│   │   └── PantryItemCard.tsx
│   ├── recipes/                # Recipe-related components
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeDetailView.tsx
│   │   ├── RecipeSearchBar.tsx
│   │   ├── SearchResultCard.tsx
│   │   └── UploadRecipeDialog.tsx
│   └── ui/                     # shadcn/ui components
│
├── convex/                     # Convex backend
│   ├── schema.ts              # Database schema definition
│   ├── users.ts               # User management
│   ├── pantry.ts              # Pantry CRUD operations
│   ├── recipes.ts             # Recipe management
│   ├── ingredients.ts         # Ingredient catalog
│   ├── ai.ts                  # Recipe extraction from images
│   ├── aiPantry.ts           # Pantry item extraction (receipt & text)
│   ├── aiSearch.ts           # AI-powered recipe search
│   └── _generated/           # Auto-generated Convex types
│
├── lib/                       # Utilities
│   ├── hooks/                # Custom React hooks
│   │   └── useStoreUser.ts  # User sync hook
│   └── utils.ts             # Utility functions (cn, etc.)
│
├── providers/                # React Context Providers
│   ├── ConvexClientProvider.tsx  # Convex + Clerk integration
│   └── PostHogProvider.tsx       # Analytics provider
│
├── hooks/                    # App-level hooks
│   └── use-toast.ts         # Toast notification hook
│
└── middleware.ts            # Clerk authentication middleware
```

---

## Database Schema

The Convex schema includes **7 main tables:**

### users
User profiles synced from Clerk

```typescript
{
  clerkId: string,
  email: string,
  name?: string,
  preferences?: {
    autoAddItems: boolean  // Skip preview and auto-add items
  },
  createdAt: number
}
```

**Indexes:** `by_clerk_id`

---

### ingredients
Master ingredient catalog

```typescript
{
  name: string,
  category: string,  // vegetables, proteins, dairy, grains, etc.
  commonUnit: string,
  createdAt: number
}
```

**Indexes:** `by_category`

---

### pantryItems
User's inventory

```typescript
{
  userId: Id<"users">,
  ingredientId: Id<"ingredients">,
  quantity: number,
  unit: string,
  expirationDate?: number,
  location?: string,  // fridge, pantry, freezer
  notes?: string,
  createdAt: number,
  updatedAt: number
}
```

**Indexes:** `by_user`, `by_ingredient`, `by_user_and_ingredient`

---

### recipes
Recipe collection

```typescript
{
  userId?: Id<"users">,  // null for public recipes
  title: string,
  description?: string,
  instructions: string[],
  prepTime?: number,
  cookTime?: number,
  servings?: number,
  difficulty?: string,
  cuisine?: string,
  imageUrl?: string,
  imageStorageId?: Id<"_storage">,
  isPublic: boolean,
  createdAt: number,
  updatedAt: number
}
```

**Indexes:** `by_user`, `by_public`

---

### recipeIngredients
Junction table linking recipes to ingredients

```typescript
{
  recipeId: Id<"recipes">,
  ingredientId: Id<"ingredients">,
  quantity: number,
  unit: string,
  notes?: string  // e.g., "diced", "chopped"
}
```

**Indexes:** `by_recipe`, `by_ingredient`

---

### shoppingLists
User shopping lists

```typescript
{
  userId: Id<"users">,
  name: string,
  isActive: boolean,
  createdAt: number,
  updatedAt: number
}
```

**Indexes:** `by_user`, `by_user_and_active`

---

### shoppingListItems
Items in shopping lists

```typescript
{
  shoppingListId: Id<"shoppingLists">,
  ingredientId: Id<"ingredients">,
  quantity: number,
  unit: string,
  isPurchased: boolean,
  notes?: string,
  createdAt: number,
  updatedAt: number
}
```

**Indexes:** `by_list`, `by_list_and_purchased`

---

## Key Features & Functionality

### A. Smart Pantry Management

- **Receipt Scanner:** Upload receipt photo → AI extracts items with quantities, units, categories, and expiration estimates
- **Quick Add:** Paste natural language text (e.g., "2kg flour, dozen eggs") → AI parses into structured items
- **Auto-add Toggle:** User preference to skip preview and add items immediately
- **Item Preview Table:** Review and edit AI-extracted items before adding
- **Expiration Tracking:** Automatic expiration date estimation by category
- **Smart Storage:** Auto-detects storage location (fridge, pantry, freezer) based on item category
- **CRUD Operations:** Add, update, delete pantry items

### B. Recipe Management

- **Unified Interface:** Tabs for "My Recipes" and "Search" in one page
- **Recipe Upload:** Upload recipe photo → AI extracts title, ingredients, instructions, metadata
- **AI Recipe Search:** Natural language queries → AI returns 5 recipes sorted by pantry match percentage
- **Pantry Matching:** Shows which recipes you can make with current inventory
- **Missing Ingredients:** Lists what you need to buy for each recipe
- **Save AI Results:** Save AI-generated recipes to personal collection
- **Recipe Detail Pages:** Full recipe view with ingredients, instructions, timing, servings
- **Delete Recipes:** Remove recipes from collection

### C. Shopping List (Basic Implementation)

- Structure in place for shopping list generation
- Items linked to ingredients and recipes

### D. Analytics

- PostHog integration with proxy to bypass ad blockers
- User identification via Clerk
- Page view tracking

---

## Backend Structure (Convex)

### Queries (Real-time, reactive data fetching)

- `users.getCurrentUser` - Get user by Clerk ID
- `pantry.list` - Get all pantry items for user
- `pantry.getExpiringSoon` - Items expiring within 7 days
- `recipes.list` - Get user's recipes + public recipes
- `recipes.get` - Get single recipe with ingredients
- `recipes.getRecipesYouCanMake` - Recipes matching pantry inventory

### Mutations (Database writes)

- `users.store` - Create or update user
- `users.updatePreferences` - Update user preferences
- `pantry.add` - Add single item
- `pantry.addBatch` - Add multiple items at once
- `pantry.update` - Update pantry item
- `pantry.remove` - Delete pantry item
- `recipes.create` - Create recipe
- `recipes.addIngredient` - Link ingredient to recipe
- `recipes.remove` - Delete recipe and its ingredients
- `recipes.saveAIRecipe` - Save AI-generated recipe with ingredients
- `recipes.generateUploadUrl` - Get file upload URL

### Actions (Serverless functions with external API calls)

- `ai.extractRecipeFromImage` - Extract recipe from photo using Claude Vision
- `ai.getSuggestedRecipes` - Get AI recipe suggestions
- `aiPantry.extractItemsFromReceipt` - Extract items from receipt photo
- `aiPantry.parseTextList` - Parse natural language ingredient list
- `aiSearch.searchRecipesWithAI` - Search recipes with pantry context

### Key Backend Patterns

1. **Ingredient Management:** Find existing ingredient or create new one (prevents duplicates)
2. **Batch Operations:** Process multiple items with error handling per item
3. **Smart Defaults:** Auto-detect storage location and expiration based on category
4. **Quantity Merging:** If item exists in pantry, add to existing quantity

---

## Frontend Structure & Routing

### Public Routes

- `/` - Landing page with feature overview
- `/sign-in` - Clerk authentication
- `/sign-up` - Clerk registration

### Protected Routes (require authentication)

- `/dashboard` - Overview with stats and quick actions
- `/pantry` - Pantry management with receipt scan and quick add
- `/recipes` - Recipe browsing and AI search (tabbed interface)
- `/recipes/[id]` - Individual recipe detail page
- `/suggestions` - AI recipe suggestions (planned)
- `/shopping-list` - Shopping list management

### Key Frontend Patterns

1. **User Sync Hook:** `useStoreUser()` automatically syncs Clerk user to Convex
2. **Real-time Queries:** Components use `useQuery()` for reactive data
3. **Optimistic Updates:** Mutations update immediately, sync in background
4. **Conditional Rendering:** Based on auth state and data loading
5. **Dialog-based Actions:** Modal dialogs for complex operations (receipt scan, recipe upload)
6. **Tab Navigation:** Unified interfaces with tab components (recipes page)

### Component Architecture

- **Page Components:** Client components that fetch data and coordinate UI
- **Feature Components:** Dialogs, cards, forms for specific features
- **UI Components:** Reusable shadcn/ui primitives
- **Layout Components:** Navigation, layout structure

---

## AI Integration Details

### Claude Sonnet 4.5 Integration

#### Receipt Scanning (`aiPantry.extractItemsFromReceipt`)

- **Input:** Base64 image + media type
- **Process:** Vision API analyzes receipt
- **Output:** Array of items with name, quantity, unit, category, expiration estimate, price
- **Features:** Standardizes ingredient names, estimates shelf life

#### Text Parsing (`aiPantry.parseTextList`)

- **Input:** Natural language text
- **Process:** Text generation API parses ingredients
- **Output:** Structured items with quantities and units
- **Handles:** Various formats ("2kg flour", "dozen eggs", "milk")

#### Recipe Extraction (`ai.extractRecipeFromImage`)

- **Input:** Recipe photo URL
- **Process:** Vision API extracts recipe data
- **Output:** Title, description, ingredients, instructions, metadata
- **Returns:** Full structured recipe object

#### Recipe Search (`aiSearch.searchRecipesWithAI`)

- **Input:** Search query + user's pantry items
- **Process:** AI generates 5 relevant recipes
- **Output:** Recipes with match percentage, missing ingredients, full details
- **Smart:** Prioritizes recipes user can make with current inventory

#### AI Response Handling

- JSON parsing with markdown code block cleanup
- Error handling with descriptive messages
- Structured prompts for consistent output format

---

## Component Interactions

### User Authentication Flow

```
Clerk Sign In → middleware.ts validates → useStoreUser() syncs to Convex
     ↓
Convex users table updated → User preferences loaded → App ready
```

### Receipt Scanning Flow

```
User uploads photo → ReceiptScanDialog converts to base64 →
aiPantry.extractItemsFromReceipt action →
AI analyzes → Returns items → Preview (if not auto-add) →
pantry.addBatch mutation → Items added to database →
Real-time query update → UI refreshes
```

### Recipe Search Flow

```
User enters query → RecipeSearchBar → aiSearch.searchRecipesWithAI →
Fetches user pantry → Sends to Claude → AI returns 5 recipes →
Sort by match percentage → Display SearchResultCard components →
User clicks save → recipes.saveAIRecipe mutation →
Saves recipe + ingredients → Navigate to recipe detail
```

### Pantry Matching Flow

```
Recipe viewed → recipes.get query fetches ingredients →
Compare with pantry.list query results →
Calculate match percentage → Display missing ingredients
```

---

## Technical Highlights

1. **Real-time Reactivity:** Convex provides live updates across all clients
2. **Type Safety:** End-to-end TypeScript from database to UI
3. **AI-First Design:** Core features powered by Claude's vision and text capabilities
4. **Progressive Enhancement:** Auto-add toggle for power users
5. **Smart Defaults:** Category-based expiration and storage location detection
6. **User Experience:** Preview before commit, inline editing, clear feedback
7. **Analytics Privacy:** PostHog proxy bypasses ad blockers while respecting privacy
8. **Scalable Architecture:** Serverless backend scales automatically

---

## Expiration Estimation Guidelines

The AI uses these guidelines when estimating shelf life:

- **Fresh produce:** 5-10 days
- **Dairy:** 7-14 days
- **Fresh meat/fish:** 3-5 days
- **Frozen items:** 90 days
- **Canned goods:** 365 days
- **Dry goods (pasta, rice):** 365 days
- **Bread:** 5-7 days
- **Eggs:** 21 days

---

## Storage Location Detection

Based on item category:

- **Frozen items** → Freezer
- **Dairy products** → Fridge
- **Fresh meat/fish** → Fridge
- **Fresh produce** → Fridge
- **Dry goods** → Pantry
- **Canned goods** → Pantry
- **Condiments** → Pantry (or fridge after opening)

---

## Recent Fixes

### Receipt Scanning Error Fix

**Issue:** "Could not process image" error when scanning receipts

**Root Cause:** Code was uploading images to Convex storage and constructing URLs that required authentication. When the backend action tried to fetch from these URLs, it couldn't authenticate.

**Solution:**
- Changed approach to pass base64 image data directly from frontend to backend action
- Eliminated upload-to-storage-then-fetch workflow
- Modified `aiPantry.extractItemsFromReceipt` to accept `base64Image` and `mediaType` parameters
- Updated `ReceiptScanDialog` to convert images to base64 in the browser

**Benefits:**
- Faster processing (no storage upload/download)
- More reliable (no authentication issues)
- Simpler code flow

**Files Changed:**
- `convex/aiPantry.ts:14-27`
- `components/pantry/ReceiptScanDialog.tsx:43-52, 68-107`

---

## Architecture Strengths

This codebase demonstrates:

- ✅ Clean separation of concerns
- ✅ Strong type safety throughout the stack
- ✅ Thoughtful AI integration with structured prompts
- ✅ Real-time reactive UI without manual refresh logic
- ✅ User-friendly error handling and preview workflows
- ✅ Smart defaults that reduce user friction
- ✅ Scalable serverless architecture
- ✅ Modern React patterns with hooks and composition

---

*This documentation reflects the codebase as of the receipt scanning fix on 2025-11-20.*
