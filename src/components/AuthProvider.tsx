
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoading(false);
        }
      }
    );

    // Then check for an existing session
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      }
    }).catch(error => {
      console.error("Error getting session:", error);
      if (mounted) {
        setIsLoading(false);
      }
    });

    // Check for auth redirect errors on page load
    const checkForAuthRedirectErrors = () => {
      try {
        // Parse URL for error parameters
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check both regular query params and hash params
        const error = params.get("error") || hashParams.get("error");
        const errorDescription = params.get("error_description") || hashParams.get("error_description");
        
        if (error) {
          console.error("Auth redirect error:", error, errorDescription);
          toast({
            title: "Authentication Error",
            description: errorDescription || "There was a problem with authentication.",
            variant: "destructive",
          });
          
          // Clean up the URL to remove error parameters
          if (window.history && window.history.replaceState) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }
      } catch (err) {
        console.error("Error checking for auth redirect errors:", err);
      }
    };
    
    // Check for errors
    checkForAuthRedirectErrors();

    return () => {
      mounted = false;
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
      
      if (!error) {
        toast({
          title: "Account created successfully",
          description: "Please check your email to confirm your account.",
        });
      }
      
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
