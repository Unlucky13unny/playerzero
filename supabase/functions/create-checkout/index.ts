import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";

const stripe = new Stripe('sk_test_51RElAXBD1MRm32wTTlUA852CUGX4TIWY1nqmY4D8rIWW5TnlmiXBY0zM8u5bck2ofWxVmTqKUk8uOSjLLmJdqgfn00c3PEtWd0', {
  apiVersion: "2022-11-15",
});

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, email, userId } = await req.json();

    // Validate required fields
    if (!priceId || !email || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, email, userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // Changed from "subscription" to "payment" for one-time purchase
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard?upgrade=success`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/upgrade?upgrade=cancelled`,
      metadata: {
        userId: userId,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
