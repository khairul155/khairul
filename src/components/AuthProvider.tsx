
import { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/integrations/firebase/client";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";

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
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(60); // Default free credits
  const { toast } = useToast();

  // Function to initialize or get user credits
  const initializeUserCredits = async (userId: string) => {
    try {
      const userCreditsRef = doc(db, "user_credits", userId);
      const creditsDoc = await getDoc(userCreditsRef);
      
      // Get current date in UTC+6 (Bangladesh Standard Time)
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const bstTime = new Date(utcTime + (6 * 60 * 60 * 1000));
      const today = bstTime.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      if (!creditsDoc.exists()) {
        // Create new user credits document
        await setDoc(userCreditsRef, {
          user_id: userId,
          subscription_plan: 'free',
          daily_credits: 60,
          credits_used_today: 0,
          monthly_credits: 0,
          credits_used_this_month: 0,
          last_reset_date: today,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        setCredits(60);
        return 60;
      } else {
        const userData = creditsDoc.data();
        
        // Reset daily credits if it's a new day for free users
        if (userData.subscription_plan === 'free' && userData.last_reset_date < today) {
          await updateDoc(userCreditsRef, {
            credits_used_today: 0,
            last_reset_date: today,
            updated_at: serverTimestamp()
          });
          setCredits(userData.daily_credits);
          return userData.daily_credits;
        }
        
        // Calculate available credits based on plan
        if (userData.subscription_plan === 'free') {
          const availableCredits = userData.daily_credits - userData.credits_used_today;
          setCredits(availableCredits);
          return availableCredits;
        } else {
          const availableCredits = userData.monthly_credits - userData.credits_used_this_month;
          setCredits(availableCredits);
          return availableCredits;
        }
      }
    } catch (error) {
      console.error("Error initializing user credits:", error);
      // Default to 60 credits if there's an error
      setCredits(60);
      return 60;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        await initializeUserCredits(user.uid);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to sign in
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await initializeUserCredits(userCredential.user.uid);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userRef = doc(db, "profiles", userCredential.user.uid);
      await setDoc(userRef, {
        id: userCredential.user.uid,
        email: email,
        username: username || email.split('@')[0],
        subscription_plan: 'free',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      await initializeUserCredits(userCredential.user.uid);
      
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists, if not create it
      const userRef = doc(db, "profiles", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          username: user.displayName || user.email?.split('@')[0],
          subscription_plan: 'free',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
      
      await initializeUserCredits(user.uid);
      
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
      setCredits(60); // Reset to default
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out failed",
        description: "An error occurred during sign out.",
        variant: "destructive",
      });
    }
  };

  // Function to deduct credits
  const deductCredits = async (amount = 4) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "You need to be logged in to use this feature.",
          variant: "destructive",
        });
        return { 
          success: false, 
          message: "Not authenticated" 
        };
      }
      
      // Simple check without Firebase if not enough credits
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
      
      // Get current date in UTC+6 (Bangladesh Standard Time)
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const bstTime = new Date(utcTime + (6 * 60 * 60 * 1000));
      const today = bstTime.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      const userCreditsRef = doc(db, "user_credits", user.uid);
      const creditsDoc = await getDoc(userCreditsRef);
      
      if (!creditsDoc.exists()) {
        // This shouldn't happen normally, but create if not exists
        await setDoc(userCreditsRef, {
          user_id: user.uid,
          subscription_plan: 'free',
          daily_credits: 60,
          credits_used_today: amount,
          monthly_credits: 0,
          credits_used_this_month: 0,
          last_reset_date: today,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        const newCredits = 60 - amount;
        setCredits(newCredits);
        
        return { 
          success: true,
          remaining: newCredits
        };
      }
      
      const userData = creditsDoc.data();
      
      // Reset daily credits if it's a new day for free users
      if (userData.subscription_plan === 'free' && userData.last_reset_date < today) {
        await updateDoc(userCreditsRef, {
          credits_used_today: amount,
          last_reset_date: today,
          updated_at: serverTimestamp()
        });
        
        const newCredits = userData.daily_credits - amount;
        setCredits(newCredits);
        
        return { 
          success: true,
          remaining: newCredits
        };
      }
      
      // Update credits based on plan
      if (userData.subscription_plan === 'free') {
        await updateDoc(userCreditsRef, {
          credits_used_today: userData.credits_used_today + amount,
          updated_at: serverTimestamp()
        });
        
        const newCredits = userData.daily_credits - (userData.credits_used_today + amount);
        setCredits(newCredits);
        
        return { 
          success: true,
          remaining: newCredits
        };
      } else {
        await updateDoc(userCreditsRef, {
          credits_used_this_month: userData.credits_used_this_month + amount,
          updated_at: serverTimestamp()
        });
        
        const newCredits = userData.monthly_credits - (userData.credits_used_this_month + amount);
        setCredits(newCredits);
        
        return { 
          success: true,
          remaining: newCredits
        };
      }
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
