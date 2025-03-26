
import React from "react";
import { useAuth } from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import UserCredits from "@/components/UserCredits";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, userCredits, signOut } = useAuth();
  const navigate = useNavigate();
  
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500">
            Your Profile
          </h1>
          
          <div className="space-y-8">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="space-y-2">
                <p><span className="text-gray-400">Email:</span> {user.email}</p>
                <p>
                  <span className="text-gray-400">Subscription Plan:</span>{" "}
                  <span className="capitalize">{userCredits.subscription_plan}</span>
                  {userCredits.subscription_plan === "free" && (
                    <Button 
                      variant="link" 
                      onClick={() => navigate("/pricing")}
                      className="text-sm text-blue-400 ml-2"
                    >
                      Upgrade
                    </Button>
                  )}
                </p>
              </div>
            </div>
            
            <UserCredits />
            
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
