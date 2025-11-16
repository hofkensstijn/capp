import { Button } from "@/components/ui/button";
import { ChefHat, Package, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  // Redirect authenticated users to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ChefHat className="h-6 w-6" />
            <span>Capp</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Your Smart Cooking Assistant
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your pantry, discover recipes, and never waste food again.
              Powered by AI to help you make the most of what you have.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">Start Cooking Smarter</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight mb-12">
              Everything you need to cook smarter
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Pantry Tracking</h3>
                <p className="text-muted-foreground">
                  Keep track of what you have at home, including quantities and
                  expiration dates.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Recipe Management</h3>
                <p className="text-muted-foreground">
                  Upload recipe photos and let AI extract all the details for
                  you.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Smart Suggestions</h3>
                <p className="text-muted-foreground">
                  Get AI-powered recipe suggestions based on what you already
                  have.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl">Shopping Lists</h3>
                <p className="text-muted-foreground">
                  Automatically generate shopping lists based on recipes you want
                  to make.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Next.js, Convex, and Clerk
        </div>
      </footer>
    </div>
  );
}
