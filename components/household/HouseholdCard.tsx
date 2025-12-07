"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Home, Users, Copy, RefreshCw, LogOut, Crown, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface HouseholdCardProps {
  household: {
    _id: Id<"households">;
    name: string;
    inviteCode: string;
    createdBy: Id<"users">;
    members: Array<{
      _id: Id<"users">;
      name?: string;
      email: string;
      isCreator: boolean;
    }>;
  };
  userId: Id<"users">;
}

export function HouseholdCard({ household, userId }: HouseholdCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(household.name);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const updateName = useMutation(api.households.updateName);
  const regenerateCode = useMutation(api.households.regenerateInviteCode);
  const leaveHousehold = useMutation(api.households.leave);
  const { toast } = useToast();

  const isCreator = household.createdBy === userId;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateName = async () => {
    if (newName.trim() && newName !== household.name) {
      await updateName({ userId, name: newName.trim() });
      toast({
        title: "Updated",
        description: "Household name updated",
      });
    }
    setIsEditing(false);
  };

  const handleRegenerateCode = async () => {
    setIsRegenerating(true);
    try {
      await regenerateCode({ userId });
      toast({
        title: "New code generated",
        description: "Share this new code with your household members",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate invite code",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLeave = async () => {
    if (confirm("Are you sure you want to leave this household? You'll need an invite code to rejoin.")) {
      try {
        const result = await leaveHousehold({ userId });
        toast({
          title: "Left household",
          description: result.householdDeleted
            ? "The household has been deleted as you were the last member"
            : "You have left the household",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to leave household",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Home className="h-5 w-5 text-primary" />
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateName();
                    if (e.key === "Escape") {
                      setNewName(household.name);
                      setIsEditing(false);
                    }
                  }}
                />
                <Button size="sm" variant="ghost" onClick={handleUpdateName}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{household.name}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit household name"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {household.members.length} member{household.members.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <CardDescription>
          Share your pantry, recipes, and shopping list with your household
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Code Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Invite Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-2 font-mono text-lg tracking-widest text-center">
              {household.inviteCode}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              aria-label="Copy invite code"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              aria-label="Generate new invite code"
            >
              <RefreshCw className={cn("h-4 w-4", isRegenerating && "animate-spin")} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this code with people you want to invite to your household
          </p>
        </div>

        {/* Members Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Members</label>
          <div className="space-y-2">
            {household.members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-background rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium border">
                    {(member.name || member.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                {member.isCreator && (
                  <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                )}
                {member._id === userId && !member.isCreator && (
                  <Badge variant="secondary">You</Badge>
                )}
                {member._id === userId && member.isCreator && (
                  <Badge variant="secondary">You</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Leave Button */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLeave}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave Household
          </Button>
          {isCreator && household.members.length > 1 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Ownership will be transferred to another member
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
