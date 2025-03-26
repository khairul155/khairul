
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

export function UserCredits() {
  const { user, credits, isCreditsLoading } = useAuth();
  
  if (!user) return null;
  
  if (isCreditsLoading) {
    return <Skeleton className="h-6 w-16" />;
  }

  // Get plan and credits from the auth context
  const plan = credits?.subscription_plan || 'free';
  const remaining = credits?.remaining_credits !== undefined ? credits.remaining_credits : 60;

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={plan === 'free' ? "outline" : "default"} className="px-2 py-1">
        {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
      </Badge>
      <span className="font-medium">
        {remaining} tokens
      </span>
    </div>
  );
}
