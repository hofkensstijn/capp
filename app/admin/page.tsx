"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Loader2, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const importFromMealDB = useAction(api.seedMealDB.importFromMealDB);

  const handleImport = async () => {
    setIsImporting(true);
    setResult(null);

    try {
      const response = await importFromMealDB({});
      setResult(`✅ ${response.message}`);
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Tools</h1>
          <p className="text-muted-foreground">Database seeding and management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import Recipes from TheMealDB
            </CardTitle>
            <CardDescription>
              Import ~30 recipes from TheMealDB (free API). Includes recipes from
              categories: Chicken, Beef, Seafood, Vegetarian, Pasta, and Dessert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-900 mb-2">What this does:</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Imports ~30 recipes with images and instructions</li>
                <li>Automatically creates ingredients as needed</li>
                <li>Recipes are marked as public</li>
                <li>Takes ~30-60 seconds to complete</li>
              </ul>
            </div>

            <Button
              onClick={handleImport}
              disabled={isImporting}
              size="lg"
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing... This may take a minute
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Start Import
                </>
              )}
            </Button>

            {result && (
              <div
                className={`p-4 rounded-lg ${
                  result.startsWith("✅")
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p
                  className={
                    result.startsWith("✅") ? "text-green-900" : "text-red-900"
                  }
                >
                  {result}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Attribution</CardTitle>
            <CardDescription>Required by TheMealDB</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recipe data provided by{" "}
              <a
                href="https://www.themealdb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                TheMealDB
              </a>
              . Free to use for non-commercial purposes.
            </p>
          </CardContent>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-900 mb-2">⚠️ Note:</p>
          <p className="text-sm text-yellow-800">
            This page should be protected in production. Consider adding admin-only
            authentication or removing it entirely after initial setup.
          </p>
        </div>
      </div>
    </div>
  );
}
