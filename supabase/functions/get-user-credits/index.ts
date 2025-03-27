
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
    const { userId, action } = await req.json();
    
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

    // Get the current date in UTC+6 (Bangladesh Standard Time)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bstTime = new Date(utcTime + (6 * 60 * 60 * 1000));
    const today = bstTime.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Get the user's subscription plan
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .maybeSingle();
    
    let userPlan = 'free';
    if (!profileError && profileData && profileData.subscription_plan) {
      userPlan = profileData.subscription_plan;
      console.log(`User ${userId} is on ${userPlan} plan`);
    }
    
    // Set daily credits based on subscription plan
    let dailyCredits = 60; // Default for free plan
    if (userPlan === 'basic') {
      dailyCredits = 150;
    } else if (userPlan === 'advanced') {
      dailyCredits = 300;
    } else if (userPlan === 'pro') {
      dailyCredits = 600;
    }
    
    // If action is "deduct", deduct 4 credits for image generation
    if (action === "deduct") {
      console.log(`Attempting to deduct credits for user: ${userId}`);
      
      // First check if user exists in user_credits table
      const { data: userExists, error: checkError } = await supabaseClient
        .from('user_credits')
        .select('user_id')
        .eq('user_id', userId);
      
      if (checkError) {
        console.error("Error checking if user exists:", checkError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to check user credits', details: checkError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // If user doesn't exist in user_credits table, create entry
      if (!userExists || userExists.length === 0) {
        console.log(`User ${userId} not found in user_credits, creating new entry`);
        const { error: insertError } = await supabaseClient
          .from('user_credits')
          .insert([{ 
            user_id: userId, 
            subscription_plan: userPlan,
            daily_credits: dailyCredits,
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
      } else {
        // Update user's daily credits if their plan has changed
        const { error: updatePlanError } = await supabaseClient
          .from('user_credits')
          .update({ 
            subscription_plan: userPlan,
            daily_credits: dailyCredits,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updatePlanError) {
          console.error("Error updating user plan:", updatePlanError.message);
        }
      }
      
      // Now get current user credits
      const { data: userData, error: userError } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (userError) {
        console.error("Error retrieving user credits:", userError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve user credits', details: userError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      if (!userData) {
        console.error("User credits not found even after insert attempt");
        return new Response(
          JSON.stringify({ 
            error: 'User credits not found', 
            details: 'Could not find or create user credits'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log(`Current credits for user ${userId}: ${userData.daily_credits - userData.credits_used_today}`);
      
      // Check if user has enough credits
      if (userData.credits_used_today + 4 > userData.daily_credits) {
        return new Response(
          JSON.stringify({ 
            error: 'Not enough credits', 
            details: 'You do not have enough credits to generate an image',
            remaining: userData.daily_credits - userData.credits_used_today
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Reset credits if it's a new day
      if (userData.last_reset_date && userData.last_reset_date < today) {
        console.log(`Resetting credits for user ${userId} as last reset was on ${userData.last_reset_date}`);
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
        
        // Return fresh credits after reset
        return new Response(
          JSON.stringify({ 
            credits: userData.daily_credits,
            deducted: 4,
            status: 'success'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update user credits (deduct 4)
      console.log(`Deducting 4 credits for user ${userId}`);
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update({ 
          credits_used_today: userData.credits_used_today + 4,
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
          credits: userData.daily_credits - (userData.credits_used_today + 4),
          deducted: 4,
          status: 'success'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no action or action is "get", just return the current credits
    console.log(`Getting credits for user ${userId}`);
    
    // First check if user exists in user_credits table
    const { data: userExists, error: checkError } = await supabaseClient
      .from('user_credits')
      .select('user_id')
      .eq('user_id', userId);
    
    if (checkError) {
      console.error("Error checking if user exists:", checkError.message);
      return new Response(
        JSON.stringify({ 
          credits: dailyCredits,
          resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
          plan: userPlan
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If user doesn't exist in user_credits table, create entry
    if (!userExists || userExists.length === 0) {
      console.log(`User ${userId} not found in user_credits, creating new entry`);
      const { error: insertError } = await supabaseClient
        .from('user_credits')
        .insert([{ 
          user_id: userId, 
          subscription_plan: userPlan,
          daily_credits: dailyCredits,
          credits_used_today: 0,
          last_reset_date: today
        }]);
      
      if (insertError) {
        console.error("Error creating user credits:", insertError.message);
        return new Response(
          JSON.stringify({ 
            credits: dailyCredits,
            resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
            plan: userPlan
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return default credits for new user
      return new Response(
        JSON.stringify({ 
          credits: dailyCredits,
          resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
          plan: userPlan,
          totalCredits: dailyCredits,
          used: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Update user's daily credits if their plan has changed
      const { error: updatePlanError } = await supabaseClient
        .from('user_credits')
        .update({ 
          subscription_plan: userPlan,
          daily_credits: dailyCredits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (updatePlanError) {
        console.error("Error updating user plan:", updatePlanError.message);
      }
    }
    
    // Get user credits
    const { data: userData, error: userError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError || !userData) {
      console.error('Error fetching user credits:', userError?.message || 'No data returned');
      // If not found, use the subscription-based credits
      return new Response(
        JSON.stringify({ 
          credits: dailyCredits,
          resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
          plan: userPlan
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Reset credits if it's a new day
    if (userData.last_reset_date && userData.last_reset_date < today) {
      console.log(`Resetting credits for user ${userId} as last reset was on ${userData.last_reset_date}`);
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
        userData.credits_used_today = 0;
      }
    }
    
    // Return the user's actual credits, considering their plan
    return new Response(
      JSON.stringify({ 
        credits: userData.daily_credits - userData.credits_used_today,
        resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
        plan: userData.subscription_plan,
        totalCredits: userData.daily_credits,
        used: userData.credits_used_today
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
