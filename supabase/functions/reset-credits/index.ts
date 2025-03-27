
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required environment variables missing');
    }

    // Create a Supabase client using the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Running credit reset operation...');

    // Call the reset functions
    const { error: dailyResetError } = await supabase.rpc('reset_daily_credits');
    if (dailyResetError) throw dailyResetError;

    const { error: monthlyResetError } = await supabase.rpc('reset_monthly_credits');
    if (monthlyResetError) throw monthlyResetError;

    console.log('Credit reset completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Credits reset successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error resetting credits:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
