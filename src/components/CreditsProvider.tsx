
import React, { createContext, useContext, ReactNode } from 'react';
import { useCredits, UserCredits, ToolUsage, SubscriptionPlan } from '@/hooks/use-credits';

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
  const creditsData = useCredits();
  
  return (
    <CreditsContext.Provider value={creditsData}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCreditsContext() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCreditsContext must be used within a CreditsProvider');
  }
  return context;
}
