import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessKey } = await req.json();
    
    if (!accessKey) {
      console.log('No access key provided');
      return new Response(
        JSON.stringify({ valid: false, error: 'Access key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
