
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/components/AuthProvider';

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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_user_credits');
      
      if (error) throw error;
      
      if (data) {
        const processedData = {
          ...data,
          remaining_credits: calculateRemainingCredits(data),
          total_credits: calculateTotalCredits(data)
        };
        setCredits(processedData);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch credits'));
      toast({
        title: 'Error',
        description: 'Failed to load credit information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Use a tool and deduct credits
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
        if (data.status === 'success' || data.status === 'slow_mode') {
          // Update local credits state
          await fetchCredits();
          
          if (data.status === 'slow_mode') {
            toast({
              title: 'Slow Mode Enabled',
              description: data.message,
              variant: 'default',
            });
          }
          
          onSuccess?.();
          return { success: true, slowMode: data.status === 'slow_mode' };
        } else {
          // Handle insufficient credits or other issues
          toast({
            title: 'Action Blocked',
            description: data.message,
            variant: 'destructive',
          });
          
          onError?.(data.message);
          return { success: false, message: data.message };
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

  // Upgrade user plan (demo function, no payment)
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

  // Initial load and refresh on user change
  useEffect(() => {
    fetchCredits();
    
    // Set up a periodic refresh every 60 seconds
    const interval = setInterval(fetchCredits, 60000);
    
    return () => clearInterval(interval);
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
