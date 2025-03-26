
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NAGORIKPAY_API_KEY = 'gnXi7etgWNhFyFGZFrOMYyrmnF4A1eGU5SC2QRmUvILOlNc2Ef'
const NAGORIKPAY_BRAND_KEY = '2RLNrWALr5cCzIGJ1vynb3iATAaZ7eEMNYjj0vJNqckPgzojb5'
const NAGORIKPAY_API_URL = 'https://secure-pay.nagorikpay.com/api/payment/verify'
const NAGORIKPAY_PAYMENT_URL = 'https://secure-pay.nagorikpay.com/api/execute/'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, planName, price, userId, userEmail, currency = 'Tk' } = await req.json()

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

    if (action === 'initiate') {
      // Store the transaction in the database
      const { error: insertError } = await supabaseAdmin
        .from('payment_transactions')
        .insert({
          transaction_id: transactionId,
          user_id: userId,
          user_email: userEmail,
          plan_name: planName,
          amount: price,
          currency,
          status: 'pending'
        })

      if (insertError) {
        console.error('Error storing transaction:', insertError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create transaction record' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Return the payment URL for the frontend to redirect to
      const paymentUrl = `${NAGORIKPAY_PAYMENT_URL}${NAGORIKPAY_BRAND_KEY}?amount=${price}&currency=${currency}&transaction_id=${transactionId}&description=${encodeURIComponent(`Subscription to ${planName} plan`)}`
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentUrl,
          transactionId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } 
    else if (action === 'verify') {
      const { transaction_id } = await req.json()
      const txnId = transaction_id || transactionId

      // Verify the payment with NagorikPay
      const response = await fetch(NAGORIKPAY_API_URL, {
        method: 'POST',
        headers: {
          'API-KEY': NAGORIKPAY_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: txnId
        })
      })

      if (!response.ok) {
        throw new Error(`NagorikPay API returned ${response.status}: ${await response.text()}`)
      }

      const paymentData = await response.json()
      
      // Update the transaction status in the database
      if (paymentData.success) {
        // Get the transaction from the database
        const { data: transaction, error: fetchError } = await supabaseAdmin
          .from('payment_transactions')
          .select('*')
          .eq('transaction_id', txnId)
          .single()

        if (fetchError || !transaction) {
          console.error('Error fetching transaction:', fetchError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to retrieve transaction record' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update transaction status
        const { error: updateTxnError } = await supabaseAdmin
          .from('payment_transactions')
          .update({
            status: 'completed',
            payment_details: paymentData
          })
          .eq('transaction_id', txnId)

        if (updateTxnError) {
          console.error('Error updating transaction:', updateTxnError)
        }

        // Determine token amount based on the plan
        let tokenAmount = 0
        switch (transaction.plan_name) {
          case 'Basic':
            tokenAmount = 3400
            break
          case 'Advanced':
            tokenAmount = 8000
            break
          case 'Pro':
            tokenAmount = 18000
            break
          default:
            tokenAmount = 60 // Free plan
        }

        // Update user's plan and token balance
        const { error: updateUserError } = await supabaseAdmin
          .from('user_credits')
          .upsert({
            user_id: transaction.user_id,
            plan: transaction.plan_name.toLowerCase(),
            subscription_plan: transaction.plan_name.toLowerCase(),
            monthly_credits: tokenAmount,
            next_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            credits_used_this_month: 0,
            last_updated: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (updateUserError) {
          console.error('Error updating user credits:', updateUserError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to update user plan and credits' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Also update profile table
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_plan: transaction.plan_name.toLowerCase()
          })
          .eq('id', transaction.user_id)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: paymentData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action specified' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Payment gateway error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
