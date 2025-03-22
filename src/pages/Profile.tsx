
import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, Edit, Save, X, Camera, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [darkModePreference, setDarkModePreference] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  console.log("Profile page user:", user);

  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setUsername(user.user_metadata?.name || "");
      setProfilePicture(user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=80&h=80");
    }
  }, [user]);

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

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: username
        }
      });

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (user) {
      setUsername(user.user_metadata?.name || "");
    }
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would be where you upload the file to storage
      // For now, we'll just create a local URL
      const imageUrl = URL.createObjectURL(file);
      setProfilePicture(imageUrl);
      toast({
        title: "Image selected",
        description: "Your profile picture will be updated when you save your profile."
      });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex flex-col items-center bg-gradient-to-b from-background to-background/80">
      <div className="container max-w-4xl px-4 md:px-0">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border border-gray-700">
                        {profilePicture ? (
                          <AvatarImage 
                            src={profilePicture} 
                            alt={username || user?.email || "User"} 
                          />
                        ) : (
                          <AvatarImage 
                            src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&q=80&w=80&h=80" 
                            alt={username || user?.email || "User"} 
                          />
                        )}
                        <AvatarFallback className="bg-primary text-white text-2xl">
                          {user?.email ? user.email.substring(0, 2).toUpperCase() : <User />}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <div className="absolute bottom-0 right-0">
                          <label htmlFor="profile-picture" className="cursor-pointer">
                            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white">
                              <Camera className="h-4 w-4" />
                            </div>
                            <input 
                              id="profile-picture" 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleImageUpload}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    <div>
                      {isEditing ? (
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="font-semibold text-xl mb-1"
                          placeholder="Enter your name"
                        />
                      ) : (
                        <>
                          <CardTitle className="text-2xl">
                            {username || user?.user_metadata?.name || "User"}
                          </CardTitle>
                          <CardDescription>
                            {user?.email}
                          </CardDescription>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {isEditing ? (
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancel}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSaveProfile}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Profile
                      </Button>
                    )}
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
                  variant="destructive" 
                  className="gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>
                  Manage your application preferences and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                    </div>
                    <Switch 
                      id="dark-mode" 
                      checked={darkModePreference} 
                      onCheckedChange={setDarkModePreference} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications about account activities</p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
