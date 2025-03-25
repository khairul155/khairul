
import { useCredits } from "@/hooks/use-credits";
import { Coins, Zap, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface CreditsDisplayProps {
  className?: string;
  showWarning?: boolean;
  iconSize?: number;
  compact?: boolean;
  showUpgradeButton?: boolean;
}

const CreditsDisplay = ({ 
  className = "", 
  showWarning = true, 
  iconSize = 4,
  compact = false,
  showUpgradeButton = true
}: CreditsDisplayProps) => {
  const { credits, isLoading } = useCredits();

  if (isLoading || !credits) {
    return null;
  }

  // Calculate remaining credits based on subscription plan
  const remainingCredits = credits.subscription_plan === 'free'
    ? credits.daily_credits - credits.credits_used_today
    : credits.monthly_credits - credits.credits_used_this_month;

  const totalCredits = credits.subscription_plan === 'free'
    ? credits.daily_credits
    : credits.monthly_credits;

  // Determine if credits are low (less than 10% remaining)
  const isLowCredits = remainingCredits < totalCredits * 0.1;

  // Format plan name
  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // If compact mode is enabled, show a simplified version
  if (compact) {
    return (
      <Link
        to="/pricing"
        className={`flex items-center rounded-lg p-2 transition-colors hover:bg-gray-800 ${className}`}
      >
        {credits.slow_mode_enabled ? (
          <Zap className={`h-4 w-4 text-amber-500 mr-1.5`} />
        ) : (
          <Coins className={`h-4 w-4 text-yellow-500 mr-1.5`} />
        )}
        <span className={`text-sm font-medium ${isLowCredits ? 'text-red-400' : 'text-white'}`}>
          {remainingCredits.toLocaleString()}
        </span>
        {showWarning && isLowCredits && (
          <AlertCircle className="h-3 w-3 ml-1 text-red-400" />
        )}
      </Link>
    );
  }

  return (
    <Link
      to="/pricing"
      className={`flex flex-col items-center space-y-1 rounded-lg p-2.5 transition-colors hover:bg-gray-800 ${className}`}
    >
      <div className="flex items-center">
        {credits.slow_mode_enabled ? (
          <Zap className={`h-${iconSize} w-${iconSize} text-amber-500 mr-1.5`} />
        ) : (
          <Coins className={`h-${iconSize} w-${iconSize} text-yellow-500 mr-1.5`} />
        )}
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">
            {formatPlanName(credits.subscription_plan)} Plan
          </span>
          <div className="flex items-center">
            <span className={`font-medium ${isLowCredits ? 'text-red-400' : 'text-white'}`}>
              {remainingCredits.toLocaleString()} / {totalCredits.toLocaleString()}
            </span>
            {showWarning && isLowCredits && (
              <AlertCircle className="h-3 w-3 ml-1.5 text-red-400" />
            )}
          </div>
        </div>
      </div>
      {showWarning && isLowCredits && showUpgradeButton && (
        <span className="text-xs text-red-400">Running low! Upgrade?</span>
      )}
    </Link>
  );
};

export default CreditsDisplay;
