# Setup Guide

Follow these steps to get your app running with all features enabled.

## Step 1: Configure Clerk Authentication

### 1.1 Create a Clerk Account
1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose your authentication methods (Email, Google, etc.)

### 1.2 Get Your API Keys
1. In the Clerk Dashboard, go to **API Keys**
2. Copy your keys and add them to `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

### 1.3 Configure URLs in Clerk Dashboard
Go to **Paths** in Clerk Dashboard and set:
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/dashboard`
- **Home URL**: `/`

### 1.4 Set Up JWT Template for Convex
This is **CRITICAL** for Convex authentication to work:

1. In Clerk Dashboard, go to **JWT Templates** (under "Configure")
2. Click **+ New template**
3. Select **Convex** from the list
4. Click **Apply Changes**
5. Copy the **Issuer** domain (looks like `https://your-app.clerk.accounts.dev`)
6. Add it to `.env.local`:
   ```bash
   CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev
   ```

### 1.5 Update Convex Auth Config
The `convex/auth.config.ts` file has already been created. Make sure the domain matches your Clerk issuer domain.

## Step 2: Configure Anthropic API (For AI Features)

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up and get an API key
3. Add it to `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ```

## Step 3: Seed Initial Ingredients

After starting the dev servers, you'll want to add some initial ingredients to the database.

### Option A: Using Convex Dashboard
1. Open the Convex Dashboard (URL shown when running `npx convex dev`)
2. Go to **Functions**
3. Find `ingredients:seedIngredients`
4. Click **Run** with no arguments

### Option B: Create a Seed Script
We can add a button in the app to trigger this.

## Step 4: Start Development Servers

Open two terminal windows:

**Terminal 1 - Convex:**
```bash
npx convex dev
```

**Terminal 2 - Next.js:**
```bash
npm run dev
```

## Step 5: Test the App

1. Go to [http://localhost:3000](http://localhost:3000)
2. Click "Sign Up" and create an account
3. You should be redirected to the dashboard
4. Navigate to:
   - **Pantry** - Add ingredients
   - **Recipes** - Upload a recipe photo (requires Anthropic API key)

## Troubleshooting

### Error: "request failed" with path "tokens/convex"
- **Cause**: JWT template not configured in Clerk
- **Fix**: Follow Step 1.4 above to set up the JWT template

### Error: "ANTHROPIC_API_KEY is not configured"
- **Cause**: Missing Anthropic API key
- **Fix**: Add your API key to `.env.local` (Step 2)

### Convex functions not working
- **Cause**: Convex dev server not running
- **Fix**: Make sure `npx convex dev` is running in a separate terminal

### No ingredients available in dropdown
- **Cause**: Database hasn't been seeded
- **Fix**: Run the seed function (Step 3)

## Environment Variables Checklist

Make sure all these are filled in `.env.local`:

```bash
# ✅ Auto-filled by Convex
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
CONVEX_DEPLOYMENT=anonymous:anonymous-capp

# ⚠️ You need to add these
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev

# ⚠️ Optional but needed for AI features
ANTHROPIC_API_KEY=sk-ant-...
```

## Next Steps

Once everything is configured:
1. Sign up for an account
2. Seed ingredients using the Convex dashboard
3. Add items to your pantry
4. Upload a recipe photo and watch AI extract it!
5. Browse recipes you can make with your ingredients

Need help? Check the [README.md](./README.md) for more information.
