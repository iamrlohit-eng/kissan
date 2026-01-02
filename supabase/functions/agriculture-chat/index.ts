import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log("Invalid or expired token:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("User authenticated:", user.id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { message, language, conversationHistory } = await req.json();

    const languageInstructions: Record<string, string> = {
      en: "Respond in English.",
      hi: "हिंदी में जवाब दें। Respond in Hindi.",
      ta: "தமிழில் பதிலளிக்கவும். Respond in Tamil.",
      te: "తెలుగులో సమాధానం ఇవ్వండి. Respond in Telugu.",
      kn: "ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ. Respond in Kannada.",
      mr: "मराठीत उत्तर द्या. Respond in Marathi.",
      gu: "ગુજરાતીમાં જવાબ આપો. Respond in Gujarati.",
      bn: "বাংলায় উত্তর দিন. Respond in Bengali.",
      pa: "ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ. Respond in Punjabi.",
      es: "Responde en español. Respond in Spanish.",
      pt: "Responda em português. Respond in Portuguese.",
      fr: "Répondez en français. Respond in French.",
      de: "Antworten Sie auf Deutsch. Respond in German.",
      ar: "أجب بالعربية. Respond in Arabic.",
      ja: "日本語で回答してください。Respond in Japanese.",
      ko: "한국어로 답변하세요. Respond in Korean.",
      ru: "Отвечайте на русском. Respond in Russian.",
      zh: "用中文回答。Respond in Chinese.",
      it: "Rispondi in italiano. Respond in Italian.",
      nl: "Antwoord in het Nederlands. Respond in Dutch.",
      pl: "Odpowiedz po polsku. Respond in Polish.",
      th: "ตอบเป็นภาษาไทย Respond in Thai.",
      vi: "Trả lời bằng tiếng Việt. Respond in Vietnamese.",
      id: "Jawab dalam Bahasa Indonesia. Respond in Indonesian.",
      ms: "Jawab dalam Bahasa Melayu. Respond in Malay.",
      sw: "Jibu kwa Kiswahili. Respond in Swahili.",
      ur: "اردو میں جواب دیں۔ Respond in Urdu.",
    };

    const langInstruction = languageInstructions[language] || languageInstructions.en;

    const systemPrompt = `You are an expert agricultural advisor and farming assistant. Your role is to help farmers with:
- Crop cultivation and management
- Soil health and fertilization
- Pest and disease control
- Irrigation and water management
- Weather-related farming advice
- Livestock care
- Organic farming practices
- Modern farming technologies
- Government schemes and subsidies for farmers
- Market prices and selling strategies

${langInstruction}

Be helpful, practical, and provide actionable advice. Use simple language that farmers can easily understand. When discussing chemicals or pesticides, always mention safety precautions. If you're unsure about something, be honest about it and suggest consulting local agricultural experts.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Agriculture chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
