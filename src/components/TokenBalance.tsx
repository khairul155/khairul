
import React from 'react';
import { useCreditsContext } from './CreditsProvider';
import { Coins } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export function TokenBalance() {
  const { credits, loading, error } = useCreditsContext();
  
  const formatNumber = (num: number) => {
    return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();
  };

  if (error) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-700 bg-red-900/30">
        <Coins className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium text-red-500">Error</span>
      </div>
    );
  }

  if (loading) {
    return <Skeleton className="h-9 w-20 rounded-md" />;
  }

  const remaining = credits.remaining_credits;
  const total = credits.total_credits;
  const usagePercentage = Math.floor((remaining / total) * 100);
  
  // Determine color based on remaining credits percentage
  const getColorClass = () => {
    if (usagePercentage > 60) return "text-green-500";
    if (usagePercentage > 30) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-700 bg-gray-800 cursor-help">
            <Coins className={`h-4 w-4 ${getColorClass()}`} />
            <span className={`text-sm font-medium ${getColorClass()}`}>
              {formatNumber(remaining)}/{formatNumber(total)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-72">
          <div className="space-y-2">
            <div className="font-semibold">Token Balance</div>
            <p className="text-sm text-muted-foreground">
              {credits.subscription_plan === 'free' 
                ? `You have ${remaining} out of ${total} daily tokens remaining.` 
                : `You have ${remaining} out of ${total} monthly tokens remaining.`}
            </p>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full ${usagePercentage > 60 ? 'bg-green-500' : usagePercentage > 30 ? 'bg-amber-500' : 'bg-red-500'}`} 
                style={{ width: `${Math.max(usagePercentage, 2)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {credits.subscription_plan === 'free' 
                ? "Tokens reset daily at UTC+0" 
                : "Tokens reset monthly on the 1st at UTC+0"}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
