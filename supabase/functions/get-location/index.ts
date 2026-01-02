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
    // Get client IP from various headers (Cloudflare, etc.)
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    console.log('Getting location for IP:', clientIP);

    // Use free IP geolocation API
    let location = 'Unknown';
    let locationData = {};

    if (clientIP && clientIP !== 'unknown' && clientIP !== '127.0.0.1') {
      try {
        // Using ip-api.com (free, no API key required)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,regionName,city`);
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          console.log('Geo data:', geoData);
          
          if (geoData.status === 'success') {
            const parts = [];
            if (geoData.city) parts.push(geoData.city);
            if (geoData.regionName) parts.push(geoData.regionName);
            if (geoData.country) parts.push(geoData.country);
            
            location = parts.join(', ') || 'Unknown';
            locationData = {
              city: geoData.city,
              region: geoData.regionName,
              country: geoData.country,
              ip: clientIP
            };
          }
        }
      } catch (geoError) {
        console.error('Geolocation API error:', geoError);
      }
    }

    console.log('Resolved location:', location);

    return new Response(
      JSON.stringify({ 
        location, 
        locationData,
        ip: clientIP 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting location:', error);
    return new Response(
      JSON.stringify({ location: 'Unknown', error: 'Failed to get location' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
