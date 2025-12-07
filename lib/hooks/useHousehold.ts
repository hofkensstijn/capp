"use client";

import { useQuery, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useHousehold(userId: Id<"users"> | undefined) {
  const [isEnsuring, setIsEnsuring] = useState(false);

  const household = useQuery(
    api.households.getMyHousehold,
    userId ? { userId } : "skip"
  );

  const ensureHousehold = useMutation(api.households.ensureHousehold);

  // Auto-create household for users who don't have one
  useEffect(() => {
    if (userId && household === null && !isEnsuring) {
      setIsEnsuring(true);
      ensureHousehold({ userId })
        .then(() => setIsEnsuring(false))
        .catch(() => setIsEnsuring(false));
    }
  }, [userId, household, ensureHousehold, isEnsuring]);

  return {
    household,
    householdId: household?._id,
    isLoading: household === undefined || isEnsuring,
    members: household?.members || [],
  };
}
