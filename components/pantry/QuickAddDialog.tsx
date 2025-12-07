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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { ItemPreviewTable } from "./ItemPreviewTable";
import { useToast } from "@/hooks/use-toast";
import { Confetti } from "@/components/ui/confetti";

interface QuickAddDialogProps {
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

export function QuickAddDialog({ isOpen, onClose, householdId, userId, autoAdd }: QuickAddDialogProps) {
  const [text, setText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const parseTextList = useAction(api.aiPantry.parseTextList);
  const addBatch = useMutation(api.pantry.addBatch);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!text.trim()) return;

    setIsParsing(true);
    try {
      const items = await parseTextList({ text: text.trim() });
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
        title: "Parse failed",
        description: error instanceof Error ? error.message : "Failed to parse items",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
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

      // Show confetti for successful additions
      if (successCount > 0) {
        setShowConfetti(true);
      }

      toast({
        title: "Items added!",
        description: `Successfully added ${successCount} item${successCount !== 1 ? "s" : ""}${
          failCount > 0 ? `. ${failCount} failed.` : ""
        }`,
      });

      // Reset and close
      setText("");
      setParsedItems([]);
      setShowPreview(false);

      // Close dialog after confetti
      setTimeout(() => {
        setShowConfetti(false);
        onClose();
      }, 3000);
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
    setText("");
    setParsedItems([]);
    setShowPreview(false);
    onClose();
  };

  return (
    <>
      <Confetti show={showConfetti} />
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Add Items
          </DialogTitle>
          <DialogDescription>
            Type or paste your shopping list. AI will parse it into individual items.
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Type your items here...
Examples:
• milk, eggs, 2kg flour
• dozen eggs
• 1 liter olive oil
• chicken breast, 500g pasta"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-48 font-mono text-sm"
              disabled={isParsing}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleParse}
                disabled={!text.trim() || isParsing}
                className="flex-1"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {autoAdd ? "Parse & Add" : "Parse & Preview"}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isParsing}>
                Cancel
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Tips:</strong> Separate items with commas or new lines. Include quantities
              like "2kg" or "dozen" for better accuracy. The AI will estimate expiration dates
              based on item types.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ItemPreviewTable items={parsedItems} onItemsChange={setParsedItems} />

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)} disabled={isAdding}>
                Back to Edit
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
    </>
  );
}
