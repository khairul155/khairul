
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/components/AuthProvider';
import { Json } from '@/integrations/supabase/types';

export type SubscriptionPlan = 'free' | 'basic' | 'advanced' | 'pro';

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
  remaining_credits: number;
  total_credits: number;
}

export interface ToolUsage {
  tool_name: string;
  daily_limit: number;
  monthly_limit: number | null;
  usage_today: number;
  usage_this_month: number;
}

interface UseToolResponse {
  status: string;
  message?: string;
  can_use?: boolean;
  remaining_credits?: number;
  subscription_plan?: SubscriptionPlan;
  slow_mode?: boolean;
  success: boolean;
}

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

export function useCredits() {
  const [credits, setCredits] = useState<UserCredits>(defaultCredits);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Calculate remaining credits based on subscription plan
  const calculateRemainingCredits = (data: any): number => {
    if (data.subscription_plan === 'free') {
      return data.daily_credits - data.credits_used_today;
    } else {
      return data.monthly_credits - data.credits_used_this_month;
    }
  };

  // Calculate total credits based on subscription plan
  const calculateTotalCredits = (data: any): number => {
    if (data.subscription_plan === 'free') {
      return data.daily_credits;
    } else {
      return data.monthly_credits;
    }
  };

  // Fetch user credits from Supabase
  const fetchCredits = async () => {
    if (!user) {
      setCredits(defaultCredits);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_user_credits');
      
      if (error) throw error;
      
      if (data) {
        const jsonData = data as Record<string, any>;
        const processedData = {
          ...jsonData,
          remaining_credits: calculateRemainingCredits(jsonData),
          total_credits: calculateTotalCredits(jsonData)
        };
        setCredits(processedData as UserCredits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch credits'));
      
      // Don't show the error toast on Netlify - it will be handled by the provider
      if (!window.location.hostname.includes('netlify')) {
        toast({
          title: 'Error',
          description: 'Failed to load credit information',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Use a tool and deduct credits with better error handling
  const useTool = async (
    toolName: string, 
    creditsToUse: number = 1,
    onSuccess?: () => void,
    onError?: (message: string) => void
  ) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to use this feature.',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      const { data, error } = await supabase.rpc('use_tool', {
        _user_id: user.id, 
        _tool_name: toolName,
        _credits: creditsToUse
      });
      
      if (error) throw error;
      
      if (data) {
        const responseData = data as Record<string, any>;
        if (responseData.status === 'success' || responseData.status === 'slow_mode') {
          // Update local credits state
          await fetchCredits();
          
          if (responseData.status === 'slow_mode') {
            toast({
              title: 'Slow Mode Enabled',
              description: responseData.message as string,
              variant: 'default',
            });
          } else {
            toast({
              title: 'Success',
              description: `Used ${creditsToUse} credit${creditsToUse > 1 ? 's' : ''} for ${toolName}`,
            });
          }
          
          onSuccess?.();
          return { success: true, slowMode: responseData.status === 'slow_mode' };
        } else {
          // Handle insufficient credits or other issues
          toast({
            title: 'Action Blocked',
            description: responseData.message as string,
            variant: 'destructive',
          });
          
          onError?.(responseData.message as string);
          return { success: false, message: responseData.message as string };
        }
      }
      
      return { success: false };
    } catch (err) {
      console.error('Error using tool:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      
      onError?.(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  // Upgrade user plan with better error handling
  const upgradePlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to upgrade your plan.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Use the update_user_subscription_with_payment function
      const { error } = await supabase.rpc('update_user_subscription_with_payment', {
        _user_id: user.id,
        _subscription_plan: plan,
        _payment_id: `demo-upgrade-${Date.now()}`,
        _prorated_credits: null // No proration for demo
      });
      
      if (error) throw error;
      
      toast({
        title: 'Plan Upgraded',
        description: `Your account is now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`,
        variant: 'default',
      });
      
      await fetchCredits();
      return true;
    } catch (err) {
      console.error('Error upgrading plan:', err);
      toast({
        title: 'Error',
        description: 'Failed to upgrade plan',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Initial load and refresh on user change with better error handling
  useEffect(() => {
    let mounted = true;
    
    const loadCredits = async () => {
      try {
        if (user && mounted) {
          await fetchCredits();
        } else if (!user && mounted) {
          setCredits(defaultCredits);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in loadCredits:", err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Failed to load credits"));
          setLoading(false);
        }
      }
    };
    
    loadCredits();
    
    // Set up a periodic refresh every 60 seconds, but only if user is logged in
    let interval: number | undefined;
    if (user) {
      interval = window.setInterval(fetchCredits, 60000);
    }
    
    return () => {
      mounted = false;
      if (interval) window.clearInterval(interval);
    };
  }, [user]);

  return {
    credits,
    loading,
    error,
    useTool,
    upgradePlan,
    fetchCredits,
  };
}
