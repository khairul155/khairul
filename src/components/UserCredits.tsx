
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define an interface for the payload data structure
interface UserCreditsData {
  subscription_plan: string;
  daily_credits: number;
  monthly_credits: number;
}

const UserCredits = () => {
  const { credits, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState('free');
  const [displayCredits, setDisplayCredits] = useState(credits);
  const { toast } = useToast();
  
  useEffect(() => {
    // Update displayed credits when the auth context credits change
    setDisplayCredits(credits);
  }, [credits]);
  
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_credits')
          .select('subscription_plan, daily_credits, monthly_credits')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user subscription:", error);
          return;
        }
        
        if (data) {
          console.log("Subscription data received:", data);
          setSubscription(data.subscription_plan);
          
          // Update displayed credits based on subscription plan
          if (data.subscription_plan !== 'free') {
            // For paid plans, use monthly_credits
            setDisplayCredits(data.monthly_credits);
          } else {
            // For free plan, use daily_credits
            setDisplayCredits(data.daily_credits);
          }
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
            if (payload.new) {
              const newData = payload.new as UserCreditsData;
              setSubscription(newData.subscription_plan);
              
              // Update displayed credits based on new subscription plan
              if (newData.subscription_plan !== 'free') {
                toast({
                  title: "Subscription Updated",
                  description: `Your plan has been updated to ${newData.subscription_plan.charAt(0).toUpperCase() + newData.subscription_plan.slice(1)}`,
                });
                // For paid plans, use monthly_credits
                setDisplayCredits(newData.monthly_credits);
              } else {
                // For free plan, use daily_credits
                setDisplayCredits(newData.daily_credits);
              }
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
  }, [user, toast]);
  
  // Calculate token reset text based on subscription
  const getTokenResetText = () => {
    return subscription === 'free' 
      ? "Free tokens reset daily at 00:00 (UTC+6 BST)" 
      : "Tokens reset monthly based on your billing cycle";
  };
  
  // Get proper tokens for display based on subscription
  const getTokenDisplay = () => {
    if (isLoading) return "...";
    return displayCredits;
  };
  
  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-full">
          <Coins className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">Your Tokens</h3>
          <p className="text-2xl font-bold text-white">{getTokenDisplay()}</p>
          <p className="text-xs text-gray-400 mt-1">
            {getTokenResetText()}
          </p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>4 tokens = 1 image generation</p>
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
