
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Coins, Clock } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const UserCredits = () => {
  const { userCredits } = useAuth();
  
  // Determine which credits to show based on subscription plan
  const isFree = userCredits.subscription_plan === 'free';
  const maxCredits = isFree ? userCredits.daily_credits : userCredits.monthly_credits;
  const usedCredits = isFree ? userCredits.credits_used_today : userCredits.credits_used_this_month;
  const remainingCredits = Math.max(0, maxCredits - usedCredits);
  const percentUsed = maxCredits > 0 ? (usedCredits / maxCredits) * 100 : 0;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Your Credits
        </CardTitle>
        <CardDescription>
          {isFree ? "Daily" : "Monthly"} credit usage for your {userCredits.subscription_plan} plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {usedCredits} / {maxCredits} tokens used
            </span>
            <span className="text-sm text-muted-foreground">
              {remainingCredits} remaining
            </span>
          </div>
          
          <Progress value={percentUsed} className="h-2" />
          
          {isFree && (
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Clock className="h-4 w-4 mr-1" />
              <span>Resets daily at midnight</span>
            </div>
          )}
          
          {userCredits.slow_mode_enabled && (
            <div className="text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-2 rounded-md">
              Slow mode enabled: You've used all your credits for this period.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCredits;
