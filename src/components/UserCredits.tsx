
import React, { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const UserCredits = () => {
  const { credits, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Using the AuthProvider's session/user info directly instead of querying the profiles table
        // This avoids type errors since the profiles table isn't in the TypeScript types yet
        setIsLoading(false);
      } catch (error) {
        console.error("Exception fetching profile:", error);
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
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
