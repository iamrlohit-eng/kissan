import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { field_id, image_base64, crop_type, image_metadata } = body;

    if (!field_id || !image_base64) {
      return new Response(
        JSON.stringify({ error: "field_id and image_base64 are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const startTime = performance.now();

    // Use Lovable AI (Gemini) for vision analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const imageData = image_base64.includes(",")
      ? image_base64.split(",")[1]
      : image_base64;

    const aiResponse = await fetch(
      "https://ai.lovable.dev/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`,
                  },
                },
                {
                  type: "text",
                  text: `You are an expert agricultural pest and disease specialist. Analyze this field image and provide detailed pest/disease detection information.

Crop Type: ${crop_type || "Unknown"}
Location: ${image_metadata?.latitude || "Unknown"}, ${image_metadata?.longitude || "Unknown"}

Return ONLY valid JSON (no markdown, no code blocks, no extra text) with this exact structure:
{
  "infection_level": <0-100 percentage of infected area>,
  "pest_types": [
    {
      "name": "<pest/disease name>",
      "confidence": <0-1 confidence score>,
      "affected_percentage": <0-100 percentage of plant coverage>
    }
  ],
  "disease_detected": "<primary disease or pest name>",
  "severity_classification": "<low|medium|high|critical>",
  "analysis_text": "<detailed analysis of the infection, spread pattern, and urgency>",
  "affected_areas": [
    {
      "x": <0-100 percentage horizontal>,
      "y": <0-100 percentage vertical>,
      "radius": <size in percentage>,
      "severity": "<low|medium|high|critical>"
    }
  ],
  "recommended_pesticides": [
    {
      "name": "<pesticide name>",
      "concentration": <percentage>,
      "application_method": "<drone|ground_sprayer|manual>",
      "success_rate": <0-100>,
      "cost_estimate": <in INR>,
      "waiting_period_days": <days before harvest>
    }
  ]
}

Be precise and accurate. If no disease is detected, set infection_level to 0 and severity_classification to "low".`,
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API call failed [${aiResponse.status}]: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const rawText =
      aiData.choices?.[0]?.message?.content || "{}";

    // Clean the response - remove markdown code blocks if present
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let analysisData;
    try {
      analysisData = JSON.parse(cleanedText);
    } catch {
      analysisData = {
        infection_level: 0,
        pest_types: [],
        disease_detected: "Unable to parse",
        severity_classification: "low",
        analysis_text: rawText,
        affected_areas: [],
        recommended_pesticides: [],
      };
    }

    const processingTime = performance.now() - startTime;

    // Save to database using service role for insert
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: savedResult, error: dbError } = await serviceClient
      .from("pest_detection_results")
      .insert({
        field_id,
        user_id: user.id,
        infection_level: analysisData.infection_level,
        pest_types: analysisData.pest_types,
        disease_detected: analysisData.disease_detected,
        severity_classification: analysisData.severity_classification,
        analysis_text: analysisData.analysis_text,
        affected_areas: analysisData.affected_areas,
        recommended_pesticides: analysisData.recommended_pesticides,
        confidence_score: analysisData.pest_types?.length
          ? Math.min(...analysisData.pest_types.map((p: any) => p.confidence))
          : 0,
        weather_conditions: image_metadata?.weather || null,
        crop_type: crop_type || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        id: savedResult.id,
        ...analysisData,
        processing_time_ms: Math.round(processingTime),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
