
import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/integrations/firebase/client";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from "firebase/auth";

type AuthContextType = {
  isLoading: boolean;
  user: User | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(60); // Default free credits
  const { toast } = useToast();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Function to sign in
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Error signing in:", error);
      return { 
        success: false, 
        error: error as Error 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign up
  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Error signing up:", error);
      return { 
        success: false, 
        error: error as Error 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast({
        title: "Google sign in failed",
        description: "An error occurred during Google sign in.",
        variant: "destructive",
      });
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: "An error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  // Function to deduct credits (this would need to be updated to use Firebase)
  const deductCredits = async (amount = 4) => {
    try {
      setIsLoading(true);
      
      // Simple credit system without authentication
      if (credits < amount) {
        toast({
          title: "Not enough credits",
          description: "You don't have enough credits to generate an image.",
          variant: "destructive",
        });
        return { 
          success: false, 
          message: "Not enough credits" 
        };
      }
      
      // Update local credits
      const newCredits = credits - amount;
      setCredits(newCredits);
      
      return { 
        success: true,
        remaining: newCredits
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
