
import React, { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

const UserCredits = () => {
  const { user, credits } = useAuth();
  const [planName, setPlanName] = useState('Free Plan');
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const userProfileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(userProfileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          const planNames = {
            'free': 'Free Plan',
            'basic': 'Basic Plan',
            'advanced': 'Advanced Plan',
            'pro': 'Pro Plan'
          };
          
          setPlanName(planNames[profileData.subscription_plan] || 'Free Plan');
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
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
          <p className="text-2xl font-bold text-white">{credits}</p>
          <p className="text-xs text-gray-400 mt-1">
            {planName === 'Free Plan' 
              ? 'Free tokens reset daily at 00:00 (UTC+6 BST)'
              : 'Tokens reset monthly based on your billing cycle'}
          </p>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>4 tokens = 1 image generation</p>
      </div>
    </Card>
  );
};

export default UserCredits;
