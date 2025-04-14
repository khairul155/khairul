
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Check, Coins, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const pricingPlans = [{
  name: "Free",
  price: "0",
  currency: "Tk",
  description: "Basic access with daily limits",
  features: ["60 tokens/day", "10 Metadata Generator images/day", "10 Graphic Designer Bot prompts/day", "20 Image to Prompt images/day", "Fast & Quality mode", "Commercial license", "Ad-free experience"],
  popular: false,
  tokens: 60,
  buttonText: "Your Current Plan",
  buttonVariant: "outline" as const,
  planId: "free"
}, {
  name: "Basic",
  price: "400",
  currency: "Tk",
  description: "Good for occasional use",
  features: ["3,400 tokens/month (~113/day)", "2,500 Metadata Generator images/month", "1,000 Graphic Designer Bot prompts/month", "2,000 Image to Prompt images/month", "Fast, Quality & Ultra modes", "Unlimited prompt suggestions", "Commercial license"],
  popular: false,
  tokens: 3400,
  buttonText: "Get Basic",
  buttonVariant: "default" as const,
  planId: "basic"
}, {
  name: "Advanced",
  price: "750",
  currency: "Tk",
  description: "Perfect for regular creators",
  features: ["8,000 tokens/month (~267/day)", "4,500 Metadata Generator images/month", "2,500 Graphic Designer Bot prompts/month", "4,500 Image to Prompt images/month", "Fast, Quality & Ultra modes", "Unlimited prompt suggestions", "Commercial license"],
  popular: true,
  tokens: 8000,
  buttonText: "Get Advanced",
  buttonVariant: "default" as const,
  planId: "advanced"
}, {
  name: "Pro",
  price: "1400",
  currency: "Tk",
  description: "For power users and businesses",
  features: ["18,000 tokens/month (~600/day)", "10,000 Metadata Generator images/month", "5,500 Graphic Designer Bot prompts/month", "10,000 Image to Prompt images/month", "Fast, Quality & Ultra modes", "Unlimited prompt suggestions", "Commercial license"],
  popular: false,
  tokens: 18000,
  buttonText: "Get Pro",
  buttonVariant: "default" as const,
  planId: "pro"
}];

type BillingCycle = "monthly" | "yearly";
type PlanCategory = "personal" | "business";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [planCategory, setPlanCategory] = useState<PlanCategory>("personal");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // For now, just use a simple timeout to simulate loading
    // This will be replaced with Firebase Firestore data fetching later
    const timer = setTimeout(() => {
      setIsLoading(false);
      setCurrentPlan('free');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [user]);

  const handlePlanSelection = (planName: string, planId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // If it's the current plan, just show a toast
    if (planId === currentPlan) {
      toast({
        title: `${planName} plan selected`,
        description: `You are already on the ${planName.toLowerCase()} plan`
      });
      return;
    }

    // For paid plans, redirect to NagorikPay
    const paymentUrl = `https://secure-pay.nagorikpay.com/api/execute/02dc3553affdd9bdf91d0225d4e91aa0`;
    window.open(paymentUrl, '_blank');
    toast({
      title: "Payment Page Opened",
      description: "Complete your payment in the new tab"
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500">
            Upgrade your plan
          </h1>
          
          <div className="flex justify-end items-center mb-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={billingCycle === "yearly"} 
                onChange={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")} 
              />
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan, index) => {
            const isCurrentPlan = plan.planId === currentPlan;
            return (
              <div 
                key={index} 
                className={cn(
                  "relative rounded-xl overflow-hidden border transition-all", 
                  plan.popular ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-gray-800 hover:border-gray-700",
                  isCurrentPlan ? "border-green-500 shadow-lg shadow-green-500/20" : "",
                  "bg-gray-900 backdrop-blur-sm"
                )}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                    Most popular
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                    Current Plan
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-extrabold text-white">{plan.currency}{plan.price}</span>
                    <span className="text-gray-400 ml-2">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <Coins className="h-5 w-5 text-purple-400" />
                    <span className="text-purple-400 font-semibold">{plan.tokens} tokens</span>
                  </div>
                  
                  <Button 
                    variant={isCurrentPlan ? "outline" : plan.buttonVariant} 
                    className={cn(
                      "w-full mb-6", 
                      isCurrentPlan 
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-500" 
                        : plan.name === "Free" 
                          ? "bg-gray-700 hover:bg-gray-600" 
                          : "bg-purple-600 hover:bg-purple-700"
                    )} 
                    onClick={() => handlePlanSelection(plan.name, plan.planId)} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : (isCurrentPlan ? "Your Current Plan" : plan.buttonText)}
                  </Button>
                  
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {plan.name !== "Free" && (
                  <div className="border-t border-gray-800 py-3 px-6 flex justify-between items-center bg-gray-800/50">
                    <span className="text-xs text-gray-400">Switch to monthly</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Need more tokens?</h3>
          <p className="text-gray-400 mb-6">
            Contact us for custom enterprise plans and volume discounts.
          </p>
          <Button className="bg-white text-gray-900 hover:bg-gray-200">
            Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              All plans include access to our core features. Prices may vary by region.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              &copy; {new Date().getFullYear()} PixcraftAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
