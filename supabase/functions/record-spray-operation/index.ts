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
    const {
      field_id,
      pest_detection_id,
      spray_date,
      pesticide_used,
      quantity_used,
      coverage_area,
      application_method,
      equipment_id,
      weather_conditions,
      safety_precautions,
      notes,
    } = body;

    if (!field_id || !pesticide_used) {
      return new Response(
        JSON.stringify({ error: "field_id and pesticide_used are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: operation, error: dbError } = await serviceClient
      .from("spray_operations")
      .insert({
        user_id: user.id,
        field_id,
        pest_detection_id: pest_detection_id || null,
        spray_date: spray_date || new Date().toISOString(),
        pesticide_used,
        quantity_used: quantity_used || 0,
        coverage_area: coverage_area || 0,
        application_method: application_method || "manual",
        equipment_id: equipment_id || null,
        weather_conditions: weather_conditions || null,
        safety_precautions: safety_precautions || [],
        completion_notes: notes || null,
        status: "planned",
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        operation_id: operation.id,
        status: "planned",
        recorded_at: operation.created_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error) {
    console.error("Record spray error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Recording failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
