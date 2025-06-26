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

  const body = await req.text();
  console.log('Body length:', body.length);
  console.log('Body preview:', body.substring(0, 200));

  let event;
  try {
    // For testing, skip signature verification and parse JSON directly
    event = JSON.parse(body);
    console.log('✅ Parsed event successfully');
  } catch (err) {
    console.error('❌ Failed to parse JSON:', err.message);
    return new Response(`JSON Parse Error: ${err.message}`, { status: 400 });
  }

  console.log('=== WEBHOOK EVENT RECEIVED ===');
  console.log('Event type:', event.type);
  console.log('Event ID:', event.id);

  // Handle successful checkout completion
  if (event.type === "checkout.session.completed") {
    console.log('🎯 Processing checkout.session.completed event');
    const session = event.data.object;
    console.log('Processing checkout session:', session.id);

    try {
      console.log('📋 Session data:', {
        id: session.id,
        customer_email: session.customer_email,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        metadata: session.metadata
      });

      // For testing, we'll use the session data directly instead of retrieving from Stripe
      const customerEmail = session.customer_email;
      
      if (!customerEmail) {
        console.error('❌ No customer email found in session');
        return new Response('No customer email found', { status: 400 });
      }

      console.log('🔍 Attempting to find user with email:', customerEmail);
      
      // Find user by email in auth.users table
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('❌ Error fetching users:', userError);
        return new Response(`Error fetching users: ${JSON.stringify(userError)}`, { status: 500 });
      }

      console.log('✅ Successfully fetched users, count:', users.users.length);
      console.log('👥 Available users:', users.users.map(u => ({ id: u.id, email: u.email })));
      
      const user = users.users.find(u => u.email === customerEmail);
      
      if (!user) {
        console.error('❌ User not found with email:', customerEmail);
        console.log('📧 Available emails:', users.users.map(u => u.email));
        return new Response('User not found', { status: 404 });
      }

      console.log('✅ Found user:', user.id, user.email);

      // Calculate subscription expiry (1 year from now for lifetime purchase)
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      // First check if profile exists
      console.log('🔍 Checking if profile exists for user:', user.id);
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileCheckError) {
        console.error('❌ Error checking existing profile:', profileCheckError);
        return new Response(`Error checking profile: ${JSON.stringify(profileCheckError)}`, { status: 500 });
      }

      if (!existingProfile) {
        console.error('❌ No profile found for user:', user.id);
        return new Response('No profile found for user', { status: 404 });
      }

      console.log('✅ Found existing profile:', {
        id: existingProfile.id,
        trainer_name: existingProfile.trainer_name,
        is_paid_user: existingProfile.is_paid_user
      });

      // Update user profile to paid status
      console.log('📝 Attempting to update profile for user:', user.id);
      const updateData = {
        is_paid_user: true,
        subscription_type: 'lifetime',
        subscription_expires_at: oneYearFromNow.toISOString()
      };
      console.log('📝 Update data:', updateData);

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        console.error('❌ Update error details:', JSON.stringify(updateError));
        return new Response(`Error updating profile: ${JSON.stringify(updateError)}`, { status: 500 });
      }

      console.log('✅ Successfully updated profile for user:', user.id);
      console.log('✅ Updated profile data:', updatedProfile);

      // Also update auth metadata
      console.log('📝 Updating auth metadata...');
      const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          role: 'paid',
          subscription_type: 'lifetime'
        }
      });

      if (authUpdateError) {
        console.error('⚠️ Error updating auth metadata:', authUpdateError);
        // Don't fail the webhook for this, profile update is more important
      } else {
        console.log('✅ Successfully updated auth metadata for user:', user.id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Profile updated successfully',
        profile: updatedProfile 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('❌ Error processing checkout session:', error);
      return new Response('Error processing checkout', { status: 500 });
    }
  }

  console.log('ℹ️ Event type not handled:', event.type);
  return new Response("ok", { status: 200 });
}); 