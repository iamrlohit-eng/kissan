import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScanEmailRequest {
  email: string;
  guestName: string | null;
  location: string | null;
  scanDate: string;
  scanId: string;
  summary: string | null;
  recommendedCrops: string[];
  nutrients: {
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const {
      email,
      guestName,
      location,
      scanDate,
      scanId,
      summary,
      recommendedCrops,
      nutrients,
    }: ScanEmailRequest = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const formattedDate = new Date(scanDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const baseUrl = Deno.env.get("SUPABASE_URL") || "";
    const scanUrl = `${baseUrl.replace(".supabase.co", ".lovable.app")}/emergency-scan/${scanId}`;

    const cropsList = recommendedCrops.length > 0 
      ? recommendedCrops.map(crop => `<span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; margin: 4px 4px 4px 0; font-size: 14px;">${crop}</span>`).join("") 
      : "<p style='color: #6b7280;'>No specific crops recommended</p>";

    const nutrientRows = `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Nitrogen (N)</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${nutrients.nitrogen ?? "N/A"} ppm</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Phosphorus (P)</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${nutrients.phosphorus ?? "N/A"} ppm</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Potassium (K)</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${nutrients.potassium ?? "N/A"} ppm</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 12px; font-weight: 600;">pH Level</td>
        <td style="padding: 12px; text-align: center;">${nutrients.ph ?? "N/A"}</td>
      </tr>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 12px;">
                <div style="width: 48px; height: 48px; background-color: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 24px;">🌱</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">KISAAN</h1>
              </div>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">AI-Powered Soil Analysis</p>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
              <h2 style="color: #166534; margin: 0 0 16px 0; font-size: 22px;">Your Soil Analysis Report</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Hello${guestName ? ` <strong>${guestName}</strong>` : ""}! Your emergency soil scan results are ready.
              </p>

              <!-- Scan Info Card -->
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #16a34a;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">📅 Scan Date</td>
                    <td style="padding: 4px 0; color: #111827; font-weight: 600; text-align: right;">${formattedDate}</td>
                  </tr>
                  ${location ? `
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">📍 Location</td>
                    <td style="padding: 4px 0; color: #111827; font-weight: 600; text-align: right;">${location}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              ${summary ? `
              <!-- Summary -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 18px;">🌿 Analysis Summary</h3>
                <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0; background-color: #f9fafb; padding: 16px; border-radius: 8px;">
                  ${summary}
                </p>
              </div>
              ` : ""}

              <!-- Nutrients Table -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 18px;">🧪 Nutrient Levels</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #16a34a;">
                      <th style="padding: 12px; color: white; text-align: left; font-weight: 600;">Nutrient</th>
                      <th style="padding: 12px; color: white; text-align: center; font-weight: 600;">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${nutrientRows}
                  </tbody>
                </table>
              </div>

              <!-- Recommended Crops -->
              <div style="margin-bottom: 24px;">
                <h3 style="color: #166534; margin: 0 0 12px 0; font-size: 18px;">🌾 Recommended Crops</h3>
                <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px;">
                  ${cropsList}
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${scanUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Full Report Online →
                </a>
              </div>

              <!-- CTA for Account -->
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
                <p style="color: #92400e; margin: 0 0 12px 0; font-size: 15px;">
                  <strong>Want to track your soil health over time?</strong><br>
                  Create a free KISAAN account to save multiple fields and get personalized recommendations.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
                This report was generated by KISAAN - AI Agricultural Analysis System
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                This analysis is AI-powered and should be used as guidance alongside expert consultation.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KISAAN <onboarding@resend.dev>",
        to: [email],
        subject: `Your Soil Analysis Report${guestName ? ` - ${guestName}` : ""} | KISAAN`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const responseData = await emailResponse.json();
    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-scan-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
