import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Language detection based on GPS coordinates
const detectLanguageFromCoordinates = (lat: number, lon: number): { language: string; languageName: string } => {
  // India
  if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97) {
    // Hindi belt (North India)
    if (lat >= 22 && lat <= 32 && lon >= 72 && lon <= 88) return { language: 'hi', languageName: 'Hindi' };
    // Tamil Nadu
    if (lat >= 8 && lat <= 14 && lon >= 76 && lon <= 80) return { language: 'ta', languageName: 'Tamil' };
    // Karnataka
    if (lat >= 11 && lat <= 18 && lon >= 74 && lon <= 78) return { language: 'kn', languageName: 'Kannada' };
    // Andhra Pradesh/Telangana
    if (lat >= 12 && lat <= 20 && lon >= 77 && lon <= 85) return { language: 'te', languageName: 'Telugu' };
    // Maharashtra
    if (lat >= 15 && lat <= 22 && lon >= 72 && lon <= 81) return { language: 'mr', languageName: 'Marathi' };
    // Gujarat
    if (lat >= 20 && lat <= 25 && lon >= 68 && lon <= 75) return { language: 'gu', languageName: 'Gujarati' };
    // Bengal
    if (lat >= 21 && lat <= 27 && lon >= 85 && lon <= 92) return { language: 'bn', languageName: 'Bengali' };
    // Punjab
    if (lat >= 29 && lat <= 33 && lon >= 73 && lon <= 77) return { language: 'pa', languageName: 'Punjabi' };
    return { language: 'hi', languageName: 'Hindi' };
  }
  // China
  if (lat >= 18 && lat <= 54 && lon >= 73 && lon <= 135) return { language: 'zh', languageName: 'Chinese' };
  // Spain/Latin America
  if ((lat >= 35 && lat <= 44 && lon >= -10 && lon <= 5) || 
      (lat >= -56 && lat <= 33 && lon >= -120 && lon <= -35)) return { language: 'es', languageName: 'Spanish' };
  // Brazil
  if (lat >= -34 && lat <= 6 && lon >= -74 && lon <= -34) return { language: 'pt', languageName: 'Portuguese' };
  // France
  if (lat >= 41 && lat <= 51 && lon >= -5 && lon <= 10) return { language: 'fr', languageName: 'French' };
  // Germany
  if (lat >= 47 && lat <= 55 && lon >= 5 && lon <= 16) return { language: 'de', languageName: 'German' };
  // Indonesia
  if (lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141) return { language: 'id', languageName: 'Indonesian' };
  // Japan
  if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 154) return { language: 'ja', languageName: 'Japanese' };
  // Korea
  if (lat >= 33 && lat <= 43 && lon >= 124 && lon <= 132) return { language: 'ko', languageName: 'Korean' };
  // Russia
  if (lat >= 41 && lat <= 82 && lon >= 19 && lon <= 180) return { language: 'ru', languageName: 'Russian' };
  // Arabic countries
  if (lat >= 12 && lat <= 38 && lon >= -17 && lon <= 60) return { language: 'ar', languageName: 'Arabic' };
  // Default to English
  return { language: 'en', languageName: 'English' };
};

// Simple rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // 5 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

const checkRateLimit = (clientIP: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIP);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { 
      nitrogen, phosphorus, potassium, ph, organicMatter, moisture, temperature, 
      currentCrop, location, latitude, longitude, preferredLanguage,
      fileBase64, fileType, isEmergencyScan
    } = requestBody;

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // For emergency scans, allow anonymous access with rate limiting
    if (isEmergencyScan) {
      // Rate limit anonymous requests by IP
      const clientIP = req.headers.get('cf-connecting-ip') || 
                       req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       'unknown';
      
      console.log('Emergency scan request from IP:', clientIP);
      
      if (!checkRateLimit(clientIP)) {
        console.log('Rate limit exceeded for IP:', clientIP);
        return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Validate required fields for emergency scan
      if (!fileBase64 || !fileType) {
        return new Response(JSON.stringify({ error: 'File is required for emergency scan' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Validate file type
      const allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedFileTypes.includes(fileType)) {
        return new Response(JSON.stringify({ error: 'Invalid file type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Validate file size (base64 is ~33% larger than original)
      const maxBase64Size = 15 * 1024 * 1024; // ~10MB original file
      if (fileBase64.length > maxBase64Size) {
        return new Response(JSON.stringify({ error: 'File too large' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Validate coordinates if provided
      if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
        return new Response(JSON.stringify({ error: 'Invalid latitude' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
        return new Response(JSON.stringify({ error: 'Invalid longitude' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Emergency scan validation passed, proceeding with analysis...');
    } else {
      // Regular authenticated request
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Detect language based on GPS or use preferred language
    let targetLanguage = { language: 'en', languageName: 'English' };
    if (preferredLanguage && preferredLanguage !== 'auto') {
      const langMap: Record<string, string> = {
        'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
        'kn': 'Kannada', 'mr': 'Marathi', 'gu': 'Gujarati', 'bn': 'Bengali',
        'pa': 'Punjabi', 'es': 'Spanish', 'pt': 'Portuguese', 'fr': 'French',
        'de': 'German', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean',
        'ru': 'Russian', 'ar': 'Arabic', 'id': 'Indonesian'
      };
      targetLanguage = { language: preferredLanguage, languageName: langMap[preferredLanguage] || 'English' };
    } else if (latitude && longitude) {
      targetLanguage = detectLanguageFromCoordinates(latitude, longitude);
    }

    console.log('Target language:', targetLanguage);

    // Build the prompt based on available data
    let dataSource = '';
    let messages: any[] = [];

    if (fileBase64 && fileType) {
      // Image/PDF analysis mode
      console.log('Analyzing uploaded file:', fileType);
      
      const imagePrompt = `You are an expert agricultural consultant. Analyze this soil/fertilizer report image/document.

Extract the following information if visible:
- Nitrogen (N) level in ppm
- Phosphorus (P) level in ppm
- Potassium (K) level in ppm
- pH Level
- Organic Matter percentage
- Moisture percentage
- Any other soil parameters

Then provide your analysis and recommendations.

IMPORTANT: Respond entirely in ${targetLanguage.languageName} language.

Provide your complete response in this JSON format:
{
  "extractedData": {
    "nitrogen": number or null,
    "phosphorus": number or null,
    "potassium": number or null,
    "ph": number or null,
    "organicMatter": number or null,
    "moisture": number or null
  },
  "overallHealth": "excellent" | "good" | "fair" | "poor",
  "summary": "A 2-3 sentence summary in ${targetLanguage.languageName}",
  "recommendedCrops": ["crop1", "crop2", "crop3", "crop4", "crop5"],
  "improvementTechniques": [
    {"title": "Technique name in ${targetLanguage.languageName}", "description": "Description in ${targetLanguage.languageName}", "priority": "high" | "medium" | "low"}
  ],
  "nutrientAnalysis": {
    "nitrogen": {"status": "low" | "optimal" | "high", "advice": "advice in ${targetLanguage.languageName}"},
    "phosphorus": {"status": "low" | "optimal" | "high", "advice": "advice in ${targetLanguage.languageName}"},
    "potassium": {"status": "low" | "optimal" | "high", "advice": "advice in ${targetLanguage.languageName}"}
  },
  "seasonalRecommendations": "Recommendations in ${targetLanguage.languageName}"
}`;

      messages = [
        { role: 'system', content: `You are an expert agricultural consultant. Always respond with valid JSON only, no markdown. Respond in ${targetLanguage.languageName}.` },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: imagePrompt },
            { type: 'image_url', image_url: { url: fileBase64 } }
          ]
        }
      ];
    } else {
      // Manual data entry mode
      dataSource = `SOIL DATA:
- Nitrogen (N): ${nitrogen ?? 'Not provided'} ppm
- Phosphorus (P): ${phosphorus ?? 'Not provided'} ppm  
- Potassium (K): ${potassium ?? 'Not provided'} ppm
- pH Level: ${ph ?? 'Not provided'}
- Organic Matter: ${organicMatter ?? 'Not provided'}%
- Moisture: ${moisture ?? 'Not provided'}%
- Soil Temperature: ${temperature ?? 'Not provided'}°C
- Current Crop: ${currentCrop || 'Not specified'}
- Location: ${location || 'Not specified'}`;

      const prompt = `You are an expert agricultural consultant analyzing a soil fertilizer report. Based on the following soil data, provide practical recommendations.

${dataSource}

IMPORTANT: Respond entirely in ${targetLanguage.languageName} language.

Please provide your analysis in the following JSON format:
{
  "overallHealth": "excellent" | "good" | "fair" | "poor",
  "summary": "A 2-3 sentence summary in ${targetLanguage.languageName}",
  "recommendedCrops": ["crop1", "crop2", "crop3", "crop4", "crop5"],
  "improvementTechniques": [
    {"title": "Technique name in ${targetLanguage.languageName}", "description": "Description in ${targetLanguage.languageName}", "priority": "high" | "medium" | "low"}
  ],
  "nutrientAnalysis": {
    "nitrogen": {"status": "low" | "optimal" | "high", "advice": "advice in ${targetLanguage.languageName}"},
    "phosphorus": {"status": "low" | "optimal" | "high", "advice": "advice in ${targetLanguage.languageName}"},
    "potassium": {"status": "low" | "optimal" | "high", "advice": "advice in ${targetLanguage.languageName}"}
  },
  "seasonalRecommendations": "Recommendations in ${targetLanguage.languageName}"
}

Be practical and specific to the farmer's needs. Focus on actionable advice.`;

      messages = [
        { role: 'system', content: `You are an expert agricultural consultant. Always respond with valid JSON only, no markdown. Respond in ${targetLanguage.languageName}.` },
        { role: 'user', content: prompt }
      ];
    }

    console.log('Calling Lovable AI for soil analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI analysis');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI Response received, parsing...');

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const analysis = JSON.parse(jsonContent.trim());

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      detectedLanguage: targetLanguage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-soil function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to analyze soil data' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
