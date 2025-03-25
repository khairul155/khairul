
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the auth context
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current UTC time
    const now = new Date();
    console.log(`Current UTC time: ${now.toISOString()}`);

    // Reset daily credits
    const { data: dailyResetData, error: dailyResetError } = await supabase.rpc("reset_daily_credits");
    
    if (dailyResetError) {
      console.error("Error resetting daily credits:", dailyResetError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to reset daily credits",
          details: dailyResetError
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if it's the first day of the month to reset monthly credits
    if (now.getUTCDate() === 1) {
      const { data: monthlyResetData, error: monthlyResetError } = await supabase.rpc("reset_monthly_credits");
      
      if (monthlyResetError) {
        console.error("Error resetting monthly credits:", monthlyResetError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to reset monthly credits", 
            details: monthlyResetError,
            daily_reset: "success" 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Daily and monthly credits reset successfully at UTC+0",
          daily_reset: dailyResetData,
          monthly_reset: monthlyResetData,
          time: now.toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Daily credits reset successfully at UTC+0",
        daily_reset: dailyResetData,
        time: now.toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
