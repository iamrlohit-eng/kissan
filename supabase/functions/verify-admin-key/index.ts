import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Only this email can access admin portal
const MAIN_ADMIN_EMAIL = 'iamrlohit@gmail.com';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessKey, userEmail } = await req.json();
    
    console.log('Admin verification request for email:', userEmail);

    if (!accessKey) {
      console.log('No access key provided');
      return new Response(
        JSON.stringify({ valid: false, error: 'Access key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userEmail) {
      console.log('No user email provided');
      return new Response(
        JSON.stringify({ valid: false, error: 'User email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is the main admin
    if (userEmail.toLowerCase() !== MAIN_ADMIN_EMAIL.toLowerCase()) {
      console.log('Access denied - not the main admin email');
      return new Response(
        JSON.stringify({ valid: false, error: 'Access denied. Only the main admin can access this portal.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const storedKey = Deno.env.get('ADMIN_ACCESS_KEY');
    
    if (!storedKey) {
      console.error('ADMIN_ACCESS_KEY not configured');
      return new Response(
        JSON.stringify({ valid: false, error: 'Admin key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isValid = accessKey === storedKey;
    console.log('Admin key verification:', isValid ? 'SUCCESS' : 'FAILED');

    if (isValid) {
      // Ensure the user has admin role in database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user ID from email
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (!userError && userData) {
        const adminUser = userData.users.find(u => u.email?.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase());
        if (adminUser) {
          // Check if already has admin role
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', adminUser.id)
            .eq('role', 'admin')
            .maybeSingle();

          if (!existingRole) {
            // Add admin role
            await supabase
              .from('user_roles')
              .insert({ user_id: adminUser.id, role: 'admin' });
            console.log('Added admin role for main admin');
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ valid: isValid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying admin key:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
