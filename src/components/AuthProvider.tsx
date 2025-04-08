
import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  credits: number;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error?: Error;
  }>;
  signUp: (email: string, password: string, username?: string) => Promise<{
    success: boolean;
    error?: Error;
  }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deductCredits: (amount?: number) => Promise<{
    success: boolean;
    message?: string;
    remaining?: number;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const { toast } = useToast();

  // Initialize authentication state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Don't load credits here to avoid circular dependency
        // Use setTimeout to defer the fetch
        if (session?.user) {
          setTimeout(() => {
            fetchUserCredits(session.user.id);
          }, 0);
        } else {
          setCredits(0);
        }
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserCredits(session.user.id);
      }
      
      setIsLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Function to fetch user credits
  const fetchUserCredits = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-credits', {
        body: { userId }
      });
      
      if (error) {
        console.error("Error fetching credits:", error);
        return;
      }
      
      if (data && data.credits !== undefined) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("Error in fetchUserCredits:", error);
    }
  };

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Sign in error:", error);
      return { success: false, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Function to deduct credits
  const deductCredits = async (amount = 1) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use this feature.",
          variant: "destructive",
        });
        return { 
          success: false, 
          message: "Authentication required" 
        };
      }
      
      const { data, error } = await supabase.functions.invoke('get-user-credits', {
        body: { 
          userId: user.id,
          action: "deduct",
          amount
        }
      });
      
      if (error || (data && data.error)) {
        const errorMessage = data?.error || error?.message || "Error processing request";
        toast({
          title: "Error",
          description: data?.details || errorMessage,
          variant: "destructive",
        });
        return { 
          success: false, 
          message: errorMessage
        };
      }
      
      // Update local credits
      if (data && data.credits !== undefined) {
        setCredits(data.credits);
      }
      
      return { 
        success: true,
        remaining: data?.credits || 0
      };
    } catch (error) {
      console.error("Error deducting credits:", error);
      toast({
        title: "Error",
        description: "Failed to deduct credits. Please try again.",
        variant: "destructive",
      });
      return { 
        success: false, 
        message: "Error processing request" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        session,
        credits,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        deductCredits,
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
