
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const UserCredits = () => {
  const { user, credits } = useAuth();
  const [plan, setPlan] = useState('free');
  const [resetTime, setResetTime] = useState('');
  
  useEffect(() => {
    if (!user) return;
    
    const fetchCreditDetails = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-user-credits', {
          body: { userId: user.id }
        });
        
        if (error) {
          console.error("Error fetching credit details:", error);
          return;
        }
        
        if (data) {
          setPlan(data.plan || 'free');
          setResetTime(data.resetDate || '');
        }
      } catch (error) {
        console.error("Error in fetchCreditDetails:", error);
      }
    };
    
    fetchCreditDetails();
  }, [user]);
  
  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-full">
          <Coins className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-200">Your Tokens</h3>
          <p className="text-2xl font-bold text-white">{credits}</p>
          <p className="text-xs text-gray-400 mt-1">
            {plan === 'free' 
              ? "Free tokens reset daily at 00:00 UTC" 
              : "Premium subscription active"}
          </p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>1 token = 1 image generation</p>
      </div>
    </Card>
  );
};

export default UserCredits;
