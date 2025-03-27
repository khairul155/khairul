
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const UserCredits = () => {
  const { credits, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState('free');
  
  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_credits')
          .select('subscription_plan')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user subscription:", error);
          return;
        }
        
        if (data) {
          setSubscription(data.subscription_plan);
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
      const channel = supabase
        .channel('credits-subscription-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Subscription updated in UserCredits:', payload);
            if (payload.new && payload.new.subscription_plan) {
              setSubscription(payload.new.subscription_plan);
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-full">
          <Coins className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">Your Tokens</h3>
          <p className="text-2xl font-bold text-white">{isLoading ? "..." : credits}</p>
          <p className="text-xs text-gray-400 mt-1">
            {subscription === 'free' 
              ? "Free tokens reset daily at 00:00 (UTC+6 BST)" 
              : "Tokens reset monthly based on your billing cycle"}
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
