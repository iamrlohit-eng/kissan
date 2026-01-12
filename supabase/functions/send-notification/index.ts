import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'new_signup' | 'admin_request' | 'request_approved' | 'request_rejected' | 'emergency_scan';
  userEmail: string;
  userName?: string;
  adminEmail?: string;
  reason?: string;
  scanDetails?: {
    guestName?: string;
    guestPhone?: string;
    location?: string;
    scanLink?: string;
    recommendedCrops?: string[];
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userEmail, userName, adminEmail, reason, scanDetails }: NotificationRequest = await req.json();

    console.log('Sending notification:', { type, userEmail, adminEmail });

    let emailConfig: { to: string[]; subject: string; html: string } | null = null;

    switch (type) {
      case 'new_signup':
        if (adminEmail) {
          emailConfig = {
            to: [adminEmail],
            subject: '🌱 New User Signup - KISAAN Analyser',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">New User Registration</h2>
                <p>A new user has signed up for KISAAN Analyser:</p>
                <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Name:</strong> ${userName || 'Not provided'}</p>
                  <p><strong>Email:</strong> ${userEmail}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">You can view all users in your admin dashboard.</p>
              </div>
            `,
          };
        }
        break;

      case 'admin_request':
        if (adminEmail) {
          emailConfig = {
            to: [adminEmail],
            subject: '🔐 New Admin Access Request - KISAAN Analyser',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Admin Access Request</h2>
                <p>A user has requested admin access:</p>
                <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Email:</strong> ${userEmail}</p>
                  <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Please review this request in your admin dashboard.</p>
              </div>
            `,
          };
        }
        break;

      case 'request_approved':
        emailConfig = {
          to: [userEmail],
          subject: '✅ Admin Access Approved - KISAAN Analyser',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Congratulations! 🎉</h2>
              <p>Your request for admin access has been <strong>approved</strong>!</p>
              <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p>You now have Group Admin privileges on KISAAN Analyser.</p>
                <p>You can access the admin panel using the Admin Portal link.</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Thank you for being part of our team!</p>
            </div>
          `,
        };
        break;

      case 'request_rejected':
        emailConfig = {
          to: [userEmail],
          subject: '❌ Admin Access Request - KISAAN Analyser',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Request Not Approved</h2>
              <p>Your request for admin access has not been approved at this time.</p>
              <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p>If you believe this was an error or have additional information to share, please contact the main administrator.</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Thank you for your understanding.</p>
            </div>
          `,
        };
        break;

      case 'emergency_scan':
        if (adminEmail && scanDetails) {
          emailConfig = {
            to: [adminEmail],
            subject: '🚨 New Emergency Soil Scan - KISAAN Analyser',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">🚨 Emergency Soil Scan Submitted</h2>
                <p>A guest has submitted an emergency soil scan and may need follow-up:</p>
                <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Guest Name:</strong> ${scanDetails.guestName || 'Not provided'}</p>
                  <p><strong>Phone:</strong> ${scanDetails.guestPhone || 'Not provided'}</p>
                  <p><strong>Location:</strong> ${scanDetails.location || 'Not specified'}</p>
                  <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  ${scanDetails.recommendedCrops?.length ? `<p><strong>Recommended Crops:</strong> ${scanDetails.recommendedCrops.join(', ')}</p>` : ''}
                </div>
                ${scanDetails.scanLink ? `
                <p style="margin: 16px 0;">
                  <a href="${scanDetails.scanLink}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Scan Results
                  </a>
                </p>
                ` : ''}
                <p style="color: #6b7280; font-size: 14px;">Consider reaching out to convert this guest to a registered user.</p>
              </div>
            `,
          };
        }
        break;
    }

    if (emailConfig) {
      const emailResponse = await resend.emails.send({
        from: "KISAAN Analyser <onboarding@resend.dev>",
        ...emailConfig,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'No email configured for this notification type' }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
