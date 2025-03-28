
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
    const { userId, action, amount = 4 } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log(`Request: userId=${userId}, action=${action}, amount=${amount}`);

    // If action is "deduct", use our new deduct_user_credits function
    if (action === "deduct") {
      console.log(`Deducting ${amount} credits for user: ${userId}`);
      
      const { data: deductResult, error: deductError } = await supabaseClient.rpc(
        'deduct_user_credits',
        { 
          user_id: userId,
          amount: amount
        }
      );
      
      if (deductError) {
        console.error("Error deducting credits:", deductError);
        return new Response(
          JSON.stringify({ error: 'Failed to deduct credits', details: deductError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log("Deduction result:", deductResult);
      
      if (!deductResult.success) {
        return new Response(
          JSON.stringify({ 
            error: deductResult.message,
            remaining: deductResult.remaining
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Return success with remaining credits
      return new Response(
        JSON.stringify({ 
          credits: deductResult.remaining,
          deducted: amount,
          status: 'success'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For "get" action or no action, get current user credits
    const { data: userData, error: userError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error("Error fetching user credits:", userError);
      return new Response(
        JSON.stringify({ 
          credits: 60, // Default fallback
          plan: 'free'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If user not found, create default record
    if (!userData) {
      console.log(`User ${userId} not found, creating default credit record`);
      
      // Insert new user_credits record
      const { data: newUser, error: insertError } = await supabaseClient
        .from('user_credits')
        .insert([{
          user_id: userId,
          subscription_plan: 'free',
          daily_credits: 60,
          credits_used_today: 0,
          monthly_credits: 0,
          credits_used_this_month: 0,
          last_reset_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error("Error creating user credit record:", insertError);
        return new Response(
          JSON.stringify({ 
            credits: 60, // Default fallback
            plan: 'free'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          credits: 60,
          plan: 'free',
          totalCredits: 60,
          used: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if it's a new day for free users and reset if needed
    const today = new Date().toISOString().split('T')[0];
    if (userData.subscription_plan === 'free' && userData.last_reset_date < today) {
      console.log(`Resetting daily credits for user ${userId}`);
      
      const { error: resetError } = await supabaseClient
        .from('user_credits')
        .update({ 
          credits_used_today: 0,
          last_reset_date: today
        })
        .eq('user_id', userId);
      
      if (resetError) {
        console.error("Error resetting daily credits:", resetError);
      } else {
        userData.credits_used_today = 0;
        userData.last_reset_date = today;
      }
    }
    
    // Return credits based on subscription plan
    if (userData.subscription_plan === 'free') {
      // Free plan - return daily credits
      return new Response(
        JSON.stringify({ 
          credits: userData.daily_credits - userData.credits_used_today,
          plan: userData.subscription_plan,
          totalCredits: userData.daily_credits,
          used: userData.credits_used_today
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Paid plan - return monthly credits
      return new Response(
        JSON.stringify({ 
          credits: userData.monthly_credits - userData.credits_used_this_month,
          plan: userData.subscription_plan,
          totalCredits: userData.monthly_credits,
          used: userData.credits_used_this_month
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
