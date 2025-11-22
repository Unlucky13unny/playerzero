import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Get environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Validate required environment variables
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
}
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is not set');
}
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

serve(async (req) => {
  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Verify Stripe signature
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response('Webhook Error: No signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  const customerEmail = session.customer_email;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  if (!customerEmail) {
    throw new Error('No customer email in checkout session');
  }

  // Get subscription details to extract renewal date
  let renewalDate: Date | null = null;
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      renewalDate = new Date(subscription.current_period_end * 1000);
    } catch (err) {
      console.error('Could not retrieve subscription details:', err.message);
    }
  }

  // Find user in auth by email
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    throw new Error(`Auth error: ${authError.message}`);
  }

  const user = users.find(u => u.email === customerEmail);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Get their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  // Update profile with payment data
  const updateData: any = {
    is_paid: true,
    stripe_customer_id: customerId || null,
    subscription_status: 'active',
    is_paid_user: true,
  };

  // Add subscription fields if this is a subscription
  if (subscriptionId) {
    updateData.stripe_subscription_id = subscriptionId;
    updateData.subscription_renewal_date = renewalDate?.toISOString() || null;
    updateData.subscription_type = 'subscription';
  } else {
    updateData.subscription_type = 'lifetime';
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  const customerId = subscription.customer as string;
  const renewalDate = new Date(subscription.current_period_end * 1000);

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError || !profile) {
    return;
  }

  const updateData = {
    is_paid: true,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_renewal_date: renewalDate.toISOString(),
    is_paid_user: true
  };

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const renewalDate = new Date(subscription.current_period_end * 1000);

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !profile) {
    throw new Error('Profile not found');
  }

  const inactiveStatuses = ['canceled', 'incomplete', 'unpaid', 'past_due'];
  const isPaid = !inactiveStatuses.includes(status);

  const updateData = {
    subscription_status: status,
    subscription_renewal_date: renewalDate.toISOString(),
    is_paid: isPaid,
    is_paid_user: isPaid
  };

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const renewalDate = new Date(subscription.current_period_end * 1000);

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !profile) {
    throw new Error('Profile not found');
  }

  const updateData = {
    is_paid: true,
    is_paid_user: true,
    subscription_status: 'active',
    subscription_renewal_date: renewalDate.toISOString()
  };

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !profile) {
    throw new Error('Profile not found');
  }

  const updateData = {
    is_paid: false,
    is_paid_user: false,
    subscription_status: 'past_due'
  };

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', profile.id);
}
