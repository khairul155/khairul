
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

type SubscriptionPlan = 'free' | 'basic' | 'advanced' | 'pro';

type UserCredits = {
  subscription_plan: SubscriptionPlan;
  daily_credits: number;
  monthly_credits: number;
  credits_used_today: number;
  credits_used_this_month: number;
  slow_mode_enabled: boolean;
  tools?: any[];
  isLoading: boolean;
  error?: Error | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userCredits: UserCredits;
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
  refreshCredits: () => Promise<void>;
};

const initialCredits: UserCredits = {
  subscription_plan: 'free',
  daily_credits: 60,
  monthly_credits: 0,
  credits_used_today: 0,
  credits_used_this_month: 0,
  slow_mode_enabled: false,
  tools: [],
  isLoading: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<UserCredits>(initialCredits);
  const { toast } = useToast();

  // Function to fetch user credits
  const fetchUserCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-credits');
      
      if (error) {
        console.error("Error fetching user credits:", error);
        setUserCredits({
          ...initialCredits,
          error: new Error(error.message),
          isLoading: false
        });
        return;
      }
      
      if (data) {
        setUserCredits({
          subscription_plan: data.subscription_plan || 'free',
          daily_credits: data.daily_credits || 60,
          monthly_credits: data.monthly_credits || 0,
          credits_used_today: data.credits_used_today || 0,
          credits_used_this_month: data.credits_used_this_month || 0,
          slow_mode_enabled: data.slow_mode_enabled || false,
          tools: data.tools || [],
          isLoading: false
        });
      } else {
        // Fallback to defaults if no data
        setUserCredits({
          ...initialCredits,
          isLoading: false
        });
      }
    } catch (err) {
      console.error("Exception fetching user credits:", err);
      setUserCredits({
        ...initialCredits,
        error: err as Error,
        isLoading: false
      });
    }
  };

  // Function to refresh credits (can be called after operations)
  const refreshCredits = async () => {
    if (user) {
      await fetchUserCredits(user.id);
    }
  };

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await fetchUserCredits(newSession.user.id);
        } else {
          setUserCredits({
            ...initialCredits,
            isLoading: false
          });
        }
        
        setIsLoading(false);
      }
    );

    // Then check for an existing session
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        await fetchUserCredits(data.session.user.id);
      } else {
        setUserCredits({
          ...initialCredits,
          isLoading: false
        });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userCredits,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshCredits,
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
