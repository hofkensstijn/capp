# Capp - Your Smart Cooking Assistant

A web application that helps you manage your pantry, discover recipes based on what you have, and generate shopping lists. Powered by AI for intelligent recipe extraction and suggestions.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Convex (serverless database & functions)
- **Authentication**: Clerk
- **AI**: Anthropic Claude API (for recipe extraction and suggestions)
- **Deployment**: Vercel

## Project Structure

```
capp/
├── app/                      # Next.js app router pages
│   ├── dashboard/            # Main dashboard
│   ├── pantry/              # Pantry management
│   ├── recipes/             # Recipe browsing & management
│   ├── shopping-list/       # Shopping list generator
│   ├── sign-in/             # Authentication pages
│   └── sign-up/
├── components/              # React components
│   ├── layout/             # Layout components (Navigation)
│   ├── pantry/             # Pantry-specific components
│   ├── recipes/            # Recipe-specific components
│   ├── shopping/           # Shopping list components
│   └── ui/                 # shadcn/ui components
├── convex/                 # Convex backend
│   └── schema.ts           # Database schema
├── lib/                    # Utility functions
└── providers/              # React context providers
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
2. Add it to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The Convex schema includes the following tables:

- **users** - User profiles synced with Clerk
- **ingredients** - Master ingredient catalog
- **pantryItems** - User's inventory with quantities & expiration dates
- **recipes** - Recipe details with instructions and metadata
- **recipeIngredients** - Junction table linking recipes to ingredients
- **shoppingLists** - User shopping lists
- **shoppingListItems** - Items in shopping lists

## Features (Planned)

### ✅ Phase 1: Setup (Complete)
- [x] Next.js project initialization
- [x] Tailwind CSS & shadcn/ui setup
- [x] Convex backend configuration
- [x] Clerk authentication setup
- [x] Base project structure

### 🚧 Phase 2: Core Features (In Progress)
- [ ] User authentication flow with Clerk
- [ ] Pantry management (add/edit/delete items)
- [ ] Recipe photo upload with AI extraction
- [ ] Recipe display and management
- [ ] Smart recipe suggestions based on inventory
- [ ] Shopping list generator

### 📅 Phase 3: AI & Polish
- [ ] AI-powered recipe extraction from photos
- [ ] AI recipe recommendations
- [ ] Ingredient substitution suggestions
- [ ] UI/UX polish and responsive design

### 🚀 Phase 4: Deployment
- [ ] Vercel deployment
- [ ] Production environment configuration

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

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
# Convex
NEXT_PUBLIC_CONVEX_URL=        # Auto-filled by `npx convex dev`

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Anthropic API (for AI features)
ANTHROPIC_API_KEY=
```

## Next Steps

1. **Configure Convex**: Run `npx convex dev` to set up your Convex project
2. **Configure Clerk**: Set up a Clerk application and add your keys
3. **Get Anthropic API Key**: Sign up for Anthropic to enable AI features
4. **Start Development**: Begin implementing the core features!

## License

MIT
