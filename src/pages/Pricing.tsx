
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckIcon, XIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  tokens: string;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  planKey: string;
  popular?: boolean;
}

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchUserPlan();
    }
  }, [user]);

  const fetchUserPlan = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_credits');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setCurrentPlan(data.subscription_plan);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    }
  };

  const handlePurchase = async (planKey: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase a plan",
      });
      navigate("/auth");
      return;
    }

    if (planKey === currentPlan) {
      toast({
        title: "Already subscribed",
        description: `You are already subscribed to the ${planKey} plan.`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // For demo purposes - this would typically go to a payment page
      toast({
        title: "Demo Mode",
        description: "In a production app, this would redirect to a payment page. Admin can upgrade users manually.",
      });
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pricingTiers: PricingTier[] = [
    {
      name: "Free",
      price: "0",
      description: "For casual users",
      tokens: "60 tokens/day",
      planKey: "free",
      features: [
        { name: "Commercial License", included: true },
        { name: "Image Generation Mode (Fast and Quality)", included: true },
        { name: "Unlimited Image Generation (Slow Credit)", included: true },
        { name: "Ad-Free Experience", included: true },
        { name: "No Watermark", included: true },
      ],
    },
    {
      name: "Basic",
      price: "400",
      description: "For enthusiasts",
      tokens: "3,400 tokens/month",
      planKey: "basic",
      popular: true,
      features: [
        { name: "Commercial License", included: true },
        { name: "Image Generation Mode (Fast, Quality, and Ultra)", included: true },
        { name: "Unlimited Image Generation (Slow Credit)", included: true },
        { name: "Ad-Free Experience", included: true },
        { name: "No Watermark", included: true },
      ],
    },
    {
      name: "Advanced",
      price: "750",
      description: "For professionals",
      tokens: "8,000 tokens/month",
      planKey: "advanced",
      features: [
        { name: "Commercial License", included: true },
        { name: "Image Generation Mode (Fast, Quality, and Ultra)", included: true },
        { name: "Unlimited Image Generation (Slow Credit)", included: true },
        { name: "Ad-Free Experience", included: true },
        { name: "No Watermark", included: true },
      ],
    },
    {
      name: "Pro",
      price: "1,200",
      description: "For enterprises",
      tokens: "18,000 tokens/month",
      planKey: "pro",
      features: [
        { name: "Commercial License", included: true },
        { name: "Image Generation Mode (Fast, Quality, and Ultra)", included: true },
        { name: "Unlimited Image Generation (Slow Credit)", included: true },
        { name: "Ad-Free Experience", included: true },
        { name: "No Watermark", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-28 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the plan that fits your creative needs, with no hidden fees
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.planKey}
              className={`relative overflow-hidden rounded-xl border ${
                tier.popular 
                  ? "border-blue-500 shadow-lg shadow-blue-500/20" 
                  : "border-gray-800 bg-gray-900/50"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                  Popular
                </div>
              )}
              
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-gray-400 mb-4">{tier.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-gray-400 ml-1">Taka</span>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center p-2 bg-gray-800/50 rounded-lg mb-2">
                    <div className="font-semibold text-blue-400">{tier.tokens}</div>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      {feature.included ? (
                        <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
                      ) : (
                        <XIcon className="h-5 w-5 text-red-400 mr-2" />
                      )}
                      <span className={feature.included ? "text-gray-200" : "text-gray-500"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    tier.popular 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : tier.planKey === currentPlan
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-700 hover:bg-gray-600"
                  }`}
                  disabled={isLoading || tier.planKey === currentPlan}
                  onClick={() => handlePurchase(tier.planKey)}
                >
                  {tier.planKey === currentPlan 
                    ? "Current Plan" 
                    : `Upgrade to ${tier.name}`}
                </Button>
                
                {tier.planKey === currentPlan && (
                  <p className="text-center text-green-400 text-sm mt-2">
                    Your current plan
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">
            All plans include basic features. Upgrade anytime to unlock more tokens and capabilities.
          </p>
          <p className="text-gray-500 text-sm">
            Prices are in Bangladeshi Taka (BDT).
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
