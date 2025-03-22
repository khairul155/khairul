
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Pencil, Check, X, Upload } from "lucide-react";

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  subscription_plan: string;
}

const Profile = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile:", error);
          toast({
            title: "Error loading profile",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        setProfile(data);
        setUsername(data.username || "");
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setUpdating(true);
    let avatarUrl = profile?.avatar_url;

    try {
      // If there's a new avatar file, upload it
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Check if storage bucket exists, create if not
        const { data: bucketData } = await supabase.storage.getBucket('avatars');
        if (!bucketData) {
          await supabase.storage.createBucket('avatars', {
            public: true,
          });
        }

        // Upload the file
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, username, avatar_url: avatarUrl } : null);
      setEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setUsername(profile?.username || "");
    setAvatarPreview(null);
    setAvatarFile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-24">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>
            View and edit your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={avatarPreview || profile?.avatar_url || ""} />
                <AvatarFallback className="text-4xl bg-primary/10">
                  <User size={40} />
                </AvatarFallback>
              </Avatar>
              
              {editing && (
                <div className="absolute -bottom-2 -right-2">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors">
                      <Upload size={16} />
                    </div>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="username">Username</Label>
                  {!editing && (
                    <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                      <Pencil size={16} />
                    </Button>
                  )}
                </div>
                {editing ? (
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="mt-1"
                    placeholder="Enter a username"
                  />
                ) : (
                  <div className="mt-1 text-lg font-medium">{profile?.username || "No username set"}</div>
                )}
              </div>
              
              <div>
                <Label>Email</Label>
                <div className="mt-1 text-lg font-medium">{user?.email}</div>
              </div>
              
              <div>
                <Label>Subscription</Label>
                <div className="mt-1 text-lg font-medium capitalize">{profile?.subscription_plan || "Free"}</div>
              </div>
            </div>
          </div>
        </CardContent>
        
        {editing && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelEditing} disabled={updating}>
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={updating}>
              {updating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Profile;
