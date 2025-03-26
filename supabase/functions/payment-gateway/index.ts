
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user's ID from the auth token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'You must be logged in to create a payment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get plan details from the request
    const { planName, userId, billingCycle } = await req.json()

    // Validate inputs
    if (!planName || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Ensure the authenticated user matches the requested userId
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Map plan names to prices (in local currency)
    const planPrices = {
      'Basic': 400,
      'Advanced': 750,
      'Pro': 1400
    }

    const price = planPrices[planName as keyof typeof planPrices]
    if (!price) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Apply yearly discount if applicable
    const finalPrice = billingCycle === 'yearly' ? price * 12 * 0.8 : price // 20% yearly discount

    // Generate a transaction ID (this would typically come from your payment processor)
    const transactionId = crypto.randomUUID()

    // Generate payload for the payment gateway (simulating NagorikPay integration)
    const paymentUrl = `https://secure-pay.nagorikpay.com/api/execute/${transactionId}`

    // Return the payment URL to the client
    return new Response(
      JSON.stringify({ paymentUrl, transactionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
