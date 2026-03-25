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
    const { pest_detection_id, field_id } = body;

    if (!pest_detection_id) {
      return new Response(
        JSON.stringify({ error: "pest_detection_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch detection result
    const { data: detection, error: fetchError } = await supabase
      .from("pest_detection_results")
      .select("*")
      .eq("id", pest_detection_id)
      .single();

    if (fetchError || !detection) {
      return new Response(
        JSON.stringify({ error: "Detection result not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use Lovable AI to generate spray recommendations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
              content: `You are an expert agricultural spray planning specialist. Based on this pest detection analysis, generate spray recommendations.

Detection Data:
- Disease: ${detection.disease_detected}
- Infection Level: ${detection.infection_level}%
- Severity: ${detection.severity_classification}
- Pest Types: ${JSON.stringify(detection.pest_types)}
- Crop: ${detection.crop_type || "Unknown"}

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "recommendations": [
    {
      "id": "<unique-id>",
      "pesticide_name": "<name>",
      "concentration": <percentage>,
      "quantity_liters": <liters needed>,
      "application_method": "<drone|ground_sprayer|manual>",
      "success_rate": <0-100>,
      "cost_estimate": <cost in INR>,
      "weather_requirements": {
        "max_wind_speed": <km/h>,
        "optimal_temperature": [<min>, <max>],
        "min_humidity": <percentage>
      },
      "urgency_level": "<low|medium|high|critical>",
      "waiting_period_days": <days before harvest>
    }
  ],
  "spray_pattern": {
    "coverage_efficiency": <0-1>,
    "estimated_time_hours": <hours>
  },
  "optimization_metrics": {
    "efficiency_percentage": <0-100>,
    "cost_estimate": <total cost INR>,
    "environmental_impact": "<low|medium|high>"
  }
}

Provide 2-3 recommendations with different approaches (organic, chemical, mixed). Include realistic Indian market prices.`,
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API failed [${aiResponse.status}]: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let rawText = aiData.choices?.[0]?.message?.content || "{}";
    
    // Clean markdown
    rawText = rawText.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = {
        recommendations: [],
        spray_pattern: { coverage_efficiency: 0, estimated_time_hours: 0 },
        optimization_metrics: {
          efficiency_percentage: 0,
          cost_estimate: 0,
          environmental_impact: "unknown",
        },
      };
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Spray map error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
