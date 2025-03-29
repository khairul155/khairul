
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  credits: number;
  deductCredits: (amount?: number) => Promise<{
    success: boolean;
    message?: string;
    remaining?: number;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signUp: (email: string, password: string, username?: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signInWithGoogle: () => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState<number>(60); // Default to 60 for free plan
  const { toast } = useToast();

  // Function to fetch user credits
  const fetchUserCredits = async (userId: string) => {
    try {
      console.log("Fetching credits for user:", userId);
      const { data, error } = await supabase.functions.invoke('get-user-credits', {
        body: { userId }
      });
      
      if (error) {
        console.error("Error fetching user credits:", error);
        return;
      }
      
      console.log("Credits data received:", data);
      
      if (data && typeof data.credits === 'number') {
        setCredits(data.credits);
      } else {
        // Default to 60 tokens for free tier if no specific credits found
        console.log("Setting default credits (60)");
        setCredits(60);
      }
    } catch (error) {
      console.error("Error invoking get-user-credits function:", error);
      setCredits(60); // Default fallback
    }
  };

  // Function to deduct credits
  const deductCredits = async (amount = 4) => {
    if (!user) {
      return { success: false, message: "User not authenticated" };
    }

    try {
      console.log("Deducting credits for user:", user.id, "amount:", amount);
      const { data, error } = await supabase.functions.invoke('get-user-credits', {
        body: { userId: user.id, action: "deduct", amount: amount }
      });

      console.log("Deduct response:", data, error);

      if (error) {
        console.error("Error deducting credits:", error);
        toast({
          title: "Error",
          description: "Failed to deduct credits. Please try again.",
          variant: "destructive",
        });
        return { 
          success: false, 
          message: "Failed to deduct credits" 
        };
      }

      if (data && data.error) {
        console.error("API error deducting credits:", data.error);
        toast({
          title: "Not enough credits",
          description: data.error || "You don't have enough credits to generate an image.",
          variant: "destructive",
        });
        return { 
          success: false, 
          message: data.error 
        };
      }

      // Update local state with new credit amount
      if (data && typeof data.credits === 'number') {
        console.log("Credits updated to:", data.credits);
        setCredits(data.credits);
        
        return { 
          success: true,
          remaining: data.credits
        };
      } else {
        // Handle unexpected API response format
        console.error("Unexpected response format:", data);
        toast({
          title: "Error",
          description: "Unexpected response from the server.",
          variant: "destructive",
        });
        return {
          success: false,
          message: "Unexpected response format"
        };
      }
    } catch (error) {
      console.error("Exception deducting credits:", error);
      toast({
        title: "Error",
        description: "Failed to deduct credits. Please try again.",
        variant: "destructive",
      });
      return { 
        success: false, 
        message: "Error processing request" 
      };
    }
  };

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        
        // Fetch user credits when user is authenticated
        if (newUser) {
          fetchUserCredits(newUser.id);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for an existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      
      // Fetch user credits when user is authenticated
      if (currentUser) {
        fetchUserCredits(currentUser.id);
      }
      
      setIsLoading(false);
    });

    // Check for auth redirect errors on page load
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");
    
    if (error) {
      console.error("Auth redirect error:", error, errorDescription);
      toast({
        title: "Authentication Error",
        description: errorDescription || "There was a problem with authentication.",
        variant: "destructive",
      });
    }

    // Set up real-time subscription for user_credits changes to update credit counts
    if (user) {
      const channel = supabase
        .channel('auth-credits-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log("Credits change detected:", payload);
            // Refetch credits when credits change
            fetchUserCredits(user.id);
          }
        )
        .subscribe((status) => {
          console.log("Subscription status:", status);
        });
        
      return () => {
        subscription.unsubscribe();
        supabase.removeChannel(channel);
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error, success: !error };
    } catch (error) {
      return { error: error as Error, success: false };
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: username }
        }
      });
      return { error, success: !error };
    } catch (error) {
      return { error: error as Error, success: false };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log("Initiating Google sign-in...");
      
      // Get the current site URL for redirect
      const redirectTo = window.location.origin + '/auth';
      console.log("Redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        toast({
          title: "Google Sign-In Failed",
          description: error.message || "There was a problem signing in with Google.",
          variant: "destructive",
        });
        return { error, success: false };
      }
      
      return { error: null, success: true };
    } catch (error) {
      console.error("Google sign-in exception:", error);
      toast({
        title: "Google Sign-In Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error: error as Error, success: false };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        credits,
        deductCredits,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
