"use client";

import { Navigation } from "@/components/layout/Navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
      </div>
    </AuthGuard>
  );
}
