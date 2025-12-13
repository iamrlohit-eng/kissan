import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nitrogen, phosphorus, potassium, ph, organicMatter, moisture, temperature, currentCrop, location } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are an expert agricultural consultant analyzing a soil fertilizer report. Based on the following soil data, provide practical recommendations.

SOIL DATA:
- Nitrogen (N): ${nitrogen} ppm
- Phosphorus (P): ${phosphorus} ppm  
- Potassium (K): ${potassium} ppm
- pH Level: ${ph}
- Organic Matter: ${organicMatter}%
- Moisture: ${moisture}%
- Soil Temperature: ${temperature}°C
- Current Crop: ${currentCrop || 'Not specified'}
- Location: ${location || 'Not specified'}

Please provide your analysis in the following JSON format:
{
  "overallHealth": "excellent" | "good" | "fair" | "poor",
  "summary": "A 2-3 sentence summary of the soil health",
  "recommendedCrops": ["crop1", "crop2", "crop3", "crop4", "crop5"],
  "improvementTechniques": [
    {"title": "Technique name", "description": "Brief description", "priority": "high" | "medium" | "low"},
    ...
  ],
  "nutrientAnalysis": {
    "nitrogen": {"status": "low" | "optimal" | "high", "advice": "brief advice"},
    "phosphorus": {"status": "low" | "optimal" | "high", "advice": "brief advice"},
    "potassium": {"status": "low" | "optimal" | "high", "advice": "brief advice"}
  },
  "seasonalRecommendations": "Recommendations based on growing seasons"
}

Be practical and specific to the farmer's needs. Focus on actionable advice.`;

    console.log('Calling Lovable AI for soil analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert agricultural consultant. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
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

    return new Response(JSON.stringify({ success: true, analysis }), {
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
