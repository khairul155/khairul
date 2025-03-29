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
  daily_limit: number;
  credits_used_today: number;
}

const Profile = () => {
  const { user, credits, dailyLimit } = useAuth();
  const [subscription, setSubscription] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [displayCredits, setDisplayCredits] = useState(credits);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_credits')
          .select('subscription_plan, daily_limit, credits_used_today')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
        
        if (data) {
          console.log("Profile subscription data:", data);
          setSubscription(data.subscription_plan);
          
          // Set the correct credits display based on subscription plan
          setDisplayCredits(data.daily_limit - data.credits_used_today);
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
                
                // Update displayed credits based on plan
                setDisplayCredits(newData.daily_limit - newData.credits_used_today);
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

  const updateSubscription = async (newPlan: 'free' | 'basic' | 'advanced') => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Call Supabase function to update the user's subscription
      const { error } = await supabase.rpc('update_user_subscription', {
        _user_id: user.id,
        _subscription_plan: newPlan
      });
      
      if (error) {
        console.error("Error updating subscription:", error);
        toast({
          title: "Error",
          description: "Failed to update subscription. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Subscription Updated",
        description: `Your plan has been changed to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}`,
      });
      
      // The real-time subscription will update the UI automatically
    } catch (error) {
      console.error("Error in updateSubscription:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating your subscription.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSubscriptionName = (plan: string) => {
    const names = {
      'free': 'Free Plan (1 image/day)',
      'basic': 'Basic Plan (2 images/day)',
      'advanced': 'Advanced Plan (3 images/day)'
    };
    return names[plan] || 'Free Plan (1 image/day)';
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
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Daily Image Limit</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <p className="text-lg">{displayCredits} of {dailyLimit} remaining today</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Free tokens reset daily at 00:00 (UTC)
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Change Subscription</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => updateSubscription('free')}
                      disabled={isUpdating || subscription === 'free'}
                      variant={subscription === 'free' ? "default" : "outline"}
                      className={subscription === 'free' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Free (1/day)
                    </Button>
                    <Button
                      onClick={() => updateSubscription('basic')}
                      disabled={isUpdating || subscription === 'basic'}
                      variant={subscription === 'basic' ? "default" : "outline"}
                      className={subscription === 'basic' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Basic (2/day)
                    </Button>
                    <Button
                      onClick={() => updateSubscription('advanced')}
                      disabled={isUpdating || subscription === 'advanced'}
                      variant={subscription === 'advanced' ? "default" : "outline"}
                      className={subscription === 'advanced' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      Advanced (3/day)
                    </Button>
                  </div>
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
