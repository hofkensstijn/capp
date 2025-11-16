"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ChefHat, Home, Package, BookOpen, ShoppingCart, Sparkles } from "lucide-react";

const routes = [
  {
    label: "Dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "Pantry",
    icon: Package,
    href: "/pantry",
  },
  {
    label: "Recipes",
    icon: BookOpen,
    href: "/recipes",
  },
  {
    label: "Suggestions",
    icon: Sparkles,
    href: "/suggestions",
  },
  {
    label: "Shopping List",
    icon: ShoppingCart,
    href: "/shopping-list",
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <ChefHat className="h-6 w-6" />
          <span>Capp</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === route.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <route.icon className="h-4 w-4" />
                <span className="hidden md:inline">{route.label}</span>
              </Link>
            ))}
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
