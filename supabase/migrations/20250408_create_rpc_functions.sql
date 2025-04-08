
-- Function to get user credits (used by Profile and Pricing pages)
CREATE OR REPLACE FUNCTION public.get_user_credits(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT 
    json_build_object(
      'id', uc.id,
      'user_id', uc.user_id,
      'subscription_plan', uc.subscription_plan,
      'daily_credits', uc.daily_credits,
      'credits_used_today', uc.credits_used_today,
      'monthly_credits', uc.monthly_credits,
      'credits_used_this_month', uc.credits_used_this_month,
      'last_reset_date', uc.last_reset_date,
      'next_reset_date', uc.next_reset_date,
      'created_at', uc.created_at,
      'updated_at', uc.updated_at
    ) INTO result
  FROM 
    public.user_credits uc
  WHERE 
    uc.user_id = get_user_credits.user_id;

  RETURN result;
END;
$$;

-- Function to upgrade user to premium
CREATE OR REPLACE FUNCTION public.upgrade_user_to_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    subscription_plan = 'premium',
    updated_at = now()
  WHERE 
    user_id = upgrade_user_to_premium.user_id;
    
  RETURN FOUND;
END;
$$;

-- Function to downgrade user to free
CREATE OR REPLACE FUNCTION public.downgrade_user_to_free(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    subscription_plan = 'free',
    updated_at = now()
  WHERE 
    user_id = downgrade_user_to_free.user_id;
    
  RETURN FOUND;
END;
$$;
