
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, CreditCard, Zap, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UserCredits {
  subscription_plan: string;
  daily_credits: number;
  monthly_credits: number;
  credits_used_today: number;
  credits_used_this_month: number;
  remaining_credits: number;
  last_reset_date: string;
  next_reset_date: string | null;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<UserCredits | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchUserCredits();
    setupRealtimeSubscription();
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_credits');
      
      if (error) throw error;
      
      setCredits(data);
    } catch (error) {
      console.error("Error fetching user credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    const channel = supabase
      .channel('user_credits_changes')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          fetchUserCredits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatPlanName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">User ID</p>
                    <p className="font-medium text-xs truncate">{user.id}</p>
                  </div>
                  <div className="pt-2">
                    <Button variant="destructive" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-400" />
                  Subscription Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : credits ? (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                      <h3 className="text-xl font-bold text-blue-400">
                        {formatPlanName(credits.subscription_plan)} Plan
                      </h3>
                      {credits.subscription_plan !== 'free' && credits.next_reset_date && (
                        <p className="text-sm text-gray-400 mt-1 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Renews on {new Date(credits.next_reset_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => navigate("/pricing")}
                    >
                      View Plans
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-400">Unable to load subscription data</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Token Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : credits ? (
                <div>
                  {credits.subscription_plan === 'free' ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400">Daily Credits</span>
                          <span className="font-medium">
                            {credits.credits_used_today} / {credits.daily_credits} used
                          </span>
                        </div>
                        <Progress 
                          value={(credits.credits_used_today / credits.daily_credits) * 100} 
                          className="h-2"
                        />
                        <p className="text-sm text-gray-400 mt-2">
                          {credits.remaining_credits} credits remaining today
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-300">
                          Your credits reset daily. Upgrade to a paid plan for more tokens and monthly billing.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400">Monthly Credits</span>
                          <span className="font-medium">
                            {credits.credits_used_this_month} / {credits.monthly_credits} used
                          </span>
                        </div>
                        <Progress 
                          value={(credits.credits_used_this_month / credits.monthly_credits) * 100} 
                          className="h-2"
                        />
                        <p className="text-sm text-gray-400 mt-2">
                          {credits.remaining_credits} credits remaining this month
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">Unable to load credit information</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
