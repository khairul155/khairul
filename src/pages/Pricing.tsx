import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Check, Coins, ArrowRight, ChevronRight, Sparkles, Zap, Shield, Loader2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useCredits, SubscriptionPlan } from "@/hooks/use-credits";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    plan: "free" as SubscriptionPlan
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
    plan: "basic" as SubscriptionPlan
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
    plan: "advanced" as SubscriptionPlan
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
    plan: "pro" as SubscriptionPlan
  }
];

type BillingCycle = "monthly" | "yearly";
type PlanCategory = "personal" | "business";
type PaymentStatus = "idle" | "processing" | "success" | "error" | "verifying";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [planCategory, setPlanCategory] = useState<PlanCategory>("personal");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { credits, fetchCredits, loading: creditsLoading } = useCredits();
  
  useEffect(() => {
    const checkTransactionStatus = async () => {
      const url = new URL(window.location.href);
      const status = url.searchParams.get('payment_status');
      const txnId = url.searchParams.get('transaction_id');
      
      // Clear URL parameters without reloading the page
      if (status) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (status === 'success') {
        setPaymentStatus("success");
        setPaymentDialog(true);
        await fetchCredits();
        toast({
          title: "Payment Successful",
          description: `Your plan has been upgraded successfully.`,
        });
      } else if (status === 'failed' && txnId) {
        setPaymentStatus("error");
        setPaymentDialog(true);
        setPaymentError("Payment failed. Please try again or contact support.");
        toast({
          title: "Payment Failed",
          description: "There was an issue processing your payment. Please try again.",
          variant: "destructive",
        });
      } else if (txnId) {
        // Verify transaction status
        setPaymentStatus("verifying");
        setPaymentDialog(true);
        
        try {
          setIsVerifying(true);
          const { data, error } = await supabase.functions.invoke('process-payment/verify', {
            method: 'POST',
            body: {
              transactionId: txnId,
              userId: user?.id
            }
          });
          
          if (error) {
            throw error;
          }
          
          if (data.success) {
            setPaymentStatus("success");
            await fetchCredits();
            toast({
              title: "Payment Successful",
              description: `Your plan has been upgraded to ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}.`,
            });
          } else {
            setPaymentStatus("error");
            setPaymentError(data.error || "Payment verification failed. Please contact support.");
            toast({
              title: "Payment Error",
              description: "There was an issue verifying your payment. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          setPaymentStatus("error");
          setPaymentError("Network error while verifying payment. Please check your connection.");
          toast({
            title: "Verification Error",
            description: "Failed to verify payment status. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsVerifying(false);
        }
      }
    };
    
    checkTransactionStatus();
  }, [user]);

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    if (credits.subscription_plan === plan) {
      toast({
        title: "Already subscribed",
        description: `You are already on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`,
      });
      return;
    }
    
    setSelectedPlan(plan);
    setConfirmDialog(true);
  };

  const initiatePayment = async () => {
    if (!selectedPlan || !user) return;
    
    setPaymentStatus("processing");
    setConfirmDialog(false);
    setPaymentDialog(true);
    setPaymentAttempts(prev => prev + 1);
    
    try {
      console.log(`Initiating payment for plan: ${selectedPlan} (Attempt: ${paymentAttempts + 1})`);
      
      const { data, error } = await supabase.functions.invoke('process-payment/initiate', {
        method: 'POST',
        body: {
          userId: user.id,
          userEmail: user.email,
          plan: selectedPlan,
          redirectUrl: window.location.href
        }
      });
      
      if (error) {
        console.error("Payment function error:", error);
        throw error;
      }
      
      if (data && data.url) {
        setTransactionRef(data.transactionRef || null);
        console.log("Redirecting to payment URL:", data.url);
        window.location.href = data.url;
      } else {
        console.error("Invalid response data:", data);
        setPaymentStatus("error");
        setPaymentError(data?.error || "Failed to initialize payment. Please try again.");
        toast({
          title: "Payment Error",
          description: "There was an issue setting up the payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setPaymentStatus("error");
      setPaymentError(
        "Network error while connecting to the payment gateway. " + 
        "Please check your internet connection and try again, or contact support."
      );
      toast({
        title: "Payment Error",
        description: "Failed to connect to payment service. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const retryPayment = () => {
    if (paymentAttempts >= 3) {
      toast({
        title: "Maximum Attempts Reached",
        description: "Please try again later or contact support for assistance.",
        variant: "destructive",
      });
      return;
    }
    
    initiatePayment();
  };

  const closePaymentDialog = () => {
    setPaymentDialog(false);
    setPaymentStatus("idle");
    setPaymentError(null);
    setTransactionRef(null);
    setPaymentAttempts(0);
  };

  const formatPlanName = (plan: SubscriptionPlan): string => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
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
            <span className="text-sm text-gray-400 mr-3">Billed monthly</span>
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
          {pricingPlans.map((plan, index) => {
            const isCurrentPlan = !creditsLoading && credits.subscription_plan === plan.plan;
            
            return (
              <div 
                key={index} 
                className={cn(
                  "relative rounded-xl overflow-hidden border transition-all",
                  plan.popular 
                    ? "border-purple-500 shadow-lg shadow-purple-500/20" 
                    : isCurrentPlan
                      ? "border-green-500 shadow-lg shadow-green-500/20"
                      : "border-gray-800 hover:border-gray-700",
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
                    <span className="text-purple-400 font-semibold">{plan.tokens.toLocaleString()} tokens</span>
                  </div>
                  
                  {user ? (
                    isCurrentPlan ? (
                      <Button 
                        variant="outline" 
                        className="w-full mb-6 bg-gray-700 hover:bg-gray-600 cursor-default"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        variant={plan.buttonVariant} 
                        className={cn(
                          "w-full mb-6",
                          plan.name === "Free" 
                            ? "bg-gray-700 hover:bg-gray-600" 
                            : "bg-purple-600 hover:bg-purple-700"
                        )}
                        onClick={() => handlePlanSelection(plan.plan)}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    )
                  ) : (
                    <Button 
                      variant={plan.buttonVariant} 
                      className={cn(
                        "w-full mb-6",
                        plan.name === "Free" 
                          ? "bg-gray-700 hover:bg-gray-600" 
                          : "bg-purple-600 hover:bg-purple-700"
                      )}
                      onClick={() => navigate("/auth")}
                    >
                      Sign in to Subscribe
                    </Button>
                  )}
                  
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
      
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan ? formatPlanName(selectedPlan) : ''} Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to upgrade to the {selectedPlan ? formatPlanName(selectedPlan) : ''} plan? 
              You will be redirected to a secure payment page to complete your purchase.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                  {selectedPlan === 'basic' && <Coins className="h-6 w-6 text-purple-600" />}
                  {selectedPlan === 'advanced' && <Sparkles className="h-6 w-6 text-purple-600" />}
                  {selectedPlan === 'pro' && <Zap className="h-6 w-6 text-purple-600" />}
                  {selectedPlan === 'free' && <Shield className="h-6 w-6 text-purple-600" />}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{formatPlanName(selectedPlan)}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan === 'basic' && '$10/month · 3,400 tokens/month'}
                    {selectedPlan === 'advanced' && '$25/month · 8,000 tokens/month'}
                    {selectedPlan === 'pro' && '$50/month · 18,000 tokens/month'}
                    {selectedPlan === 'free' && 'Free · 60 tokens/day'}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md p-4 bg-amber-950/10">
                <p className="text-sm text-center text-amber-400">
                  You'll be redirected to NagorikPay to complete your payment securely. 
                  Your plan will be updated immediately after successful payment.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancel</Button>
            <Button 
              onClick={initiatePayment}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Proceed to Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={paymentDialog} onOpenChange={closePaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentStatus === "processing" && "Processing Payment"}
              {paymentStatus === "verifying" && "Verifying Payment"}
              {paymentStatus === "success" && "Payment Successful"}
              {paymentStatus === "error" && "Payment Failed"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            {(paymentStatus === "processing" || paymentStatus === "verifying") && (
              <>
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
                  <p className="text-center text-lg">
                    {paymentStatus === "processing" ? "Redirecting to payment gateway..." : "Verifying your payment..."}
                  </p>
                  {transactionRef && (
                    <p className="text-sm text-gray-500">Reference: {transactionRef}</p>
                  )}
                </div>
              </>
            )}
            
            {paymentStatus === "success" && (
              <>
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">Payment Successful!</h3>
                <p className="text-center text-gray-500 max-w-md">
                  Your plan has been upgraded successfully. You now have access to additional features and credits.
                </p>
              </>
            )}
            
            {paymentStatus === "error" && (
              <>
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold">Payment Failed</h3>
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{paymentError || "There was an error processing your payment. Please try again or contact support."}</AlertDescription>
                </Alert>
              </>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {paymentStatus === "success" && (
              <Button onClick={closePaymentDialog}>Continue</Button>
            )}
            {paymentStatus === "error" && (
              <>
                <Button variant="outline" onClick={closePaymentDialog}>Close</Button>
                <Button 
                  className="gap-2" 
                  onClick={retryPayment} 
                  disabled={paymentAttempts >= 3}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Payment
                </Button>
              </>
            )}
            {paymentStatus === "processing" && (
              <Button variant="outline" onClick={closePaymentDialog}>Cancel</Button>
            )}
            {paymentStatus === "verifying" && (
              <Button disabled={isVerifying} variant="outline" onClick={closePaymentDialog}>
                {isVerifying ? "Verifying..." : "Close"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
