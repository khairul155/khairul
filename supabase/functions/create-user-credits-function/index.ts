
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
    
    // Create check_table_exists function if it doesn't exist already
    await supabaseAdmin.rpc('check_table_exists', { table_name: 'rpc' }).catch(async () => {
      console.log('Creating check_table_exists function');
      
      await supabaseAdmin.from('_exec').select('*').execute(`
        CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          table_exists BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) INTO table_exists;
          
          RETURN table_exists;
        END;
        $$;
      `);
    });
    
    // Check if user_credits table exists
    const { data: tableExists, error: checkError } = await supabaseAdmin.rpc(
      'check_table_exists', 
      { table_name: 'user_credits' }
    );
    
    // Create user_credits table if it doesn't exist
    if (!tableExists || checkError) {
      console.log('Creating user_credits table');
      
      await supabaseAdmin.from('_exec').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.user_credits (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          subscription_plan TEXT NOT NULL DEFAULT 'free',
          daily_credits INTEGER NOT NULL DEFAULT 60,
          monthly_credits INTEGER DEFAULT NULL,
          credits_used_today INTEGER NOT NULL DEFAULT 0,
          credits_used_this_month INTEGER DEFAULT 0,
          last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
          next_reset_date DATE DEFAULT NULL,
          slow_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(user_id)
        );
        
        -- Add row level security
        ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for users to read/update their own credits
        CREATE POLICY "Users can view their own credits"
        ON public.user_credits
        FOR SELECT
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Service role can manage all credits"
        ON public.user_credits
        USING (true);
      `);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User credits table and functions created successfully' 
      }),
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
