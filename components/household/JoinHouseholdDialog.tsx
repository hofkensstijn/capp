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
import { UserPlus, Loader2 } from "lucide-react";

interface JoinHouseholdDialogProps {
  userId: Id<"users">;
  trigger?: React.ReactNode;
}

export function JoinHouseholdDialog({ userId, trigger }: JoinHouseholdDialogProps) {
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const joinHousehold = useMutation(api.households.join);
  const { toast } = useToast();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinHousehold({
        userId,
        inviteCode: inviteCode.trim(),
      });
      toast({
        title: "Joined household!",
        description: `You've joined "${result.householdName}"`,
      });
      setInviteCode("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join household",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Join Household
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Household</DialogTitle>
          <DialogDescription>
            Enter the invite code shared by a household member to join their household.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="font-mono text-center text-lg tracking-widest"
              maxLength={8}
              autoComplete="off"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Ask a household member for their invite code
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isJoining}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isJoining || inviteCode.length < 8}>
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Household"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
