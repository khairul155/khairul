
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Check, Coins, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    currency: "Tk",
    description: "Basic access with daily limits",
    features: [
      "60 tokens/day",
      "10 Metadata Generator images/day",
      "10 Graphic Designer Bot prompts/day",
      "20 Image to Prompt images/day",
      "Fast & Quality mode",
      "Commercial license",
      "Ad-free experience"
    ],
    popular: false,
    tokens: 60,
    buttonText: "Your Current Plan",
    buttonVariant: "outline" as const
  },
  {
    name: "Basic",
    price: "400",
    currency: "Tk",
    description: "Good for occasional use",
    features: [
      "3,400 tokens/month (~113/day)",
      "2,500 Metadata Generator images/month",
      "1,000 Graphic Designer Bot prompts/month",
      "2,000 Image to Prompt images/month",
      "Fast, Quality & Ultra modes",
      "Unlimited prompt suggestions",
      "Commercial license"
    ],
    popular: false,
    tokens: 3400,
    buttonText: "Get Basic",
    buttonVariant: "default" as const
  },
  {
    name: "Advanced",
    price: "750",
    currency: "Tk",
    description: "Perfect for regular creators",
    features: [
      "8,000 tokens/month (~267/day)",
      "4,500 Metadata Generator images/month",
      "2,500 Graphic Designer Bot prompts/month",
      "4,500 Image to Prompt images/month",
      "Fast, Quality & Ultra modes",
      "Unlimited prompt suggestions",
      "Commercial license"
    ],
    popular: true,
    tokens: 8000,
    buttonText: "Get Advanced",
    buttonVariant: "default" as const
  },
  {
    name: "Pro",
    price: "1400",
    currency: "Tk",
    description: "For power users and businesses",
    features: [
      "18,000 tokens/month (~600/day)",
      "10,000 Metadata Generator images/month",
      "5,500 Graphic Designer Bot prompts/month",
      "10,000 Image to Prompt images/month",
      "Fast, Quality & Ultra modes",
      "Unlimited prompt suggestions",
      "Commercial license"
    ],
    popular: false,
    tokens: 18000,
    buttonText: "Get Pro",
    buttonVariant: "default" as const
  }
];

type BillingCycle = "monthly" | "yearly";
type PlanCategory = "personal" | "business";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [planCategory, setPlanCategory] = useState<PlanCategory>("personal");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handlePlanSelection = async (planName: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (planName === "Free") {
      toast({
        title: "You are already on the Free plan",
        description: "Enjoy your 60 tokens per day!",
      });
      return;
    }
    
    // Call the Supabase function to initiate payment
    try {
      toast({
        title: "Processing payment request",
        description: "Please wait while we prepare your payment...",
      });
      
      const { data, error } = await supabase.functions.invoke('payment-gateway', {
        body: { 
          planName,
          userId: user.id,
          billingCycle
        }
      });
      
      if (error) throw error;
      
      if (data && data.paymentUrl) {
        console.log("Opening payment URL:", data.paymentUrl);
        // Open payment URL in a new tab
        window.open(data.paymentUrl, '_blank');
        
        toast({
          title: "Payment initiated",
          description: "Please complete your payment in the new tab. Return to this page after payment.",
        });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast({
        title: "Payment error",
        description: "There was a problem initiating payment. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500">
            Upgrade your plan
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Choose the perfect plan for your creative needs
          </p>
          
          <div className="inline-flex p-1 rounded-full bg-gray-800 mb-10">
            <button
              onClick={() => setPlanCategory("personal")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                planCategory === "personal" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Personal
            </button>
            <button
              onClick={() => setPlanCategory("business")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                planCategory === "business" 
                  ? "bg-gray-700 text-white" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Business
            </button>
          </div>
          
          <div className="flex justify-end items-center mb-2">
            <span className="text-sm text-gray-400 mr-3">Billed yearly</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={billingCycle === "yearly"}
                onChange={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <span className="text-sm text-white ml-3 flex items-center">
              Billed yearly
              <span className="ml-2 text-xs bg-purple-600 py-0.5 px-2 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index} 
              className={cn(
                "relative rounded-xl overflow-hidden border transition-all",
                plan.popular 
                  ? "border-purple-500 shadow-lg shadow-purple-500/20" 
                  : "border-gray-800 hover:border-gray-700",
                "bg-gray-900 backdrop-blur-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                  Most popular
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
                  variant={plan.buttonVariant} 
                  className={cn(
                    "w-full mb-6",
                    plan.name === "Free" 
                      ? "bg-gray-700 hover:bg-gray-600" 
                      : "bg-purple-600 hover:bg-purple-700"
                  )}
                  onClick={() => handlePlanSelection(plan.name)}
                  disabled={plan.name === "Free"}
                >
                  {plan.buttonText}
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
          ))}
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
