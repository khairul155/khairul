
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "./AuthProvider";
import { Link, useNavigate } from "react-router-dom";
import { useCredits } from "@/hooks/use-credits";
import { Coins } from "lucide-react";

const UserNav = () => {
  const { user, signOut } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <Button variant="outline" asChild>
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  // Extract user initials for the avatar fallback
  const getInitials = () => {
    if (!user.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  // Calculate remaining credits
  const getRemainingCredits = () => {
    if (!credits) return null;
    
    if (credits.subscription_plan === 'free') {
      return credits.daily_credits - credits.credits_used_today;
    } else {
      return credits.monthly_credits - credits.credits_used_this_month;
    }
  };

  const getMaxCredits = () => {
    if (!credits) return null;
    
    if (credits.subscription_plan === 'free') {
      return credits.daily_credits;
    } else {
      return credits.monthly_credits;
    }
  };

  // Format plan name to capitalize first letter
  const formatPlanName = (plan) => {
    if (!plan) return '';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url || ""} alt="User" />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {credits && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium">
                  Plan: {formatPlanName(credits.subscription_plan)}
                </p>
                <div className="flex items-center text-xs mt-1">
                  <Coins className="h-3 w-3 mr-1 text-yellow-500" />
                  <span className={getRemainingCredits() < getMaxCredits() * 0.1 ? "text-red-500" : ""}>
                    Credits: {getRemainingCredits()}/{getMaxCredits()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/pricing" className="cursor-pointer">
            Pricing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
