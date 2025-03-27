
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const UserCredits = () => {
  const { credits, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Query the profiles table with subscription_plan
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Could not fetch user profile data",
            variant: "destructive",
          });
          setIsLoading(false);
        } else if (data && data.subscription_plan) {
          console.log("User subscription plan:", data.subscription_plan);
          setPlan(data.subscription_plan);
          setIsLoading(false);
        } else {
          console.log("No profile data found, using default free plan");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Exception fetching profile:", error);
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
    
    // Set up a realtime subscription to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles', 
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload);
          if (payload.new && payload.new.subscription_plan) {
            setPlan(payload.new.subscription_plan);
            toast({
              title: "Subscription Updated",
              description: `Your plan has been updated to ${payload.new.subscription_plan}`,
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
  
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
            {plan === 'free' ? 
              "Free tokens reset daily at 00:00 (UTC+6 BST)" : 
              "Tokens reset monthly based on billing cycle"}
          </p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>4 tokens = 1 image generation</p>
        <p className="mt-1">Current plan: <span className="capitalize">{plan}</span></p>
      </div>
    </Card>
  );
};

export default UserCredits;
