"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Upload } from "lucide-react";
import { ItemPreviewTable } from "./ItemPreviewTable";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ReceiptScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: Id<"households">;
  userId: Id<"users">;
  autoAdd: boolean;
}

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  estimatedExpirationDays: number;
  category: string;
  location?: string;
}

export function ReceiptScanDialog({
  isOpen,
  onClose,
  householdId,
  userId,
  autoAdd,
}: ReceiptScanDialogProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const extractItems = useAction(api.aiPantry.extractItemsFromReceipt);
  const addBatch = useMutation(api.pantry.addBatch);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!selectedImage) return;

    setIsScanning(true);

    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Extract items from receipt
      const items = await extractItems({
        base64Image,
        mediaType: selectedImage.type
      });
      setParsedItems(items);

      if (autoAdd) {
        // Auto-add mode: skip preview and add immediately
        await handleAddItems(items);
      } else {
        // Show preview
        setShowPreview(true);
      }
    } catch (error) {
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Failed to scan receipt",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddItems = async (itemsToAdd: ParsedItem[]) => {
    setIsAdding(true);
    try {
      const results = await addBatch({
        householdId,
        items: itemsToAdd,
        addedBy: userId,
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      toast({
        title: "Items added!",
        description: `Successfully added ${successCount} item${successCount !== 1 ? "s" : ""}${
          failCount > 0 ? `. ${failCount} failed.` : ""
        }`,
      });

      // Reset and close
      handleClose();
    } catch (error) {
      toast({
        title: "Failed to add items",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setParsedItems([]);
    setShowPreview(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan Receipt
          </DialogTitle>
          <DialogDescription>
            Upload a photo of your grocery receipt and AI will extract all items.
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            {!imagePreview ? (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Click to upload receipt</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-96 rounded-lg overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Receipt preview"
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleScan}
                    disabled={isScanning}
                    className="flex-1"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        {autoAdd ? "Scan & Add" : "Scan & Preview"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    disabled={isScanning}
                  >
                    Change Photo
                  </Button>
                  <Button variant="outline" onClick={handleClose} disabled={isScanning}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Tips:</strong> Take a clear, well-lit photo of your receipt. Make sure all
              text is readable. The AI will identify food items and estimate expiration dates.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ItemPreviewTable items={parsedItems} onItemsChange={setParsedItems} />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setImagePreview(null);
                  setSelectedImage(null);
                }}
                disabled={isAdding}
              >
                Scan Another Receipt
              </Button>
              <Button
                onClick={() => handleAddItems(parsedItems)}
                disabled={parsedItems.length === 0 || isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${parsedItems.length} Item${parsedItems.length !== 1 ? "s" : ""} to Pantry`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
