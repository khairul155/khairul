
import React from "react";
import { useCredits, formatCreditsDisplay } from "@/hooks/use-credits";
import { Coins, Hourglass } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CreditsDisplayProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ 
  compact = false,
  showUpgradeButton = true
}) => {
  const { credits, isLoading, getRemainingCredits } = useCredits();
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }
  
  if (!credits) {
    return null;
  }
  
  const remaining = getRemainingCredits();
  const isPaid = credits.subscription_plan !== 'free';
  
  // Determine the total credits based on subscription plan
  const totalCredits = isPaid ? credits.monthly_credits : credits.daily_credits;
  const usedCredits = isPaid ? credits.credits_used_this_month : credits.credits_used_today;
  
  // Calculate percentage for progress bar
  const percentage = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0;
  
  // Determine if credits are low (less than 10% remaining)
  const isLow = remaining !== null && remaining < totalCredits * 0.1;
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-1 cursor-help">
              {credits.slow_mode_enabled ? (
                <Hourglass className="h-4 w-4 text-amber-400" />
              ) : (
                <Coins className={`h-4 w-4 ${isLow ? 'text-red-400' : 'text-blue-400'}`} />
              )}
              <span className={`text-sm font-medium ${isLow ? 'text-red-400' : 'text-gray-200'}`}>
                {remaining ?? 0}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2 p-1">
              <p className="text-sm font-medium">
                {credits.slow_mode_enabled ? 'Slow Mode Active' : `${remaining ?? 0} credits remaining`}
              </p>
              <p className="text-xs text-gray-400">
                {isPaid ? 'Monthly' : 'Daily'} limit: {formatCreditsDisplay(usedCredits, totalCredits)}
              </p>
              {credits.slow_mode_enabled && (
                <p className="text-xs text-amber-400">
                  All monthly credits used. Operations will be slower.
                </p>
              )}
              {isLow && !credits.slow_mode_enabled && (
                <p className="text-xs text-red-400">
                  Credits running low!
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          {credits.slow_mode_enabled ? (
            <Hourglass className="h-5 w-5 text-amber-400" />
          ) : (
            <Coins className={`h-5 w-5 ${isLow ? 'text-red-400' : 'text-blue-400'}`} />
          )}
          <h3 className="font-medium text-white">Credits</h3>
        </div>
        <div className="text-sm text-gray-400">
          {isPaid ? 'Monthly' : 'Daily'} Plan: {credits.subscription_plan.toUpperCase()}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={isLow ? 'text-red-400 font-medium' : 'text-gray-300'}>
              {remaining} credits remaining
            </span>
            <span className="text-gray-400">
              {formatCreditsDisplay(usedCredits, totalCredits)}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className={cn("h-2 bg-gray-800", isLow ? "text-red-500" : "")} 
          />
        </div>
        
        {credits.slow_mode_enabled && (
          <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 text-amber-400">
            You're in slow mode. Operations will take longer to complete.
          </div>
        )}
        
        {isLow && !credits.slow_mode_enabled && (
          <div className="text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-400">
            You're running low on credits. Consider upgrading your plan for more.
          </div>
        )}
        
        {showUpgradeButton && (credits.subscription_plan === 'free' || isLow) && (
          <Button size="sm" className="w-full" asChild>
            <Link to="/pricing">
              Upgrade Plan
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreditsDisplay;
