"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

const formSchema = z.object({
  ingredientId: z.string().optional(),
  ingredientName: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  expirationDate: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.ingredientId || data.ingredientName, {
  message: "Please select an existing ingredient or enter a new one",
  path: ["ingredientName"],
});

type FormValues = z.infer<typeof formSchema>;

interface AddPantryItemDialogProps {
  householdId: Id<"households">;
  userId: Id<"users">;
}

export function AddPantryItemDialog({ householdId, userId }: AddPantryItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const ingredients = useQuery(api.ingredients.list);
  const addPantryItem = useMutation(api.pantry.add);
  const addIngredient = useMutation(api.ingredients.add);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredientId: "",
      ingredientName: "",
      category: "other",
      quantity: 1,
      unit: "",
      expirationDate: "",
      location: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      let ingredientId = values.ingredientId as Id<"ingredients">;

      // If creating a new ingredient, add it first
      if (!ingredientId && values.ingredientName) {
        ingredientId = await addIngredient({
          name: values.ingredientName,
          category: values.category || "other",
          commonUnit: values.unit,
        });
      }

      await addPantryItem({
        householdId,
        ingredientId,
        quantity: values.quantity,
        unit: values.unit,
        expirationDate: values.expirationDate
          ? new Date(values.expirationDate).getTime()
          : undefined,
        location: values.location || undefined,
        notes: values.notes || undefined,
        addedBy: userId,
      });
      form.reset();
      setIsCreatingNew(false);
      setOpen(false);
    } catch (error) {
      console.error("Failed to add pantry item:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Pantry Item</DialogTitle>
          <DialogDescription>
            Add a new item to your pantry inventory
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isCreatingNew ? "Create new ingredient" : "Select existing ingredient"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreatingNew(!isCreatingNew);
                  form.setValue("ingredientId", "");
                  form.setValue("ingredientName", "");
                }}
              >
                {isCreatingNew ? "Select Existing" : "+ Create New"}
              </Button>
            </div>

            {!isCreatingNew ? (
              <FormField
                control={form.control}
                name="ingredientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredient</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an ingredient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ingredients?.map((ingredient) => (
                          <SelectItem
                            key={ingredient._id}
                            value={ingredient._id}
                          >
                            {ingredient.name} ({ingredient.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="ingredientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tomatoes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="fruits">Fruits</SelectItem>
                          <SelectItem value="proteins">Proteins</SelectItem>
                          <SelectItem value="dairy">Dairy</SelectItem>
                          <SelectItem value="grains">Grains</SelectItem>
                          <SelectItem value="spices">Spices</SelectItem>
                          <SelectItem value="condiments">Condiments</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="grams, pieces, ml" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pantry">Pantry</SelectItem>
                        <SelectItem value="fridge">Fridge</SelectItem>
                        <SelectItem value="freezer">Freezer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
