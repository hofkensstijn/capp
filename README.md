# Capp - Your Smart Cooking Assistant

A web application that helps you manage your pantry, discover recipes based on what you have, and generate shopping lists. Powered by AI for intelligent recipe extraction, pantry scanning, and personalized recipe suggestions.

## Features

### 🥘 Smart Pantry Management
- **Receipt Scanner**: Snap a photo of your grocery receipt and AI automatically extracts all items
- **Quick Add**: Paste a list of ingredients in natural language (e.g., "2kg flour, dozen eggs, milk") and AI parses it
- **Auto-add Toggle**: Choose between automatic addition or preview/edit mode
- **Item Preview Table**: Review and edit items before adding to your pantry
- **Expiration Tracking**: Automatic expiration date estimation by category
- **Smart Storage**: Auto-detects storage location (fridge, pantry, freezer) based on item category

### 📖 Recipe Management
- **Unified Recipe Interface**: Browse your saved recipes and search for new ones in one place
- **AI Recipe Search**: Search for recipes with natural language queries
- **Smart Matching**: AI analyzes your pantry and shows match percentage for each recipe
- **Missing Ingredients**: See exactly what you need to buy to make any recipe
- **Recipe Upload**: Upload recipe photos and AI extracts ingredients and instructions
- **Save AI Results**: Save AI-generated recipes to your personal collection
- **Full Recipe View**: Detailed recipe pages with ingredients, instructions, prep time, and servings
- **Delete Recipes**: Remove recipes from your collection anytime

### 🛒 Shopping List Generator
- Generate shopping lists based on missing ingredients for selected recipes
- Track items you need to buy

### 📊 Analytics
- PostHog integration with ad blocker bypass for usage tracking
- User behavior analytics

## Tech Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Convex (serverless database, real-time queries, file storage)
- **Authentication**: Clerk with JWT integration
- **AI**: Anthropic Claude Sonnet 4.5 (vision + text generation)
- **Analytics**: PostHog with proxy setup
- **Notifications**: Sonner toast library
- **Deployment**: Vercel

## Project Structure

```
capp/
├── app/                      # Next.js app router pages
│   ├── api/                 # API routes (PostHog proxy)
│   ├── dashboard/            # Main dashboard
│   ├── pantry/              # Pantry management with receipt scanning
│   ├── recipes/             # Unified recipe browsing, search & management
│   │   └── [id]/           # Dynamic recipe detail pages
│   ├── shopping-list/       # Shopping list generator
│   ├── suggestions/         # AI recipe suggestions
│   ├── sign-in/             # Authentication pages
│   └── sign-up/
├── components/              # React components
│   ├── layout/             # Layout components (Navigation)
│   ├── pantry/             # Receipt scanning, quick add, item preview
│   ├── recipes/            # Recipe cards, search, detail view
│   ├── shopping/           # Shopping list components
│   └── ui/                 # shadcn/ui components
├── convex/                 # Convex backend
│   ├── ai.ts              # AI recipe extraction from photos
│   ├── aiPantry.ts        # AI pantry item extraction
│   ├── aiSearch.ts        # AI-powered recipe search
│   ├── pantry.ts          # Pantry CRUD operations
│   ├── recipes.ts         # Recipe management & saving
│   ├── users.ts           # User management & preferences
│   └── schema.ts          # Database schema
├── lib/                    # Utility functions & hooks
├── hooks/                  # Custom React hooks (toast)
└── providers/              # React context providers (PostHog, Clerk)
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex

1. Create a Convex account at [convex.dev](https://convex.dev)
2. Run the Convex dev setup:
   ```bash
   npx convex dev
   ```
3. Follow the prompts to create a new project
4. This will automatically populate `NEXT_PUBLIC_CONVEX_URL` in your `.env.local`

### 3. Set Up Clerk Authentication

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your API keys from the Clerk dashboard
4. Add them to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   ```
5. In Clerk dashboard, configure:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in URL**: `/dashboard`
   - **After sign-up URL**: `/dashboard`

### 4. Set Up Anthropic API (for AI features)

1. Get an API key from [Anthropic](https://console.anthropic.com/)
2. Add it to Convex environment (not `.env.local`):
   ```bash
   npx convex env set ANTHROPIC_API_KEY your_anthropic_api_key
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Set Up PostHog (Optional - for analytics)

1. Create a PostHog account at [posthog.com](https://posthog.com)
2. Add your keys to `.env.local`:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or eu.i.posthog.com
   ```

## Database Schema

The Convex schema includes the following tables:

- **users** - User profiles synced with Clerk, includes preferences (autoAddItems)
- **ingredients** - Master ingredient catalog with categories
- **pantryItems** - User's inventory with quantities, expiration dates, and storage locations
- **recipes** - Recipe details with instructions, metadata, and images
- **recipeIngredients** - Junction table linking recipes to ingredients with quantities
- **shoppingLists** - User shopping lists
- **shoppingListItems** - Items in shopping lists

## AI Features

The app uses Claude Sonnet 4.5 for multiple AI-powered features:

1. **Receipt Scanning** (`convex/aiPantry.ts`):
   - Extracts items from receipt photos using vision API
   - Identifies quantities, units, and categories
   - Estimates expiration dates

2. **Text Parsing** (`convex/aiPantry.ts`):
   - Parses natural language ingredient lists
   - Handles various formats (e.g., "2kg flour", "dozen eggs")

3. **Recipe Extraction** (`convex/ai.ts`):
   - Extracts recipes from photos
   - Identifies ingredients with quantities
   - Parses cooking instructions

4. **Recipe Search** (`convex/aiSearch.ts`):
   - Searches for recipes based on natural language queries
   - Analyzes user's pantry inventory
   - Calculates match percentage
   - Identifies missing ingredients

## Implementation Status

### ✅ Completed Features
- [x] Next.js 15 with App Router and TypeScript setup
- [x] Tailwind CSS v4 + shadcn/ui component library
- [x] Convex backend with real-time database
- [x] Clerk authentication with user sync
- [x] PostHog analytics with ad blocker bypass
- [x] User preferences system (auto-add toggle)
- [x] **Pantry Management**:
  - [x] Receipt scanner with AI extraction
  - [x] Quick add with natural language parsing
  - [x] Item preview/edit table
  - [x] Batch add operations
  - [x] Automatic expiration tracking
  - [x] Smart storage location detection
  - [x] CRUD operations for pantry items
- [x] **Recipe System**:
  - [x] Unified recipes page with tabs
  - [x] AI-powered recipe search
  - [x] Recipe photo upload with AI extraction
  - [x] Save AI-generated recipes
  - [x] Recipe detail pages
  - [x] Pantry matching with percentage
  - [x] Missing ingredients display
  - [x] Delete recipes functionality
- [x] **Shopping List**: Basic structure implemented

### 🚧 In Progress / Planned
- [ ] Recipe suggestions page enhancement
- [ ] Shopping list auto-generation from recipes
- [ ] Ingredient substitution suggestions
- [ ] Meal planning calendar
- [ ] Nutritional information
- [ ] Recipe sharing and public recipes
- [ ] Mobile app (React Native)
- [ ] Vercel production deployment

## Development Commands

```bash
# Run development server
npm run dev

# Run Convex dev (in separate terminal)
npx convex dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables

### `.env.local` (Next.js environment)
```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=        # Auto-filled by `npx convex dev`

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# PostHog Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Convex Environment (set via CLI)
```bash
# Anthropic API (for AI features)
npx convex env set ANTHROPIC_API_KEY sk-ant-...
```

## How It Works

1. **User signs up** via Clerk authentication
2. **Adds items to pantry** using:
   - Receipt scanner (photo → AI extraction)
   - Quick add (natural language → AI parsing)
   - Manual entry
3. **Uploads or searches recipes**:
   - Upload recipe photos → AI extracts ingredients and instructions
   - Search with natural language → AI finds matching recipes
4. **AI analyzes** user's pantry against recipe requirements:
   - Calculates match percentage
   - Shows missing ingredients
5. **User saves recipes** they want to make
6. **Shopping list** automatically generated from missing ingredients

## Key Technical Decisions

- **Convex over traditional REST API**: Real-time updates, built-in file storage, serverless functions
- **Clerk for auth**: Pre-built UI components, JWT integration, user management
- **Claude Sonnet 4.5**: Vision API for image analysis, high-quality text generation
- **PostHog proxy**: Bypass ad blockers using Next.js API routes
- **shadcn/ui**: Copy-paste components, full customization, Tailwind integration

## License

MIT
