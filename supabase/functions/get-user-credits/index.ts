
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

    // Enable realtime for user_credits table
    const { error: realtimeError } = await supabaseClient.rpc(
      'supabase_realtime.enable_subscription',
      { table: 'user_credits', publication: 'postgres_changes', claims: { client_id: 'all' } }
    );

    if (realtimeError) {
      console.error("Error enabling realtime:", realtimeError.message);
    } else {
      console.log("Realtime enabled for user_credits table");
    }

    // Get the current date in UTC+6 (Bangladesh Standard Time)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bstTime = new Date(utcTime + (6 * 60 * 60 * 1000));
    const today = bstTime.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // If action is "deduct", deduct credits for image generation
    if (action === "deduct") {
      console.log(`Attempting to deduct ${amount} credits for user: ${userId}`);
      
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
            subscription_plan: 'free',
            daily_credits: 60,
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
      
      // Handle based on subscription plan
      if (userData.subscription_plan === 'free') {
        // For free plan, check daily credits and reset if needed
        console.log(`Current daily credits for user ${userId}: ${userData.daily_credits - userData.credits_used_today}`);
        
        // Reset credits if it's a new day
        if (userData.last_reset_date && userData.last_reset_date < today) {
          console.log(`Resetting daily credits for user ${userId} as last reset was on ${userData.last_reset_date}`);
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
              deducted: amount,
              status: 'success'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Check if user has enough daily credits
        if (userData.credits_used_today + amount > userData.daily_credits) {
          return new Response(
            JSON.stringify({ 
              error: 'Not enough credits', 
              details: 'You do not have enough credits to generate an image',
              remaining: userData.daily_credits - userData.credits_used_today
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Update user credits
        console.log(`Deducting ${amount} daily credits for free user ${userId}`);
        const { error: updateError } = await supabaseClient
          .from('user_credits')
          .update({ 
            credits_used_today: userData.credits_used_today + amount,
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
            credits: userData.daily_credits - (userData.credits_used_today + amount),
            deducted: amount,
            status: 'success'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // For paid plans, use monthly credits
        console.log(`Current monthly credits for user ${userId}: ${userData.monthly_credits - userData.credits_used_this_month}`);
        
        // Check if user has enough monthly credits
        if (userData.credits_used_this_month + amount > userData.monthly_credits) {
          return new Response(
            JSON.stringify({ 
              error: 'Not enough credits', 
              details: 'You do not have enough monthly credits to generate an image',
              remaining: userData.monthly_credits - userData.credits_used_this_month
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Update user credits (deduct from monthly credits)
        console.log(`Deducting ${amount} monthly credits for paid user ${userId}`);
        const { error: updateError } = await supabaseClient
          .from('user_credits')
          .update({ 
            credits_used_this_month: userData.credits_used_this_month + amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error("Error updating monthly credits:", updateError.message);
          return new Response(
            JSON.stringify({ error: 'Failed to update credits', details: updateError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        // Return updated credits
        return new Response(
          JSON.stringify({ 
            credits: userData.monthly_credits - (userData.credits_used_this_month + amount),
            deducted: amount,
            status: 'success'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
          credits: 60,
          resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
          plan: 'free'
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
          subscription_plan: 'free',
          daily_credits: 60,
          credits_used_today: 0,
          last_reset_date: today
        }]);
      
      if (insertError) {
        console.error("Error creating user credits:", insertError.message);
        return new Response(
          JSON.stringify({ 
            credits: 60,
            resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
            plan: 'free'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return default credits for new user
      return new Response(
        JSON.stringify({ 
          credits: 60,
          resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
          plan: 'free',
          totalCredits: 60,
          used: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get user credits
    const { data: userData, error: userError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError || !userData) {
      console.error('Error fetching user credits:', userError?.message || 'No data returned');
      // If not found, assume they are on the free plan with 60 tokens that reset daily
      return new Response(
        JSON.stringify({ 
          credits: 60,
          resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
          plan: 'free'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For free plan users - handle daily reset
    if (userData.subscription_plan === 'free') {
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
      
      // Return available daily credits
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
    } else {
      // For paid plan users - return monthly credits
      return new Response(
        JSON.stringify({ 
          credits: userData.monthly_credits - userData.credits_used_this_month,
          resetDate: userData.next_reset_date ? `${userData.next_reset_date}T00:00:00+06:00` : null,
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
