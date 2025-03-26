
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export type UserCreditsData = {
  subscription_plan: string;
  daily_credits: number;
  monthly_credits: number;
  credits_used_today: number;
  credits_used_this_month: number;
  remaining_credits: number;
  slow_mode_enabled: boolean;
};

export function useCredits() {
  const { user } = useAuth();
  const [creditsData, setCreditsData] = useState<UserCreditsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCreditsData(null);
      setIsLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          setError('Request timed out');
          setIsLoading(false);
          
          // Set default values for free plan
          setCreditsData({
            subscription_plan: 'free',
            daily_credits: 60,
            monthly_credits: 0,
            credits_used_today: 0,
            credits_used_this_month: 0,
            remaining_credits: 60,
            slow_mode_enabled: false
          });
        }, 5000);
        
        // Try to get from database function first
        const { data: functionData, error: functionError } = await supabase.rpc('get_user_credits');
        
        clearTimeout(timeoutId);
        
        if (functionError) {
          console.error('Error fetching credits from function:', functionError);
          
          // Fallback to direct query
          const { data, error } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching credits:', error);
            throw new Error('Failed to load user credits');
          }
          
          if (data) {
            const remaining = data.subscription_plan === 'free' 
              ? data.daily_credits - data.credits_used_today
              : data.monthly_credits - data.credits_used_this_month;
            
            setCreditsData({
              ...data,
              remaining_credits: remaining
            } as UserCreditsData);
          } else {
            // Set default values for free plan if no data
            setCreditsData({
              subscription_plan: 'free',
              daily_credits: 60,
              monthly_credits: 0,
              credits_used_today: 0,
              credits_used_this_month: 0,
              remaining_credits: 60,
              slow_mode_enabled: false
            });
          }
        } else if (functionData) {
          // Process function data
          const remaining = functionData.subscription_plan === 'free'
            ? functionData.daily_credits - functionData.credits_used_today
            : functionData.monthly_credits - functionData.credits_used_this_month;
            
          setCreditsData({
            ...functionData,
            remaining_credits: remaining
          } as UserCreditsData);
        }
      } catch (err) {
        console.error('Error in useCredits hook:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        
        // Set default values on error
        setCreditsData({
          subscription_plan: 'free',
          daily_credits: 60,
          monthly_credits: 0,
          credits_used_today: 0,
          credits_used_this_month: 0,
          remaining_credits: 60,
          slow_mode_enabled: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  return { creditsData, isLoading, error, refetch: () => {} };
}
