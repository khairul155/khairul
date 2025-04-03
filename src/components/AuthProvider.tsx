
import { createContext, useContext, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  isLoading: boolean;
  credits: number;
  deductCredits: (amount?: number) => Promise<{
    success: boolean;
    message?: string;
    remaining?: number;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [credits, setCredits] = useState<number>(60); // Default free credits
  const { toast } = useToast();

  // Function to deduct credits
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
        credits,
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
