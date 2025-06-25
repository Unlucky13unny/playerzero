import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe('sk_test_51RElAXBD1MRm32wTTlUA852CUGX4TIWY1nqmY4D8rIWW5TnlmiXBY0zM8u5bck2ofWxVmTqKUk8uOSjLLmJdqgfn00c3PEtWd0', {
  apiVersion: "2022-11-15",
});

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  'https://smoqfhecjfslcqmebjrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb3FmaGVjamZzbGNxbWVianJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDk0NjI5MywiZXhwIjoyMDYwNTIyMjkzfQ.zRyEp0f6q6SHSrDBmr9IjG1VXcftSpbjen5dqwM9UW4',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

serve(async (req) => {
  console.log('=== WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error('No stripe-signature header found');
    return new Response('No stripe signature', { status: 400 });
  }

  const body = await req.text();
  console.log('Body length:', body.length);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      'whsec_BmrSe6dpdrosKLmtEK3oRExV1G7zorxv'
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Event type:', event.type);
  console.log('Event ID:', event.id);

  // Handle successful checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log('Processing checkout session:', session.id);

    try {
      // Retrieve full session details from Stripe to ensure we have all data
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'customer']
      });

      console.log('Full session data:', {
        id: fullSession.id,
        customer_email: fullSession.customer_email,
        payment_status: fullSession.payment_status,
        amount_total: fullSession.amount_total,
        metadata: fullSession.metadata
      });

      // Check if payment was successful
      if (fullSession.payment_status === 'paid') {
        const customerEmail = fullSession.customer_email;
        
        if (!customerEmail) {
          console.error('No customer email found in session');
          return new Response('No customer email found', { status: 400 });
        }

        // Find user by email in auth.users table
        console.log('Attempting to find user with email:', customerEmail);
        const { data: users, error: userError } = await supabase.auth.admin.listUsers();
        
        if (userError) {
          console.error('Error fetching users:', userError);
          return new Response(`Error fetching users: ${JSON.stringify(userError)}`, { status: 500 });
        }

        console.log('Successfully fetched users, count:', users.users.length);
        const user = users.users.find(u => u.email === customerEmail);
        
        if (!user) {
          console.error('User not found with email:', customerEmail);
          console.log('Available users:', users.users.map(u => u.email));
          return new Response('User not found', { status: 404 });
        }

        console.log('Found user:', user.id, user.email);

        // Calculate subscription expiry (1 year from now for lifetime purchase)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

        // First check if profile exists
        console.log('Checking if profile exists for user:', user.id);
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileCheckError) {
          console.error('Error checking existing profile:', profileCheckError);
          return new Response(`Error checking profile: ${JSON.stringify(profileCheckError)}`, { status: 500 });
        }

        if (!existingProfile) {
          console.error('No profile found for user:', user.id);
          return new Response('No profile found for user', { status: 404 });
        }

        console.log('Found existing profile:', existingProfile);

        // Update user profile to paid status
        console.log('Attempting to update profile for user:', user.id);
        const updateData = {
          is_paid_user: true,
          subscription_type: 'lifetime',
        };
        console.log('Update data:', updateData);

        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating profile:', updateError);
          console.error('Update error details:', JSON.stringify(updateError));
          return new Response(`Error updating profile: ${JSON.stringify(updateError)}`, { status: 500 });
        }

        console.log('Successfully updated profile for user:', user.id);
        console.log('Updated profile data:', updatedProfile);

        // Also update auth metadata
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            role: 'paid',
            subscription_type: 'lifetime'
          }
        });

        if (authUpdateError) {
          console.error('Error updating auth metadata:', authUpdateError);
          // Don't fail the webhook for this, profile update is more important
        } else {
          console.log('Successfully updated auth metadata for user:', user.id);
        }

      } else {
        console.log('Payment not completed, status:', fullSession.payment_status);
      }

    } catch (error) {
      console.error('Error processing checkout session:', error);
      return new Response('Error processing checkout', { status: 500 });
    }
  }

  // Handle subscription events (keeping existing functionality)
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object;
    console.log('Processing subscription event:', subscription.id);
    
    // Update your Supabase table here
    await fetch("https://smoqfhecjfslcqmebjrw.supabase.co/rest/v1/subscriptions", {
      method: "POST", // or PATCH if updating
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb3FmaGVjamZzbGNxbWVianJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDk0NjI5MywiZXhwIjoyMDYwNTIyMjkzfQ.zRyEp0f6q6SHSrDBmr9IjG1VXcftSpbjen5dqwM9UW4',
        Authorization: `Bearer ${'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb3FmaGVjamZzbGNxbWVianJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDk0NjI5MywiZXhwIjoyMDYwNTIyMjkzfQ.zRyEp0f6q6SHSrDBmr9IjG1VXcftSpbjen5dqwM9UW4'}`,
        "Content-Type": "application/json"
      },
      
      body: JSON.stringify({
        stripe_customer: subscription.customer,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      })
    });
  }

  return new Response("ok", { status: 200 });
});
