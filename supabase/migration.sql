
-- Enable realtime for the user_credits table
ALTER TABLE public.user_credits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_credits;
