
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
    
    // Create user_credits table directly with SQL
    const { error: createTableError } = await supabaseAdmin.rpc(
      'create_user_credits_table'
    );
    
    if (createTableError) {
      console.error("Error creating user_credits table via RPC:", createTableError.message);
      
      // If RPC fails, try to create the table directly with SQL
      const { error: sqlError } = await supabaseAdmin.from('user_credits').select('count(*)').limit(1);
      if (sqlError && sqlError.message.includes('relation "user_credits" does not exist')) {
        console.log("Creating user_credits table directly with SQL");
        
        // Create the user_credits table
        const { error: createError } = await supabaseAdmin.rpc(
          'execute_sql',
          { 
            sql: `
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
              CREATE POLICY IF NOT EXISTS "Users can view their own credits"
                ON public.user_credits
                FOR SELECT
                USING (auth.uid() = user_id);
              
              -- Create policy for service role to manage all records
              CREATE POLICY IF NOT EXISTS "Service role can do anything"
                ON public.user_credits
                USING (true)
                WITH CHECK (true);
            `
          }
        );
        
        if (createError) {
          console.error("Error creating table with SQL:", createError.message);
          // If execute_sql RPC doesn't exist, we'll need to create it first
          if (createError.message.includes('function execute_sql') || createError.message.includes('does not exist')) {
            console.log("Creating execute_sql function");
            // Create a helper function to execute SQL
            const { error: createFuncError } = await supabaseAdmin.query(`
              CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
              RETURNS VOID
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$;
            `);
            
            if (createFuncError) {
              console.error("Error creating execute_sql function:", createFuncError.message);
              throw createFuncError;
            }
            
            // Try again to create the table
            const { error: retryError } = await supabaseAdmin.rpc(
              'execute_sql',
              { 
                sql: `
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
                  CREATE POLICY IF NOT EXISTS "Users can view their own credits"
                    ON public.user_credits
                    FOR SELECT
                    USING (auth.uid() = user_id);
                  
                  -- Create policy for service role to manage all records
                  CREATE POLICY IF NOT EXISTS "Service role can do anything"
                    ON public.user_credits
                    USING (true)
                    WITH CHECK (true);
                `
              }
            );
            
            if (retryError) {
              console.error("Error retrying table creation:", retryError.message);
              throw retryError;
            }
          } else {
            throw createError;
          }
        }
      }
    }
    
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
