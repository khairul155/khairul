import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import UserCredits from "@/components/UserCredits";
import { Button } from "@/components/ui/button";
import { User, Settings, History, CreditCard, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define an interface for the payload data structure
interface UserSubscriptionData {
  subscription_plan: string;
}

const Profile = () => {
  const { user, credits } = useAuth();
  const [subscription, setSubscription] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_credits')
          .select('subscription_plan')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
        
        if (data) {
          console.log("Profile subscription data:", data);
          setSubscription(data.subscription_plan);
        }
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
    
    // Set up real-time subscription for plan changes
    if (user) {
      console.log("Setting up realtime subscription in Profile for user", user.id);
      const channel = supabase
        .channel('profile-subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Subscription updated in Profile:', payload);
            // Properly type the payload.new to avoid TypeScript errors
            if (payload.new) {
              const newData = payload.new as UserSubscriptionData;
              if (newData.subscription_plan && newData.subscription_plan !== subscription) {
                setSubscription(newData.subscription_plan);
                toast({
                  title: "Subscription Updated",
                  description: `Your plan has been updated to ${newData.subscription_plan.charAt(0).toUpperCase() + newData.subscription_plan.slice(1)}`,
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("Profile subscription status:", status);
        });
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, toast, subscription]);

  const getSubscriptionName = (plan) => {
    const names = {
      'free': 'Free Plan',
      'basic': 'Basic Plan',
      'advanced': 'Advanced Plan',
      'pro': 'Pro Plan'
    };
    return names[plan] || 'Free Plan';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Account</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-medium">{user?.email}</h3>
                    <p className="text-sm text-gray-400">
                      {isLoading ? 'Loading...' : getSubscriptionName(subscription)}
                    </p>
                  </div>
                </div>
                
                <UserCredits />
              </div>
              
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <ul className="divide-y divide-gray-800">
                  <li>
                    <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <User className="h-5 w-5 text-gray-400" />
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <span>Subscription</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <History className="h-5 w-5 text-gray-400" />
                      <span>History</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <span>Settings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Main content */}
            <div className="md:col-span-2 bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold mb-6">Account Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Email</h3>
                  <p className="text-lg">{user?.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg">
                      {isLoading ? 'Loading...' : getSubscriptionName(subscription)}
                    </p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link to="/pricing">Upgrade</Link>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Token Balance</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <p className="text-lg">{credits} tokens</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {subscription === 'free' ? 
                      'Free tokens reset daily at 00:00 (UTC+6 BST)' : 
                      'Tokens reset monthly based on your billing cycle'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
