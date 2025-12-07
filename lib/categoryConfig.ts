import {
  Carrot,
  Apple,
  Beef,
  Milk,
  Wheat,
  Sparkles,
  Droplet,
  Snowflake,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}

export const categoryConfig: Record<string, CategoryConfig> = {
  vegetables: {
    icon: Carrot,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-950/50",
    borderColor: "border-l-green-500",
    label: "Vegetables",
  },
  fruits: {
    icon: Apple,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-950/50",
    borderColor: "border-l-pink-500",
    label: "Fruits",
  },
  proteins: {
    icon: Beef,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-950/50",
    borderColor: "border-l-red-500",
    label: "Proteins",
  },
  dairy: {
    icon: Milk,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-950/50",
    borderColor: "border-l-blue-500",
    label: "Dairy",
  },
  grains: {
    icon: Wheat,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-950/50",
    borderColor: "border-l-amber-500",
    label: "Grains",
  },
  spices: {
    icon: Sparkles,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-950/50",
    borderColor: "border-l-orange-500",
    label: "Spices",
  },
  condiments: {
    icon: Droplet,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-950/50",
    borderColor: "border-l-yellow-500",
    label: "Condiments",
  },
  frozen: {
    icon: Snowflake,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-950/50",
    borderColor: "border-l-cyan-500",
    label: "Frozen",
  },
  other: {
    icon: Package,
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-950/50",
    borderColor: "border-l-gray-500",
    label: "Other",
  },
};

export function getCategoryConfig(category?: string): CategoryConfig {
  const normalizedCategory = category?.toLowerCase() || "other";
  return categoryConfig[normalizedCategory] || categoryConfig.other;
}
