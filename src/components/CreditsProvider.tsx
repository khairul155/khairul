
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useCredits, UserCredits, SubscriptionPlan } from '@/hooks/use-credits';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/components/AuthProvider';

// Default credits object for when not authenticated
const defaultCredits: UserCredits = {
  subscription_plan: 'free',
  daily_credits: 60,
  monthly_credits: 0,
  credits_used_today: 0,
  credits_used_this_month: 0,
  last_reset_date: new Date().toISOString(),
  next_reset_date: null,
  slow_mode_enabled: false,
  tools: [],
  remaining_credits: 60,
  total_credits: 60
};

interface CreditsContextValue {
  credits: UserCredits;
  loading: boolean;
  error: Error | null;
  useTool: (
    toolName: string, 
    creditsToUse?: number,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => Promise<{ success: boolean; message?: string; slowMode?: boolean }>;
  upgradePlan: (plan: SubscriptionPlan) => Promise<boolean>;
  fetchCredits: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Initialize with default credits when not logged in
  const creditsData = useCredits();
  
  // Ensure the provider doesn't crash the app
  useEffect(() => {
    try {
      setInitialized(true);
    } catch (err) {
      console.error("Error initializing credits:", err);
      setError(err instanceof Error ? err : new Error("Failed to initialize credits"));
      setInitialized(true);
    }
  }, [user]);

  // If there's an error loading credits and we're on Netlify, let's not crash the whole app
  if (error) {
    return (
      <>
        <Alert variant="destructive" className="fixed top-20 right-4 w-96 z-50">
          <AlertDescription>
            Error loading credits: {error.message}. Some features may be limited.
          </AlertDescription>
        </Alert>
        {children}
      </>
    );
  }

  if (!initialized) {
    return <Skeleton className="h-screen w-full" />;
  }
  
  return (
    <CreditsContext.Provider value={creditsData}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCreditsContext() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    // If context is undefined, provide fallback behavior instead of crashing
    console.warn('useCreditsContext used outside of CreditsProvider, using fallback');
    
    return {
      credits: defaultCredits,
      loading: false,
      error: new Error("Credits context not available"),
      useTool: async () => ({ success: false, message: "Credits service unavailable" }),
      upgradePlan: async () => false,
      fetchCredits: async () => {},
    };
  }
  return context;
}
