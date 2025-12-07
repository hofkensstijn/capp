"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Calendar } from "lucide-react";

interface PreviewItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedExpirationDays: number;
  category: string;
  location?: string;
}

interface ItemPreviewTableProps {
  items: PreviewItem[];
  onItemsChange: (items: PreviewItem[]) => void;
}

export function ItemPreviewTable({ items, onItemsChange }: ItemPreviewTableProps) {
  const updateItem = (index: number, updates: Partial<PreviewItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const formatExpirationDate = (days: number) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString();
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items to preview
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Item</th>
              <th className="text-left p-3 text-sm font-medium w-24">Qty</th>
              <th className="text-left p-3 text-sm font-medium w-24">Unit</th>
              <th className="text-left p-3 text-sm font-medium w-32">Expires</th>
              <th className="text-left p-3 text-sm font-medium w-32">Location</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </td>
                <td className="p-3">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, { quantity: parseFloat(e.target.value) })
                    }
                    className="w-20 h-8"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td className="p-3">
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(index, { unit: e.target.value })}
                    className="w-20 h-8"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">
                      {formatExpirationDate(item.estimatedExpirationDays)}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <select
                    value={item.location || "pantry"}
                    onChange={(e) => updateItem(index, { location: e.target.value })}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="pantry">Pantry</option>
                    <option value="fridge">Fridge</option>
                    <option value="freezer">Freezer</option>
                  </select>
                </td>
                <td className="p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-muted/50 text-sm text-muted-foreground border-t">
        <strong>{items.length}</strong> item{items.length !== 1 ? "s" : ""} ready to add
      </div>
    </div>
  );
}
