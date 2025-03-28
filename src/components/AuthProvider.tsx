
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

// Define the type for the response from deduct_user_credits
interface DeductCreditsResponse {
  success: boolean;
  message: string;
  remaining: number;
  amount?: number;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
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
  deductCredits: (amount?: number) => Promise<{
    success: boolean;
    message: string;
    remaining?: number;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
      }
    );

    // Then check for an existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const deductCredits = async (amount: number = 4) => {
    if (!user) {
      return {
        success: false,
        message: "User not authenticated"
      };
    }

    try {
      const { data, error } = await supabase.rpc<DeductCreditsResponse>(
        'deduct_user_credits',
        { user_id: user.id, amount }
      );

      if (error) {
        console.error("Error deducting credits:", error);
        toast({
          title: "Error",
          description: "Failed to deduct credits. Please try again.",
          variant: "destructive",
        });
        return { success: false, message: error.message };
      }

      if (!data.success) {
        toast({
          title: "Not enough credits",
          description: data.message,
          variant: "destructive",
        });
        return { 
          success: false, 
          message: data.message,
          remaining: data.remaining 
        };
      }

      // Successful deduction
      console.log("Credits deducted successfully:", data);
      return { 
        success: true, 
        message: "Credits deducted successfully",
        remaining: data.remaining
      };
    } catch (error) {
      console.error("Exception deducting credits:", error);
      return {
        success: false,
        message: "An unexpected error occurred"
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        deductCredits
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
