
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
    const { userId, action, amount = 1 } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing request for user ${userId}, action: ${action}, amount: ${amount}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current date
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // If action is "deduct", deduct credits for image generation
    if (action === "deduct") {
      console.log(`Attempting to deduct ${amount} credits for user: ${userId}`);
      
      // First check if user exists in user_credits table
      let { data: userExists, error: checkError } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking if user exists:", checkError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to check user credits', details: checkError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // If user doesn't exist in user_credits table, create entry
      if (!userExists) {
        console.log(`User ${userId} not found in user_credits, creating new entry`);
        const { error: insertError } = await supabaseClient
          .from('user_credits')
          .insert([{ 
            user_id: userId, 
            subscription_plan: 'free',
            daily_limit: 1,
            credits_used_today: 0,
            last_reset_date: today
          }]);
        
        if (insertError) {
          console.error("Error creating user credits:", insertError.message);
          return new Response(
            JSON.stringify({ error: 'Failed to create user credits', details: insertError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Fetch the newly created user
        const { data: newUser, error: fetchError } = await supabaseClient
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (fetchError || !newUser) {
          console.error("Error fetching new user credits:", fetchError?.message);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch new user', details: fetchError?.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        userExists = newUser;
      }
      
      // Reset daily credits if needed for all subscription plans
      if (userExists.last_reset_date < today) {
        console.log(`Resetting daily credits for user ${userId} as last reset was on ${userExists.last_reset_date}`);
        const { error: resetError } = await supabaseClient
          .from('user_credits')
          .update({ 
            credits_used_today: 0,
            last_reset_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (resetError) {
          console.error("Error resetting credits:", resetError.message);
          return new Response(
            JSON.stringify({ error: 'Failed to reset credits', details: resetError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        userExists.credits_used_today = 0;
      }
      
      // Check if user has enough daily credits based on subscription plan
      const dailyLimit = userExists.daily_limit;
      console.log(`Daily limit for user ${userId} with ${userExists.subscription_plan} plan: ${dailyLimit}`);
      console.log(`Current daily credits used: ${userExists.credits_used_today}`);
      
      // Check if user has enough daily credits
      if (userExists.credits_used_today + amount > dailyLimit) {
        return new Response(
          JSON.stringify({ 
            error: 'Daily limit reached', 
            details: `You have reached your daily limit of ${dailyLimit} ${dailyLimit === 1 ? 'image' : 'images'}`,
            remaining: dailyLimit - userExists.credits_used_today
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Update user credits
      console.log(`Deducting ${amount} daily credits for user ${userId}`);
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update({ 
          credits_used_today: userExists.credits_used_today + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error("Error updating credits:", updateError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to update credits', details: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Return updated credits
      return new Response(
        JSON.stringify({ 
          credits: dailyLimit - (userExists.credits_used_today + amount),
          deducted: amount,
          daily_limit: dailyLimit,
          status: 'success'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no action or action is "get", just return the current credits
    console.log(`Getting credits for user ${userId}`);
    
    // Check if user exists in user_credits table
    const { data: userExists, error: checkError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking if user exists:", checkError.message);
      return new Response(
        JSON.stringify({ 
          credits: 1,
          daily_limit: 1,
          plan: 'free'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If user doesn't exist in user_credits table, create entry
    if (!userExists) {
      console.log(`User ${userId} not found in user_credits, creating new entry`);
      const { error: insertError } = await supabaseClient
        .from('user_credits')
        .insert([{ 
          user_id: userId, 
          subscription_plan: 'free',
          daily_limit: 1,
          credits_used_today: 0,
          last_reset_date: today
        }]);
      
      if (insertError) {
        console.error("Error creating user credits:", insertError.message);
        return new Response(
          JSON.stringify({ 
            credits: 1,
            daily_limit: 1,
            plan: 'free'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return default credits for new user
      return new Response(
        JSON.stringify({ 
          credits: 1,
          daily_limit: 1,
          plan: 'free',
          used: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Reset daily credits if it's a new day
    if (userExists.last_reset_date && userExists.last_reset_date < today) {
      console.log(`Resetting credits for user ${userId} as last reset was on ${userExists.last_reset_date}`);
      const { error: resetError } = await supabaseClient
        .from('user_credits')
        .update({ 
          credits_used_today: 0,
          last_reset_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (resetError) {
        console.error("Error resetting credits:", resetError.message);
      } else {
        userExists.credits_used_today = 0;
      }
    }
    
    // Return available credits
    const dailyLimit = userExists.daily_limit;
    return new Response(
      JSON.stringify({ 
        credits: dailyLimit - userExists.credits_used_today,
        daily_limit: dailyLimit,
        plan: userExists.subscription_plan,
        used: userExists.credits_used_today
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
