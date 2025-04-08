
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCredits } from "@/types/userCredits";
import { Loader2, Crown } from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchUserCredits = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_credits', { user_id: user.id });

        if (error) {
          console.error("Error fetching user credits:", error);
          return;
        }

        setUserCredits(data as UserCredits);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCredits();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isPremium = userCredits?.subscription_plan === "premium";

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        ) : (
          <>
            <Card className="mb-8 bg-[#1A1A1A] border-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  Your Subscription
                  {isPremium && <Crown className="ml-2 h-5 w-5 text-yellow-500" />}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Current plan and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400">Current Plan</p>
                    <p className="text-xl font-medium capitalize">
                      {userCredits?.subscription_plan || "Free"}
                    </p>
                  </div>
                  
                  {userCredits?.subscription_plan === "premium" ? (
                    <div>
                      <p className="text-gray-400">Benefits</p>
                      <ul className="list-disc pl-5 text-gray-300">
                        <li>Unlimited image generations</li>
                        <li>Priority processing</li>
                        <li>Advanced generation options</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400">Daily Credits</p>
                        <p className="text-xl font-medium">
                          {userCredits?.daily_credits && userCredits?.credits_used_today
                            ? `${userCredits.daily_credits - userCredits.credits_used_today} / ${userCredits.daily_credits}`
                            : "0 / 0"}
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate("/pricing")}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
                      >
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8 bg-[#1A1A1A] border-gray-800 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="text-xl font-medium">{user?.email || "Not available"}</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
