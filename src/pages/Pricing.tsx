
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Check, Coins, ArrowRight, ChevronRight, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useCredits, SubscriptionPlan } from "@/hooks/use-credits";
import { supabase } from "@/integrations/supabase/client";
import CreditsDisplay from "@/components/CreditsDisplay";

const pricingPlans = [
  {
    name: "Free",
    price: "0",
    currency: "$",
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
    buttonVariant: "outline" as const,
    planId: "free" as SubscriptionPlan
  },
  {
    name: "Basic",
    price: "10",
    currency: "$",
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
    buttonVariant: "default" as const,
    planId: "basic" as SubscriptionPlan
  },
  {
    name: "Advanced",
    price: "25",
    currency: "$",
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
    buttonVariant: "default" as const,
    planId: "advanced" as SubscriptionPlan
  },
  {
    name: "Pro",
    price: "50",
    currency: "$",
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
    buttonVariant: "default" as const,
    planId: "pro" as SubscriptionPlan
  }
];

type BillingCycle = "monthly" | "yearly";
type PlanCategory = "personal" | "business";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [planCategory, setPlanCategory] = useState<PlanCategory>("personal");
  const [updating, setUpdating] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { credits, refreshCredits } = useCredits();
  
  const handlePlanSelection = async (planName: string, planId: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // Check if this is already the user's plan
    if (credits?.subscription_plan === planId) {
      toast({
        title: "Already subscribed",
        description: `You are already on the ${planName} plan`,
      });
      return;
    }
    
    // In a real implementation, this would trigger the Stripe payment flow
    // Since this is a demo, we'll simulate the payment process
    setProcessingPayment(true);
    setUpdating(planId);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock payment ID
      const mockPaymentId = `pm_${Math.random().toString(36).substring(2, 15)}`;
      
      // Calculate if this is a mid-month upgrade
      const today = new Date();
      const dayOfMonth = today.getDate();
      const isNotStartOfMonth = dayOfMonth > 5; // Consider it mid-month if not in first 5 days
      
      // Call the edge function to update the subscription
      const { data, error } = await supabase.functions.invoke('handle-subscription', {
        body: { 
          userId: user.id,
          plan: planId,
          paymentId: mockPaymentId,
          mid_month: isNotStartOfMonth
        }
      });
      
      if (error) {
        console.error('Error updating subscription:', error);
        throw new Error('Failed to update subscription');
      }
      
      // Refresh credits to update UI
      await refreshCredits();
      
      toast({
        title: "Subscription updated",
        description: `Your plan has been updated to ${planName}`,
      });

      // If prorated, show additional information
      if (data?.prorated) {
        toast({
          title: "Prorated Credits Applied",
          description: `You received ${data.prorated_credits} credits for the remainder of this month.`,
        });
      }
    } catch (error) {
      console.error('Error in plan selection:', error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your subscription. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
      setUpdating(null);
    }
  };

  // Helper function to determine button state
  const getButtonProps = (plan: typeof pricingPlans[0]) => {
    // If we're currently updating this plan
    if (updating === plan.planId || processingPayment) {
      return {
        disabled: true,
        children: (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {updating === plan.planId ? 'Processing...' : 'Please wait...'}
          </>
        )
      };
    }
    
    // If this is the user's current plan
    if (credits?.subscription_plan === plan.planId) {
      return {
        disabled: true,
        variant: "outline" as const,
        children: "Current Plan"
      };
    }
    
    // Default state
    return {
      disabled: false,
      variant: plan.buttonVariant,
      onClick: () => handlePlanSelection(plan.name, plan.planId),
      children: plan.buttonText
    };
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
          
          {user && credits && (
            <div className="mb-8 max-w-md mx-auto">
              <CreditsDisplay showUpgradeButton={false} />
            </div>
          )}
          
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
            <span className="text-sm text-gray-400 mr-3">Monthly</span>
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
              Yearly
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
                  : credits?.subscription_plan === plan.planId
                    ? "border-blue-500"
                    : "border-gray-800 hover:border-gray-700",
                "bg-gray-900 backdrop-blur-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
                  Most popular
                </div>
              )}
              
              {credits?.subscription_plan === plan.planId && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg">
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
                  <Coins className="h-5 w-5 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{plan.tokens.toLocaleString()} tokens</span>
                </div>
                
                <Button 
                  variant={getButtonProps(plan).variant as any}
                  className={cn(
                    "w-full mb-6",
                    plan.name === "Free" && credits?.subscription_plan !== "free"
                      ? "bg-gray-700 hover:bg-gray-600" 
                      : plan.popular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={getButtonProps(plan).onClick}
                  disabled={getButtonProps(plan).disabled}
                >
                  {getButtonProps(plan).children}
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
                  <span className="text-xs text-gray-400">
                    {billingCycle === "monthly" ? "Monthly billing" : "Yearly billing (20% off)"}
                  </span>
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
        
        <div className="max-w-3xl mx-auto mt-12 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-medium text-yellow-400 mb-2">Demo Mode Note</h4>
              <p className="text-sm text-gray-300">
                This is a demonstration of the credit system. In a production environment, 
                plan selection would be connected to a payment processor. For now, you can 
                freely switch between plans to test the credit system functionality.
              </p>
            </div>
          </div>
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
