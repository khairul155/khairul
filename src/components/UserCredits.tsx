
import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { toast } from "sonner";

export function UserCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    async function fetchCredits() {
      try {
        setLoading(true);
        
        // First try to get from the user_credits function
        const { data: userData, error: functionError } = await supabase.rpc('get_user_credits');
        
        if (!functionError && userData) {
          // Parse data safely with type checking
          const planType = typeof userData.subscription_plan === 'string' ? userData.subscription_plan : 'free';
          
          // Set credits based on subscription plan
          if (planType === 'free') {
            // For free plan, show daily credits
            const dailyCredits = typeof userData.daily_credits === 'number' ? userData.daily_credits : 60;
            const usedToday = typeof userData.credits_used_today === 'number' ? userData.credits_used_today : 0;
            setCredits(dailyCredits - usedToday);
            setPlan('free');
          } else {
            // For paid plans, show monthly credits
            const monthlyCredits = typeof userData.monthly_credits === 'number' ? userData.monthly_credits : 0;
            const usedThisMonth = typeof userData.credits_used_this_month === 'number' ? userData.credits_used_this_month : 0;
            setCredits(monthlyCredits - usedThisMonth);
            setPlan(planType);
          }
          setLoading(false);
          return;
        }
        
        // Fallback to direct query if function fails
        const { data: creditsData, error: creditsError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (creditsError) {
          console.error('Error fetching credits:', creditsError);
          // Show default credits for free plan if we can't fetch
          setCredits(60);
          setPlan('free');
        } else if (creditsData) {
          if (creditsData.subscription_plan === 'free') {
            setCredits(creditsData.daily_credits - creditsData.credits_used_today);
          } else {
            setCredits(creditsData.monthly_credits - creditsData.credits_used_this_month);
          }
          setPlan(creditsData.subscription_plan);
        }
      } catch (error) {
        console.error('Error:', error);
        // Default fallback
        setCredits(60);
        setPlan('free');
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, [user]);

  if (!user) return null;
  
  if (loading) {
    return <Skeleton className="h-6 w-16" />;
  }

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={plan === 'free' ? "outline" : "default"} className="px-2 py-1">
        {plan && plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
      </Badge>
      <span className="font-medium">
        {credits !== null ? `${credits} tokens` : '60 tokens'}
      </span>
    </div>
  );
}
