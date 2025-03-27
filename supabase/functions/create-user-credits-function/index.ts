
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Try to create the table directly with SQL
    console.log("Creating user_credits table directly with SQL");
    
    // Create the user_credits table
    const { error: createError } = await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS public.user_credits (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        subscription_plan TEXT NOT NULL DEFAULT 'free',
        daily_credits INTEGER NOT NULL DEFAULT 60,
        credits_used_today INTEGER NOT NULL DEFAULT 0,
        last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
      
      -- Create index on user_id for faster lookups
      CREATE INDEX IF NOT EXISTS user_credits_user_id_idx ON public.user_credits(user_id);
      
      -- Enable RLS
      ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
      
      -- Create policy for users to see their own credits
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'user_credits' AND policyname = 'Users can view their own credits'
        ) THEN
          EXECUTE 'CREATE POLICY "Users can view their own credits"
            ON public.user_credits
            FOR SELECT
            USING (auth.uid() = user_id)';
        END IF;
      END
      $$;
      
      -- Create policy for service role to manage all records
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'user_credits' AND policyname = 'Service role can do anything'
        ) THEN
          EXECUTE 'CREATE POLICY "Service role can do anything"
            ON public.user_credits
            USING (true)
            WITH CHECK (true)';
        END IF;
      END
      $$;
      
      -- Set up the table for realtime updates
      ALTER TABLE public.user_credits REPLICA IDENTITY FULL;
    `);
    
    if (createError) {
      console.error("Error creating table with SQL:", createError.message);
      throw createError;
    }
    
    // Check if the table was created successfully
    const { data, error: checkError } = await supabaseAdmin
      .from('user_credits')
      .select('count(*)')
      .limit(1);
      
    if (checkError) {
      console.error("Error checking user_credits table:", checkError.message);
      throw checkError;
    }
    
    console.log("User credits table created or verified successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: 'User credits table created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
