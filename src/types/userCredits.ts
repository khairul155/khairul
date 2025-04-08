
export interface UserCredits {
  id: string;
  user_id: string;
  subscription_plan: string;
  daily_credits: number;
  credits_used_today: number;
  monthly_credits: number;
  credits_used_this_month: number;
  last_reset_date: string;
  next_reset_date: string | null;
  created_at: string;
  updated_at: string;
}
