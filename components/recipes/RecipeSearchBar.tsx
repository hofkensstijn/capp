"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface RecipeSearchBarProps {
  onSearch: (query: string) => Promise<void>;
  isSearching: boolean;
  pantryCount?: number;
}

export function RecipeSearchBar({
  onSearch,
  isSearching,
  pantryCount = 0,
}: RecipeSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    await onSearch(query.trim());
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="What would you like to cook? (e.g., 'quick pasta dinner', 'healthy chicken')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </form>

      {pantryCount > 0 && (
        <p className="text-sm text-muted-foreground">
          AI will suggest recipes based on your {pantryCount} pantry item
          {pantryCount !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
