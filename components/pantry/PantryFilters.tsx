"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  X,
  Refrigerator,
  Package as PackageIcon,
  Snowflake,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface PantryFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchText: string;
  categories: string[];
  locations: string[];
  expirationFilter: "all" | "expiring-soon" | "expired";
}

const CATEGORIES = [
  "vegetables",
  "fruits",
  "proteins",
  "dairy",
  "grains",
  "spices",
  "condiments",
  "frozen",
  "other",
];

const LOCATIONS = [
  { value: "fridge", label: "Fridge", icon: Refrigerator },
  { value: "pantry", label: "Pantry", icon: PackageIcon },
  { value: "freezer", label: "Freezer", icon: Snowflake },
];

export function PantryFilters({ onFilterChange }: PantryFiltersProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [expirationFilter, setExpirationFilter] = useState<"all" | "expiring-soon" | "expired">("all");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = {
      searchText: updates.searchText ?? searchText,
      categories: updates.categories ?? selectedCategories,
      locations: updates.locations ?? selectedLocations,
      expirationFilter: updates.expirationFilter ?? expirationFilter,
    };
    onFilterChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    updateFilters({ searchText: value });
  };

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    updateFilters({ categories: newCategories });
  };

  const toggleLocation = (location: string) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((l) => l !== location)
      : [...selectedLocations, location];
    setSelectedLocations(newLocations);
    updateFilters({ locations: newLocations });
  };

  const handleExpirationFilterChange = (filter: "all" | "expiring-soon" | "expired") => {
    setExpirationFilter(filter);
    updateFilters({ expirationFilter: filter });
  };

  const clearAllFilters = () => {
    setSearchText("");
    setSelectedCategories([]);
    setSelectedLocations([]);
    setExpirationFilter("all");
    onFilterChange({
      searchText: "",
      categories: [],
      locations: [],
      expirationFilter: "all",
    });
  };

  const activeFilterCount =
    (searchText ? 1 : 0) +
    selectedCategories.length +
    selectedLocations.length +
    (expirationFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pantry items..."
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-10"
        />
        {searchText && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => handleSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Location Filters */}
        {LOCATIONS.map((location) => {
          const Icon = location.icon;
          const isActive = selectedLocations.includes(location.value);
          return (
            <Button
              key={location.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLocation(location.value)}
              className="h-8"
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {location.label}
            </Button>
          );
        })}

        {/* Expiration Filters */}
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          variant={expirationFilter === "expiring-soon" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            handleExpirationFilterChange(
              expirationFilter === "expiring-soon" ? "all" : "expiring-soon"
            )
          }
          className="h-8"
        >
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          Expiring Soon
        </Button>
        <Button
          variant={expirationFilter === "expired" ? "default" : "outline"}
          size="sm"
          onClick={() =>
            handleExpirationFilterChange(
              expirationFilter === "expired" ? "all" : "expired"
            )
          }
          className="h-8"
        >
          <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
          Expired
        </Button>

        {/* Category Filter Toggle */}
        <div className="h-6 w-px bg-border mx-1" />
        <Button
          variant={showCategoryFilter ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          className="h-8"
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Categories
          {selectedCategories.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <>
            <div className="h-6 w-px bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 text-muted-foreground"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear ({activeFilterCount})
            </Button>
          </>
        )}
      </div>

      {/* Category Filter Chips (Expandable) */}
      {showCategoryFilter && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategories.includes(category);
            return (
              <Badge
                key={category}
                variant={isActive ? "default" : "outline"}
                className="cursor-pointer capitalize hover:bg-primary/90 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                {category}
                {isActive && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
          <span>Active filters:</span>
          {searchText && (
            <Badge variant="secondary">
              Search: {searchText}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleSearchChange("")}
              />
            </Badge>
          )}
          {selectedLocations.map((location) => (
            <Badge key={location} variant="secondary" className="capitalize">
              {location}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => toggleLocation(location)}
              />
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="capitalize">
              {category}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => toggleCategory(category)}
              />
            </Badge>
          ))}
          {expirationFilter !== "all" && (
            <Badge variant="secondary" className="capitalize">
              {expirationFilter.replace("-", " ")}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleExpirationFilterChange("all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
