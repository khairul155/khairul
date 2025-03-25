
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request data
    const { userId, plan, paymentId, customerEmail, amount, mid_month = false } = await req.json();

    if (!userId || !plan) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: userId and plan are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Make sure plan is valid
    if (!["free", "basic", "advanced", "pro"].includes(plan)) {
      return new Response(
        JSON.stringify({
          error: "Invalid plan type. Must be one of: free, basic, advanced, pro",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If mid-month upgrade, calculate prorated credits
    let proratedCredits = null;
    if (mid_month) {
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const remainingDays = daysInMonth - today.getDate() + 1;
      const prorationFactor = remainingDays / daysInMonth;

      // Calculate prorated credits based on plan
      if (plan === 'basic') {
        proratedCredits = Math.round(3400 * prorationFactor);
      } else if (plan === 'advanced') {
        proratedCredits = Math.round(8000 * prorationFactor);
      } else if (plan === 'pro') {
        proratedCredits = Math.round(18000 * prorationFactor);
      }

      console.log(`Prorated credits for ${plan} plan: ${proratedCredits} (${prorationFactor.toFixed(2)} of month remaining)`);
    }

    // Update the user's subscription with optional prorated credits
    const { data, error } = await supabase.rpc("update_user_subscription_with_payment", {
      _user_id: userId,
      _subscription_plan: plan,
      _payment_id: paymentId || null,
      _prorated_credits: proratedCredits
    });

    if (error) {
      console.error("Error updating subscription:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update subscription", details: error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log the transaction with more details
    await supabase.from('payment_logs').insert({
      user_id: userId,
      payment_id: paymentId,
      plan: plan,
      amount: amount, 
      prorated: mid_month,
      prorated_credits: proratedCredits,
      customer_email: customerEmail
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Subscription updated to ${plan}`,
        prorated: mid_month,
        prorated_credits: proratedCredits
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
