"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MapPin, Calendar } from "lucide-react";

interface PantryItem {
  _id: Id<"pantryItems">;
  quantity: number;
  unit: string;
  expirationDate?: number;
  location?: string;
  notes?: string;
  ingredient: {
    _id: Id<"ingredients">;
    name: string;
    category: string;
  } | null;
}

interface PantryItemCardProps {
  item: PantryItem;
}

export function PantryItemCard({ item }: PantryItemCardProps) {
  const removePantryItem = useMutation(api.pantry.remove);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to remove this item?")) {
      await removePantryItem({ id: item._id });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const isExpiringSoon = (expirationDate?: number) => {
    if (!expirationDate) return false;
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return expirationDate <= sevenDaysFromNow;
  };

  const isExpired = (expirationDate?: number) => {
    if (!expirationDate) return false;
    return expirationDate < Date.now();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">
            {item.ingredient?.name || "Unknown"}
          </CardTitle>
          <Badge variant="secondary">{item.ingredient?.category}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-muted-foreground">Quantity: {item.quantity}</span>
          <span className="text-sm text-muted-foreground">Amount: {item.unit}</span>
        </div>

        {item.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-3 w-3" />
            {item.location.charAt(0).toUpperCase() + item.location.slice(1)}
          </div>
        )}

        {item.expirationDate && (
          <div className="flex items-center text-sm">
            <Calendar className="mr-1 h-3 w-3" />
            <span
              className={
                isExpired(item.expirationDate)
                  ? "text-destructive font-medium"
                  : isExpiringSoon(item.expirationDate)
                  ? "text-yellow-600 font-medium"
                  : "text-muted-foreground"
              }
            >
              {isExpired(item.expirationDate)
                ? "Expired: "
                : isExpiringSoon(item.expirationDate)
                ? "Expires soon: "
                : "Expires: "}
              {formatDate(item.expirationDate)}
            </span>
          </div>
        )}

        {item.notes && (
          <p className="text-sm text-muted-foreground italic">{item.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
