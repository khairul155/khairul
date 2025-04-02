
import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import UserCredits from "@/components/UserCredits";
import { Button } from "@/components/ui/button";
import { User, Settings, History, CreditCard, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { credits } = useAuth();
  const [subscription, setSubscription] = useState('free');
  const [isLoading, setIsLoading] = useState(false);
  const [displayCredits, setDisplayCredits] = useState(credits);
  const { toast } = useToast();

  const getSubscriptionName = (plan) => {
    const names = {
      'free': 'Free Plan',
      'basic': 'Basic Plan',
      'advanced': 'Advanced Plan',
      'pro': 'Pro Plan'
    };
    return names[plan] || 'Free Plan';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Account</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-medium">Guest User</h3>
                    <p className="text-sm text-gray-400">
                      {isLoading ? 'Loading...' : getSubscriptionName(subscription)}
                    </p>
                  </div>
                </div>
                
                <UserCredits />
              </div>
              
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <ul className="divide-y divide-gray-800">
                  <li>
                    <Link to="/profile" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <User className="h-5 w-5 text-gray-400" />
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <span>Subscription</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <History className="h-5 w-5 text-gray-400" />
                      <span>History</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <span>Settings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Main content */}
            <div className="md:col-span-2 bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold mb-6">Account Information</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Email</h3>
                  <p className="text-lg">guest@example.com</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Current Plan</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg">
                      {isLoading ? 'Loading...' : getSubscriptionName(subscription)}
                    </p>
                    <Button asChild className="bg-purple-600 hover:bg-purple-700">
                      <Link to="/pricing">Upgrade</Link>
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Token Balance</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <p className="text-lg">{displayCredits} tokens</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {subscription === 'free' ? 
                      'Free tokens reset daily at 00:00 (UTC+6 BST)' : 
                      'Tokens reset monthly based on your billing cycle'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
