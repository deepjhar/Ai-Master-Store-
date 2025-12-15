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

    const { amount, productId } = await req.json()

    // 1. Get Secrets
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    const razorpayUrl = 'https://api.razorpay.com/v1/orders'

    if (!keyId || !keySecret) {
      throw new Error('Server misconfiguration: Missing Razorpay keys')
    }

    // 2. Prepare Request for Razorpay
    // Razorpay accepts amount in paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);
    const receiptId = `rcpt_${productId.slice(0,5)}_${Date.now()}`;
    
    const payload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        productId: productId
      }
    }

    // 3. Call Razorpay API using Basic Auth
    const authString = btoa(`${keyId}:${keySecret}`);
    
    const rpResponse = await fetch(razorpayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    })

    const rpData = await rpResponse.json()

    if (!rpResponse.ok) {
      console.error('Razorpay API Error:', rpData)
      throw new Error(rpData.error?.description || 'Failed to create Razorpay order')
    }

    // 4. Return Order Details + Public Key to Frontend
    return new Response(
      JSON.stringify({ 
        order_id: rpData.id,
        amount: rpData.amount,
        currency: rpData.currency,
        key_id: keyId // Send key_id to frontend so it doesn't need to be hardcoded there
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