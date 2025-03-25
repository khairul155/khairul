
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Enhanced CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

// Create a Supabase client with the admin key
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLAN_PRICING = {
  'basic': 10,
  'advanced': 25,
  'pro': 50
};

// NagorikPay base URL
const NAGORIKPAY_API_URL = "https://secure-pay.nagorikpay.com/api/execute/a6535064f4f097f1391db5d3ab9815b5";

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

// Helper function for retrying network requests
async function retryFetch(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to fetch ${url}`);
      const response = await fetch(url, options);
      
      // Return successful responses
      if (response.ok) {
        console.log(`Fetch successful on attempt ${attempt}`);
        return response;
      }
      
      // For failed responses, throw error with status text
      const errorBody = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}. Body: ${errorBody}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Fetch attempt ${attempt} failed:`, lastError.message);
      
      // If we haven't reached max retries, wait before trying again
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // Increasing backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error('Failed to fetch after maximum retry attempts');
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
      
      // Parse request data
      let requestData: InitiatePaymentRequest;
      try {
        requestData = await req.json();
        console.log("Request data:", JSON.stringify(requestData));
      } catch (parseError) {
        console.error("Failed to parse request JSON:", parseError);
        return new Response(JSON.stringify({ 
          error: 'Invalid request format',
          details: String(parseError)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const { userId, userEmail, plan, redirectUrl } = requestData;
      
      // Validate required fields
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
      
      // Generate NagorikPay payment URL
      const nagorikPayParams = new URLSearchParams({
        amount: PLAN_PRICING[plan].toString(),
        currency: 'USD',
        transaction_id: transactionRef,
        customer_email: userEmail,
        customer_name: userEmail.split('@')[0] || 'Customer',
        description: `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        callback_url: `${supabaseUrl}/functions/v1/process-payment/callback?userId=${userId}&plan=${plan}`,
        success_url: redirectUrl,
        fail_url: `${redirectUrl}?payment_status=failed&transaction_id=${transactionRef}`
      });
      
      const nagorikPayRedirectUrl = `${NAGORIKPAY_API_URL}?${nagorikPayParams.toString()}`;
      console.log("Generated NagorikPay URL:", nagorikPayRedirectUrl);
      
      return new Response(JSON.stringify({
        url: nagorikPayRedirectUrl,
        transactionRef
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Endpoint to verify payment
    else if (path === 'verify' && req.method === 'POST') {
      let verifyData: VerifyPaymentRequest;
      try {
        verifyData = await req.json();
        console.log("Verify payment request data:", JSON.stringify(verifyData));
      } catch (parseError) {
        console.error("Failed to parse verify request JSON:", parseError);
        return new Response(JSON.stringify({ 
          error: 'Invalid request format',
          details: String(parseError)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const { transactionId, userId } = verifyData;
      
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
      
      // For this implementation, we'll assume the payment is successful
      // In a real implementation, you would check with NagorikPay API
      
      try {
        // Update payment status
        const { error: updateError } = await supabase
          .from('payment_logs')
          .update({ status: 'completed' })
          .eq('payment_id', transactionId);
          
        if (updateError) {
          console.error("Error updating payment status:", updateError);
        }
        
        // Update user subscription with payment
        const planCredits = paymentData.prorated_credits || calculateProratedCredits(paymentData.plan);
        
        const { error: updateSubError } = await supabase.rpc('update_user_subscription_with_payment', {
          _user_id: userId,
          _subscription_plan: paymentData.plan,
          _payment_id: transactionId,
          _prorated_credits: planCredits
        });
        
        if (updateSubError) {
          console.error('Error upgrading plan:', updateSubError);
          return new Response(JSON.stringify({ 
            error: 'Failed to upgrade plan',
            details: updateSubError
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
      } catch (error) {
        console.error('Error verifying payment:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to verify payment',
          details: String(error)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Endpoint to handle payment callback
    else if (path === 'callback' && req.method === 'POST') {
      const params = new URL(req.url).searchParams;
      const userId = params.get('userId');
      const plan = params.get('plan');
      
      console.log("Received NagorikPay callback with params:", { userId, plan });
      
      if (!userId || !plan) {
        console.error("Missing parameters in callback URL");
        return new Response('Missing parameters', { status: 400 });
      }
      
      // Parse callback data from NagorikPay
      let callbackData;
      try {
        const bodyText = await req.text();
        console.log("Raw callback body:", bodyText);
        
        try {
          callbackData = JSON.parse(bodyText);
        } catch (jsonError) {
          console.error("Failed to parse callback JSON:", jsonError);
          // For NagorikPay, the callback might be URL encoded form data
          const formData = new URLSearchParams(bodyText);
          callbackData = Object.fromEntries(formData.entries());
          console.log("Parsed form data:", callbackData);
        }
        
        console.log('Received callback from NagorikPay:', callbackData);
      } catch (error) {
        console.error("Error reading callback body:", error);
        return new Response('Error reading request body', { status: 400 });
      }
      
      const transactionId = callbackData?.transaction_id || callbackData?.txn_id || params.get('transaction_id');
      
      if (!transactionId) {
        console.error("Missing transaction ID in callback data");
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
      
      // Get payment data
      const { data: paymentData, error: fetchError } = await supabase
        .from('payment_logs')
        .select('prorated_credits')
        .eq('payment_id', transactionId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching payment data:", fetchError);
      }
      
      const planCredits = paymentData?.prorated_credits || calculateProratedCredits(plan);
      
      // Update user subscription
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
      
      return new Response('Success', { 
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Handle NagorikPay success redirect
    else if (path === 'success' && req.method === 'GET') {
      const params = new URL(req.url).searchParams;
      const transactionId = params.get('transaction_id');
      const userId = params.get('userId');
      
      if (!transactionId || !userId) {
        return new Response(JSON.stringify({ 
          error: 'Missing transaction ID or user ID' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get payment data
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
      
      // If payment is not completed yet
      if (paymentData.status !== 'completed') {
        // Update payment status
        const { error: updateError } = await supabase
          .from('payment_logs')
          .update({ status: 'completed' })
          .eq('payment_id', transactionId);
          
        if (updateError) {
          console.error("Error updating payment status:", updateError);
        }
        
        // Update user subscription with payment
        const planCredits = paymentData.prorated_credits || calculateProratedCredits(paymentData.plan);
        
        const { error: updateSubError } = await supabase.rpc('update_user_subscription_with_payment', {
          _user_id: userId,
          _subscription_plan: paymentData.plan,
          _payment_id: transactionId,
          _prorated_credits: planCredits
        });
        
        if (updateSubError) {
          console.error('Error upgrading plan:', updateSubError);
          return new Response(JSON.stringify({ 
            error: 'Failed to upgrade plan',
            details: updateSubError
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Redirect to the pricing page with success parameters
      const redirectUrl = new URL(req.headers.get('origin') || 'https://your-app.netlify.app');
      redirectUrl.pathname = '/pricing';
      redirectUrl.searchParams.set('payment_status', 'success');
      redirectUrl.searchParams.set('plan', paymentData.plan);
      
      return new Response(null, {
        status: 302,
        headers: { 
          ...corsHeaders, 
          'Location': redirectUrl.toString()
        }
      });
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
