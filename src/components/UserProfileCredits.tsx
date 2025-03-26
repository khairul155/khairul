
import { useAuth } from "./AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";

export function UserProfileCredits() {
  const { user, credits, isCreditsLoading } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Please sign in</CardTitle>
          <CardDescription>Sign in to view your credits and plan</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isCreditsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Plan</CardTitle>
          <CardDescription>Loading your subscription information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </CardContent>
      </Card>
    );
  }

  // Default to free plan if no data
  const plan = credits?.subscription_plan || 'free';
  const isFree = plan === 'free';
  const remaining = credits?.remaining_credits || 60;
  const total = isFree ? credits?.daily_credits || 60 : credits?.monthly_credits || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Plan</CardTitle>
          <Badge variant={isFree ? "outline" : "default"}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
        </div>
        <CardDescription>
          {isFree 
            ? "You're on the free plan with daily credit limits" 
            : `You're subscribed to the ${plan} plan`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">Credits Available</h3>
          <p className="text-2xl font-bold">
            {remaining} <span className="text-sm font-normal text-muted-foreground">/ {total} tokens</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isFree 
              ? "Resets daily at midnight" 
              : "Resets monthly on billing date"}
          </p>
        </div>
        
        {isFree && (
          <Button asChild className="w-full">
            <Link to="/pricing">Upgrade Plan</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
