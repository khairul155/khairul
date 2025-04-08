
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCredits } from "@/types/userCredits";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Use type assertion to bypass TypeScript error
      const { data, error } = await (supabase
        .rpc('get_user_credits', { user_id: user.id }) as unknown as Promise<{ data: UserCredits | null, error: Error | null }>);

      if (error) {
        console.error("Error fetching user credits:", error);
        return;
      }

      const userCredits = data as UserCredits;
      setCurrentPlan(userCredits.subscription_plan);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upgrade your plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setUpgrading(true);
    try {
      // Use type assertion to bypass TypeScript error
      const { error } = await (supabase
        .rpc('upgrade_user_to_premium', { user_id: user.id }) as unknown as Promise<{ error: Error | null }>);

      if (error) throw error;

      // Update local state
      setCurrentPlan("premium");
      
      toast({
        title: "Upgrade successful!",
        description: "You now have access to unlimited image generations.",
      });
    } catch (error) {
      console.error("Error upgrading:", error);
      toast({
        title: "Upgrade failed",
        description: "There was a problem upgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user) return;

    setUpgrading(true);
    try {
      // Use type assertion to bypass TypeScript error
      const { error } = await (supabase
        .rpc('downgrade_user_to_free', { user_id: user.id }) as unknown as Promise<{ error: Error | null }>);

      if (error) throw error;

      // Update local state
      setCurrentPlan("free");
      
      toast({
        title: "Downgrade successful",
        description: "Your plan has been changed to Free.",
      });
    } catch (error) {
      console.error("Error downgrading:", error);
      toast({
        title: "Downgrade failed",
        description: "There was a problem downgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const isCurrentPlan = (plan: string) => currentPlan === plan;

  return (
    <div className="min-h-screen bg-[#0F0F0F] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-400">Choose the plan that's right for you</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Free Plan */}
            <Card className={`bg-[#1A1A1A] border ${isCurrentPlan("free") ? "border-blue-500" : "border-gray-800"} text-white relative overflow-hidden`}>
              {isCurrentPlan("free") && (
                <Badge className="absolute top-6 right-6 bg-blue-500 hover:bg-blue-600">Current Plan</Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">Free Plan</CardTitle>
                <CardDescription className="text-gray-400">Get started with basic features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-4xl font-bold">$0</p>
                  <p className="text-gray-400">Forever free</p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>5 image generations per day</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Standard quality</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Basic support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan("free") ? (
                  <Button disabled className="w-full bg-gray-700 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDowngrade}
                    disabled={upgrading} 
                    className="w-full bg-gray-700 hover:bg-gray-600"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Downgrading...
                      </>
                    ) : (
                      "Switch to Free"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className={`bg-[#1A1A1A] border ${isCurrentPlan("premium") ? "border-blue-500" : "border-gray-800"} text-white relative overflow-hidden`}>
              {isCurrentPlan("premium") && (
                <Badge className="absolute top-6 right-6 bg-blue-500 hover:bg-blue-600">Current Plan</Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <CardDescription className="text-gray-400">For serious creators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-4xl font-bold">$19.99</p>
                  <p className="text-gray-400">per month</p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span><strong>Unlimited</strong> image generations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>High quality</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Advanced generation options</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan("premium") ? (
                  <Button disabled className="w-full bg-gray-700 cursor-not-allowed">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUpgrade}
                    disabled={upgrading} 
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Upgrading...
                      </>
                    ) : (
                      "Upgrade to Premium"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
