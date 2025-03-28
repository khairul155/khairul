
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserSubscription {
  subscription_plan: string;
}

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserSubscription();
    }
  }, [user]);

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_credits');
      
      if (error) throw error;
      
      if (data) {
        const userData = data as UserSubscription;
        setCurrentPlan(userData.subscription_plan);
      }
    } catch (error) {
      console.error("Error fetching user subscription:", error);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  const plans = [
    {
      name: "Free",
      description: "For casual users",
      price: "0",
      currency: "৳",
      features: [
        "60 tokens/day",
        "Fast and Quality Image Generation",
        "Commercial License",
        "Unlimited Image Generation (Slow Credit)",
        "Ad-Free Experience",
        "No Watermarks",
      ],
      id: "free"
    },
    {
      name: "Basic",
      description: "For regular creators",
      price: "400",
      currency: "৳",
      features: [
        "3,400 tokens/month",
        "Fast, Quality, and Ultra Image Generation",
        "Commercial License",
        "Unlimited Image Generation (Slow Credit)",
        "Ad-Free Experience",
        "No Watermarks",
      ],
      id: "basic",
      popular: true
    },
    {
      name: "Advanced",
      description: "For professional creators",
      price: "750",
      currency: "৳",
      features: [
        "8,000 tokens/month",
        "Fast, Quality, and Ultra Image Generation",
        "Commercial License",
        "Unlimited Image Generation (Slow Credit)",
        "Ad-Free Experience",
        "No Watermarks",
      ],
      id: "advanced"
    },
    {
      name: "Pro",
      description: "For power users and teams",
      price: "1,200",
      currency: "৳",
      features: [
        "18,000 tokens/month",
        "Fast, Quality, and Ultra Image Generation",
        "Commercial License",
        "Unlimited Image Generation (Slow Credit)",
        "Ad-Free Experience",
        "No Watermarks",
      ],
      id: "pro"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-lg text-gray-400">
            Select the perfect plan that fits your creative needs
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative border ${
                plan.popular ? 'border-blue-500 bg-gray-900' : 'border-gray-700 bg-gray-900'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{plan.currency}{plan.price}</span>
                  {plan.id === 'free' ? (
                    <span className="text-gray-400 ml-1">forever</span>
                  ) : (
                    <span className="text-gray-400 ml-1">/month</span>
                  )}
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="text-green-500 w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {currentPlan === plan.id ? (
                  <Button className="w-full" variant="outline" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleGetStarted}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {!user ? "Sign Up" : "Upgrade"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 max-w-3xl mx-auto text-center bg-gray-900 rounded-lg p-6 border border-gray-800">
          <div className="flex items-center justify-center mb-4">
            <Zap className="text-yellow-400 w-6 h-6 mr-2" />
            <h2 className="text-xl font-bold">Need More Tokens?</h2>
          </div>
          <p className="text-gray-400 mb-4">
            For enterprise needs or custom token packages, please contact our sales team.
          </p>
          <Button variant="outline">Contact Sales</Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
