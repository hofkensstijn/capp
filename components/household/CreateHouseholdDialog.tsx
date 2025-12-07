"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Home, Loader2 } from "lucide-react";

interface CreateHouseholdDialogProps {
  userId: Id<"users">;
  userName?: string;
  trigger?: React.ReactNode;
}

export function CreateHouseholdDialog({ userId, userName, trigger }: CreateHouseholdDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(userName ? `${userName}'s Household` : "My Household");
  const [isCreating, setIsCreating] = useState(false);

  const createHousehold = useMutation(api.households.create);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a household name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createHousehold({
        userId,
        name: name.trim(),
      });
      toast({
        title: "Household created!",
        description: `Share your invite code: ${result.inviteCode}`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create household",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Create Household
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Household</DialogTitle>
          <DialogDescription>
            Create a new household to share your pantry, recipes, and shopping list with family or roommates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="household-name">Household Name</Label>
            <Input
              id="household-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Smith Family, Apt 4B"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Household"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
