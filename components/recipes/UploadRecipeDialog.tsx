"use client";

import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Camera } from "lucide-react";

interface UploadRecipeDialogProps {
  userId: Id<"users">;
  onRecipeCreated?: () => void;
}

export function UploadRecipeDialog({
  userId,
  onRecipeCreated,
}: UploadRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);
  const extractRecipe = useAction(api.ai.extractRecipeFromImage);
  const createRecipe = useMutation(api.recipes.create);
  const addIngredient = useMutation(api.recipes.addIngredient);
  const addNewIngredient = useMutation(api.ingredients.add);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedImage) return;

    try {
      setIsUploading(true);

      // Step 1: Upload image to Convex storage
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResult.json();
      const imageUrl = uploadUrl.split("?")[0] + `?storageId=${storageId}`;

      setIsUploading(false);
      setIsExtracting(true);

      // Step 2: Extract recipe using AI
      const extractedRecipe = await extractRecipe({ imageUrl });

      // Step 3: Create recipe in database
      const recipeId = await createRecipe({
        userId,
        title: extractedRecipe.title,
        description: extractedRecipe.description,
        instructions: extractedRecipe.instructions,
        prepTime: extractedRecipe.prepTime,
        cookTime: extractedRecipe.cookTime,
        servings: extractedRecipe.servings,
        difficulty: extractedRecipe.difficulty,
        cuisine: extractedRecipe.cuisine,
        imageStorageId: storageId,
        isPublic: false,
      });

      // Step 4: Add ingredients
      for (const ingredient of extractedRecipe.ingredients) {
        // Create new ingredient (simplified for now)
        const ingredientId = await addNewIngredient({
          name: ingredient.name,
          category: "other",
          commonUnit: ingredient.unit,
        });

        // Add to recipe
        await addIngredient({
          recipeId,
          ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
        });
      }

      setIsExtracting(false);
      setOpen(false);
      setSelectedImage(null);
      setPreviewUrl(null);

      if (onRecipeCreated) {
        onRecipeCreated();
      }

      alert("Recipe extracted and saved successfully!");
    } catch (error) {
      console.error("Error uploading recipe:", error);
      alert(
        `Failed to process recipe: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsUploading(false);
      setIsExtracting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Camera className="mr-2 h-4 w-4" />
          Upload Recipe Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Recipe Photo</DialogTitle>
          <DialogDescription>
            Upload a photo of a recipe and let AI extract all the details for
            you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Click to select an image
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Recipe preview"
                className="w-full rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  disabled={isUploading || isExtracting}
                >
                  Change Image
                </Button>
                <Button
                  onClick={handleUploadAndExtract}
                  disabled={isUploading || isExtracting}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting Recipe...
                    </>
                  ) : (
                    "Extract Recipe"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
