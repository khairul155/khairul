
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// CORS headers for browser requests - updated to be more permissive
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Create a Supabase client with the admin key
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Drutopay credentials
const API_KEY = Deno.env.get('DRUTOPAY_API_KEY')!;
const SECRET_KEY = Deno.env.get('DRUTOPAY_SECRET_KEY')!;
const BRAND_KEY = Deno.env.get('DRUTOPAY_BRAND_KEY')!;

const PLAN_PRICING = {
  'basic': 10,
  'advanced': 25,
  'pro': 50
};

interface InitiatePaymentRequest {
  userId: string;
  userEmail: string;
  plan: 'basic' | 'advanced' | 'pro';
  redirectUrl: string;
}

interface VerifyPaymentRequest {
  transactionId: string;
  userId: string;
}

// Helper function to calculate prorated credits
function calculateProratedCredits(plan: string): number {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const daysLeft = daysInMonth - currentDay + 1;
  const prorationFactor = daysLeft / daysInMonth;
  
  let fullCredits = 0;
  if (plan === 'basic') fullCredits = 3400;
  else if (plan === 'advanced') fullCredits = 8000;
  else if (plan === 'pro') fullCredits = 18000;
  
  return Math.round(fullCredits * prorationFactor);
}

// Generate a unique transaction reference
function generateTransactionRef(): string {
  return `PIXCRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  console.log(`Processing ${req.method} request to ${path}`);

  try {
    // Endpoint to initiate payment
    if (path === 'initiate' && req.method === 'POST') {
      console.log("Initiating payment process");
      const requestData = await req.json();
      console.log("Request data:", requestData);
      
      const { userId, userEmail, plan, redirectUrl } = requestData;
      
      if (!userId || !userEmail || !plan || !redirectUrl) {
        console.error("Missing required fields:", { userId, userEmail, plan, redirectUrl });
        return new Response(JSON.stringify({ 
          error: 'Missing required fields' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Check if plan is valid
      if (!PLAN_PRICING[plan]) {
        console.error("Invalid plan:", plan);
        return new Response(JSON.stringify({ 
          error: 'Invalid plan' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Create a transaction reference
      const transactionRef = generateTransactionRef();
      console.log("Generated transaction reference:", transactionRef);
      
      try {
        // Store pending payment record
        const { error: dbError } = await supabase
          .from('payment_logs')
          .insert({
            user_id: userId,
            plan: plan,
            amount: PLAN_PRICING[plan],
            payment_id: transactionRef,
            prorated: true,
            prorated_credits: calculateProratedCredits(plan),
            status: 'pending'
          });
        
        if (dbError) {
          console.error('Database error:', dbError);
          return new Response(JSON.stringify({ 
            error: 'Failed to create payment record',
            details: dbError
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (insertError) {
        console.error('Exception during database insert:', insertError);
        return new Response(JSON.stringify({ 
          error: 'Database exception during payment record creation',
          details: String(insertError)
        }), {
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Generate Drutopay payment URL
      const drutopayParams = new URLSearchParams({
        api_key: API_KEY,
        amount: PLAN_PRICING[plan].toString(),
        currency: 'USD',
        transaction_ref: transactionRef,
        customer_email: userEmail,
        customer_name: userEmail.split('@')[0],
        description: `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        callback_url: `${supabaseUrl}/functions/v1/process-payment/callback?userId=${userId}&plan=${plan}`,
        redirect_url: redirectUrl
      });
      
      const drutopayRedirectUrl = `https://pay.drutopay.com/pay?${drutopayParams.toString()}`;
      console.log("Generated Drutopay URL (sanitized):", drutopayRedirectUrl.replace(API_KEY, '***'));
      
      return new Response(JSON.stringify({
        url: drutopayRedirectUrl,
        transactionRef
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Endpoint to verify payment
    else if (path === 'verify' && req.method === 'POST') {
      const { transactionId, userId } = await req.json() as VerifyPaymentRequest;
      
      if (!transactionId || !userId) {
        return new Response(JSON.stringify({ 
          error: 'Missing transaction ID or user ID' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`Verifying transaction ${transactionId} for user ${userId}`);
      
      // Get the payment record
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('payment_id', transactionId)
        .eq('user_id', userId)
        .single();
      
      if (fetchError || !paymentData) {
        console.error('Error fetching payment record:', fetchError);
        return new Response(JSON.stringify({ 
          error: 'Payment record not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // If payment is already verified
      if (paymentData.status === 'completed') {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Payment already verified',
          plan: paymentData.plan
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Verify with Drutopay API
      try {
        const verifyResponse = await fetch('https://pay.drutopay.com/api/payment/verify', {
          method: 'POST',
          headers: {
            'API-KEY': API_KEY,
            'SECRET-KEY': SECRET_KEY,
            'BRAND-KEY': BRAND_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transaction_id: transactionId
          })
        });
        
        const verifyData = await verifyResponse.json();
        
        if (verifyData.status === 'success' || verifyData.status === 'completed') {
          // Update payment status
          await supabase
            .from('payment_logs')
            .update({ status: 'completed' })
            .eq('payment_id', transactionId);
          
          // Update user subscription with payment
          const planCredits = paymentData.prorated_credits || calculateProratedCredits(paymentData.plan);
          
          const { error: updateError } = await supabase.rpc('update_user_subscription_with_payment', {
            _user_id: userId,
            _subscription_plan: paymentData.plan,
            _payment_id: transactionId,
            _prorated_credits: planCredits
          });
          
          if (updateError) {
            console.error('Error upgrading plan:', updateError);
            return new Response(JSON.stringify({ 
              error: 'Failed to upgrade plan' 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Payment verified and plan upgraded',
            plan: paymentData.plan
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ 
            error: 'Payment verification failed',
            details: verifyData 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        console.error('Error verifying payment with Drutopay:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to verify payment with gateway' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Endpoint to handle Drutopay callback
    else if (path === 'callback' && req.method === 'POST') {
      const params = new URL(req.url).searchParams;
      const userId = params.get('userId');
      const plan = params.get('plan');
      
      if (!userId || !plan) {
        return new Response('Missing parameters', { status: 400 });
      }
      
      // Parse callback data from Drutopay
      const callbackData = await req.json();
      console.log('Received callback from Drutopay:', callbackData);
      
      const transactionId = callbackData.transaction_id || callbackData.transaction_ref;
      
      if (!transactionId) {
        return new Response('Missing transaction ID', { status: 400 });
      }
      
      // Update payment status
      const { error: updateError } = await supabase
        .from('payment_logs')
        .update({ status: 'completed' })
        .eq('payment_id', transactionId);
      
      if (updateError) {
        console.error('Error updating payment status:', updateError);
        return new Response('Error updating payment', { status: 500 });
      }
      
      // Update user subscription
      const { data: paymentData } = await supabase
        .from('payment_logs')
        .select('prorated_credits')
        .eq('payment_id', transactionId)
        .single();
      
      const planCredits = paymentData?.prorated_credits || calculateProratedCredits(plan);
      
      const { error: rpcError } = await supabase.rpc('update_user_subscription_with_payment', {
        _user_id: userId,
        _subscription_plan: plan,
        _payment_id: transactionId,
        _prorated_credits: planCredits
      });
      
      if (rpcError) {
        console.error('Error in RPC call:', rpcError);
        return new Response('Error upgrading plan', { status: 500 });
      }
      
      return new Response('Success', { status: 200 });
    }
    
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
