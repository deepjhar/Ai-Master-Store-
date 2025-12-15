import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClientAuth = req.headers.get('Authorization');
    if (!supabaseClientAuth) {
      throw new Error('Missing Authorization header');
    }

    const { amount, userId, productId, userEmail } = await req.json()

    // 1. Get Secrets
    const appId = Deno.env.get('CASHFREE_APP_ID')
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY')
    // Default to Sandbox URL. Switch to https://api.cashfree.com/pg/orders for production
    const cashfreeUrl = 'https://sandbox.cashfree.com/pg/orders'

    if (!appId || !secretKey) {
      throw new Error('Server misconfiguration: Missing Cashfree keys')
    }

    // 2. Prepare Request for Cashfree
    // Note: Cashfree requires a phone number. We are using a dummy one if not collected.
    const orderId = `order_${userId.slice(0,5)}_${Date.now()}`;
    
    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_email: userEmail,
        customer_phone: "9999999999" 
      },
      order_meta: {
        return_url: `${req.headers.get('origin') || ''}/purchases?order_id={order_id}`,
        notify_url: ""
      },
      order_note: `Purchase of Product ${productId}`
    }

    // 3. Call Cashfree API
    const cfResponse = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2022-09-01'
      },
      body: JSON.stringify(payload)
    })

    const cfData = await cfResponse.json()

    if (!cfResponse.ok) {
      console.error('Cashfree API Error:', cfData)
      throw new Error(cfData.message || 'Failed to create Cashfree order')
    }

    // 4. Return Session ID to Frontend
    return new Response(
      JSON.stringify({ 
        payment_session_id: cfData.payment_session_id,
        order_id: cfData.order_id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})