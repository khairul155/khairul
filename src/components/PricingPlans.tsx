
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle2, Star, Sparkles, ImageIcon } from "lucide-react";

type PlanOption = {
  id: string;
  name: string;
  price: number;
  images: number;
  features: string[];
  popular?: boolean;
};

const plans: PlanOption[] = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 100,
    images: 200,
    features: [
      "High-quality images",
      "All image styles",
      "Download in full resolution",
      "Valid for 30 days"
    ]
  },
  {
    id: "standard",
    name: "Standard Plan",
    price: 300,
    images: 700,
    features: [
      "High-quality images",
      "All image styles",
      "Download in full resolution",
      "Priority generation",
      "Valid for 60 days"
    ],
    popular: true
  },
  {
    id: "premium",
    name: "Premium Plan",
    price: 500,
    images: 1200,
    features: [
      "High-quality images",
      "All image styles",
      "Download in full resolution",
      "Priority generation",
      "Valid for 90 days",
      "Email support"
    ]
  }
];

const PricingPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
  };

  const copyBkashNumber = () => {
    navigator.clipboard.writeText("01315539951");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = () => {
    if (!transactionId || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill all the fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically call an API to save the payment details
    toast({
      title: "Payment Submitted",
      description: "We will verify your payment and activate your plan soon.",
    });
    setIsPaymentOpen(false);
    setTransactionId("");
    setPhoneNumber("");
  };

  return (
    <>
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl font-bold relative inline-block">
          <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Choose Your Plan
          </span>
          <div className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full"></div>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Select the plan that best fits your needs. All plans offer high-quality AI-generated images.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${
              plan.popular 
                ? "border-2 border-purple-500 shadow-lg shadow-purple-500/20 transform hover:-translate-y-2" 
                : "border border-gray-200 dark:border-gray-700 shadow-md transform hover:-translate-y-1"
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg shadow-md">
                  POPULAR
                </div>
              </div>
            )}
            
            <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  {plan.id === "premium" && <Star className="h-5 w-5 text-yellow-500" />}
                  {plan.id === "standard" && <Sparkles className="h-5 w-5 text-purple-500" />}
                  {plan.id === "basic" && <ImageIcon className="h-5 w-5 text-blue-500" />}
                  {plan.name}
                </h3>
                
                <div className="mt-4 mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-extrabold">৳{plan.price}</span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400 text-sm">BDT</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    For {plan.images.toLocaleString()} images
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Button 
                onClick={() => handleSelectPlan(plan)}
                className={`w-full ${
                  plan.popular 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                    : ""
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                Get Started
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
            <DialogDescription>
              Please send <span className="font-bold">৳{selectedPlan?.price}</span> to the bKash number below and provide your transaction details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex flex-col space-y-2">
              <div className="font-semibold">bKash Payment Information:</div>
              <div className="flex items-center justify-between p-3 rounded-md bg-purple-50 dark:bg-gray-800">
                <span className="font-medium text-purple-700 dark:text-purple-400">01315539951</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyBkashNumber}
                  className="h-8 gap-1"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">bKash Transaction ID</label>
                <Input 
                  placeholder="e.g. 8NXXXXXXXXXXXX" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Phone Number</label>
                <Input 
                  placeholder="e.g. 01XXXXXXXXX" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-400">
                After submitting, we will verify your payment and activate your plan within 24 hours.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitPayment}>Submit Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PricingPlans;
