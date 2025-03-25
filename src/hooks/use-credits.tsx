
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionPlan = 'free' | 'basic' | 'advanced' | 'pro';

export interface ToolUsage {
  tool_name: string;
  daily_limit: number;
  monthly_limit: number | null;
  usage_today: number;
  usage_this_month: number;
}

export interface UserCredits {
  subscription_plan: SubscriptionPlan;
  daily_credits: number;
  monthly_credits: number;
  credits_used_today: number;
  credits_used_this_month: number;
  last_reset_date: string;
  next_reset_date: string | null;
  slow_mode_enabled: boolean;
  tools: ToolUsage[];
}

interface CreditContextType {
  credits: UserCredits | null;
  isLoading: boolean;
  refreshCredits: () => Promise<void>;
  useToolCredits: (toolName: string, credits?: number) => Promise<{
    success: boolean;
    message: string;
    status: string;
    canUse: boolean;
    remainingCredits?: number;
    slowMode?: boolean;
  }>;
  formatToolName: (toolType: string) => string;
  getRemainingCredits: () => number | null;
  getToolUsage: (toolName: string) => ToolUsage | undefined;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const formatCreditsDisplay = (used: number, total: number): string => {
  return `${used.toLocaleString()}/${total.toLocaleString()}`;
};

export const CreditsProvider = ({ children }: { children: React.ReactNode }) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshCredits = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_user_credits');
      
      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }
      
      if (data) {
        // Cast data to UserCredits type
        setCredits(data as unknown as UserCredits);
      }
    } catch (error) {
      console.error('Error in refreshCredits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch credits if the user is authenticated
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN') {
          await refreshCredits();
        } else if (event === 'SIGNED_OUT') {
          setCredits(null);
        }
      }
    );

    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        refreshCredits();
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatToolName = (toolType: string): string => {
    switch (toolType) {
      case 'image_generator':
        return 'Image Generator';
      case 'metadata_generator':
        return 'Metadata Generator';
      case 'graphic_designer_bot':
        return 'Graphic Designer Bot';
      case 'image_to_prompt':
        return 'Image to Prompt';
      case 'prompt_suggestion':
        return 'Prompt Suggestion';
      default:
        return toolType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const useToolCredits = async (toolName: string, creditsAmount = 1) => {
    try {
      // Get the current user ID directly
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to use this feature.',
          variant: 'destructive',
        });
        return {
          success: false,
          message: 'Not authenticated',
          status: 'error',
          canUse: false
        };
      }

      const { data, error } = await supabase.rpc('use_tool', {
        _user_id: userId,
        _tool_name: toolName,
        _credits: creditsAmount
      });

      if (error) {
        console.error('Error using tool credits:', error);
        toast({
          title: 'Credit System Error',
          description: 'Failed to process credits. Please try again.',
          variant: 'destructive',
        });
        return {
          success: false,
          message: 'Failed to process credits',
          status: 'error',
          canUse: false
        };
      }

      // Refresh credits after using the tool
      await refreshCredits();

      // Need to type cast data as it comes from a custom RPC
      const responseData = data as {
        status: string;
        message: string;
        can_use: boolean;
        remaining_credits?: number;
        slow_mode?: boolean;
        subscription_plan?: string;
      };

      if (responseData.status === 'error') {
        toast({
          title: 'Credit Limit Reached',
          description: responseData.message,
          variant: 'destructive',
        });
        return {
          success: false,
          message: responseData.message,
          status: responseData.status,
          canUse: responseData.can_use || false,
          remainingCredits: responseData.remaining_credits,
          slowMode: responseData.slow_mode
        };
      }

      if (responseData.status === 'slow_mode') {
        toast({
          title: 'Slow Mode Activated',
          description: responseData.message,
        });
      }

      return {
        success: true,
        message: responseData.message,
        status: responseData.status,
        canUse: responseData.can_use,
        remainingCredits: responseData.remaining_credits,
        slowMode: responseData.slow_mode
      };
    } catch (error) {
      console.error('Error in useToolCredits:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return {
        success: false,
        message: 'An unexpected error occurred',
        status: 'error',
        canUse: false
      };
    }
  };

  const getRemainingCredits = (): number | null => {
    if (!credits) return null;
    
    if (credits.subscription_plan === 'free') {
      return credits.daily_credits - credits.credits_used_today;
    } else {
      return credits.monthly_credits - credits.credits_used_this_month;
    }
  };

  const getToolUsage = (toolName: string): ToolUsage | undefined => {
    return credits?.tools.find(tool => tool.tool_name === toolName);
  };

  return (
    <CreditContext.Provider
      value={{
        credits,
        isLoading,
        refreshCredits,
        useToolCredits,
        formatToolName,
        getRemainingCredits,
        getToolUsage
      }}
    >
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
};
