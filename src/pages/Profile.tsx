
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import UserCredits from "@/components/UserCredits";
import { Button } from "@/components/ui/button";
import { User, Settings, History, CreditCard, Coins, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, credits, refreshCredits } = useAuth();
  const [plan, setPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const handleRefreshCredits = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await refreshCredits();
      toast({
        title: "Success",
        description: "Credits refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing credits:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_plan')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error);
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
    
    // Set up real-time subscription to profile changes
    const channel = supabase
      .channel('profile-changes-page')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles', 
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile updated in page:', payload);
          if (payload.new && payload.new.subscription_plan) {
            setPlan(payload.new.subscription_plan);
            // Also refresh credits when plan changes
            refreshCredits();
            toast({
              title: "Subscription Updated",
              description: `Your plan has been updated to ${payload.new.subscription_plan}`,
            });
          }
        }
      )
      .subscribe();
    
    // Also setup a subscription to user_credits changes
    const creditsChannel = supabase
      .channel('profile-user-credits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('User credits updated in profile page:', payload);
          // Refresh credits when they change
          refreshCredits();
        }
      )
      .subscribe();
    
    // Refresh credits on page load
    if (user) {
      refreshCredits();
    }
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(creditsChannel);
    };
  }, [user, toast, refreshCredits]);

  const getPlanDetails = () => {
    switch (plan) {
      case 'basic':
        return {
          name: 'Basic Plan',
          tokensPerDay: 150,
          color: 'bg-blue-600'
        };
      case 'advanced':
        return {
          name: 'Advanced Plan',
          tokensPerDay: 300,
          color: 'bg-purple-600'
        };
      case 'pro':
        return {
          name: 'Pro Plan',
          tokensPerDay: 600,
          color: 'bg-yellow-600'
        };
      default:
        return {
          name: 'Free Plan',
          tokensPerDay: 60,
          color: 'bg-gray-600'
        };
    }
  };
  
  const planDetails = getPlanDetails();

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
                    <p className="text-sm text-gray-400 capitalize">{planDetails.name}</p>
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Account Information</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshCredits}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh Credits
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Email</h3>
                  <p className="text-lg">{user?.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg capitalize">
                        <span className={`inline-block w-3 h-3 rounded-full ${planDetails.color} mr-2`}></span>
                        {planDetails.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {plan === 'free' ? 
                          'Tokens reset daily at midnight (UTC+6 BST)' : 
                          'Tokens reset monthly based on your billing cycle'}
                      </p>
                    </div>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link to="/pricing">Upgrade</Link>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Token Allowance</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <p className="text-lg">{planDetails.tokensPerDay} tokens per day</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Current balance: {credits} tokens</p>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg mt-6">
                  <h3 className="text-sm font-bold mb-2">Plan Benefits</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span> 
                      {plan === 'free' ? '60 tokens per day' : `${planDetails.tokensPerDay} tokens per day`}
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">✓</span> 
                      Image generation (4 tokens per image)
                    </li>
                    {plan !== 'free' && (
                      <>
                        <li className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span> 
                          Priority processing
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span> 
                          {plan === 'pro' ? 'Unlimited' : 'Extended'} metadata generation
                        </li>
                      </>
                    )}
                  </ul>
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
