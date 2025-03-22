
import React from "react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Profile page user:", user);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center bg-gradient-to-b from-background to-background/80">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>
        
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border border-gray-700">
                <AvatarImage 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=80&h=80" 
                  alt={user?.email || "User"} 
                />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {user?.email ? user.email.substring(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user?.user_metadata?.name || "User"}
                </CardTitle>
                <CardDescription>
                  {user?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Account Information</h3>
                <p className="text-muted-foreground">
                  Manage your account details and preferences
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Email</span>
                  <span>{user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Account ID</span>
                  <span className="text-sm text-muted-foreground">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Last Sign In</span>
                  <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
