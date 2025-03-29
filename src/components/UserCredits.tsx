
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserCreditsData {
  subscription_plan: string;
  daily_limit: number;
  credits_used_today: number;
}

const UserCredits = () => {
  const { credits, dailyLimit, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState('free');
  const [displayCredits, setDisplayCredits] = useState(credits);
  const { toast } = useToast();
  
  // Always refetch credits from AuthProvider when they might change
  useEffect(() => {
    setDisplayCredits(credits);
    console.log("Credits updated in UserCredits:", credits);
  }, [credits]);
  
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching subscription for user ID:", user.id);
        const { data, error } = await supabase.functions.invoke('get-user-credits', {
          body: { userId: user.id }
        });
        
        if (error) {
          console.error("Error fetching user subscription:", error);
          return;
        }
        
        if (data) {
          console.log("Subscription data received:", data);
          setSubscription(data.plan || 'free');
          
          // Update displayed credits based on subscription plan
          setDisplayCredits(data.credits || 0);
        }
      } catch (error) {
        console.error("Error in fetchUserSubscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSubscription();
    
    // Set up real-time subscription for plan changes
    if (user) {
      console.log("Setting up realtime subscription for user", user.id);
      const channel = supabase
        .channel('credits-subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Subscription changed in UserCredits:', payload);
            // Properly type the payload.new to avoid TypeScript errors
            const newData = payload.new as UserCreditsData;
            
            if (newData) {
              const oldSubscription = subscription;
              setSubscription(newData.subscription_plan);
              
              // When plan changes, show a notification
              if (newData.subscription_plan !== oldSubscription) {
                toast({
                  title: "Subscription Updated",
                  description: `Your plan has been updated to ${newData.subscription_plan.charAt(0).toUpperCase() + newData.subscription_plan.slice(1)}`,
                });
              }
              
              // Update displayed credits
              const availableCredits = newData.daily_limit - newData.credits_used_today;
              console.log("Updated daily credits:", availableCredits);
              setDisplayCredits(availableCredits);
            }
          }
        )
        .subscribe((status) => {
          console.log("Subscription status:", status);
        });
        
      return () => {
        console.log("Removing realtime subscription");
        supabase.removeChannel(channel);
      };
    }
  }, [user, toast, subscription]);
  
  // Get token reset text
  const getTokenResetText = () => {
    return "Free tokens reset daily at 00:00 (UTC)"; 
  };
  
  // Get proper tokens for display
  const getTokenDisplay = () => {
    if (isLoading) return "...";
    return displayCredits;
  };

  // Get subscription display text
  const getSubscriptionDisplay = () => {
    if (subscription === 'free') return "1 image per day";
    if (subscription === 'basic') return "2 images per day";
    if (subscription === 'advanced') return "3 images per day";
    return "1 image per day";
  };
  
  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-full">
          <Coins className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">Your Daily Limit</h3>
          <p className="text-2xl font-bold text-white">{getTokenDisplay()} / {dailyLimit}</p>
          <p className="text-xs text-gray-400 mt-1">
            {getTokenResetText()}
          </p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>{getSubscriptionDisplay()}</p>
        {subscription !== 'free' && (
          <p className="mt-1 text-green-400">
            {subscription.charAt(0).toUpperCase() + subscription.slice(1)} Plan Active
          </p>
        )}
      </div>
    </Card>
  );
};

export default UserCredits;
