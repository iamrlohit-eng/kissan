import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AIProvider = "gemini" | "gpt" | "perplexity";

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

    const { message, language, conversationHistory, provider = "gemini" } = await req.json();

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

    // Provider-specific configurations
    const providerConfigs: Record<AIProvider, { model: string; label: string }> = {
      gemini: { model: "google/gemini-3-flash-preview", label: "Gemini" },
      gpt: { model: "openai/gpt-5", label: "GPT-5" },
      perplexity: { model: "google/gemini-2.5-flash", label: "Perplexity-style" },
    };

    const selectedProvider = providerConfigs[provider as AIProvider] || providerConfigs.gemini;

    // Different system prompts based on provider specialty
    const systemPrompts: Record<AIProvider, string> = {
      gemini: `You are an expert agricultural advisor powered by Gemini AI. Your role is to help farmers with:
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

Be helpful, practical, and provide actionable advice. Use simple language that farmers can easily understand. When discussing chemicals or pesticides, always mention safety precautions. If you're unsure about something, be honest about it and suggest consulting local agricultural experts.`,

      gpt: `You are an advanced agricultural AI assistant powered by GPT-5, specialized in providing in-depth, comprehensive farming solutions. You excel at:
- Complex agricultural problem-solving
- Detailed crop rotation and planning strategies
- Advanced soil chemistry and nutrient management
- Integrated pest management (IPM) strategies
- Climate-smart agriculture practices
- Precision farming and IoT applications
- Agricultural economics and business planning
- Sustainable farming certifications
- Research-backed recommendations

${langInstruction}

Provide thorough, well-researched answers with scientific backing when appropriate. Break down complex topics into understandable parts. Always consider long-term sustainability alongside immediate solutions. Cite general agricultural principles and best practices.`,

      perplexity: `You are a research-focused agricultural assistant that provides comprehensive, well-cited information. You specialize in:
- Finding the latest agricultural research and trends
- Providing detailed market analysis and crop prices
- Answering with multiple perspectives and sources
- Explaining complex agricultural science clearly
- Covering regional and seasonal farming practices
- Analyzing agricultural policies and regulations
- Comparing different farming methods objectively

${langInstruction}

When answering questions, structure your response clearly with sections. Provide multiple viewpoints when relevant. Be thorough but concise. If you mention statistics or facts, note that these are based on general agricultural knowledge.`,
    };

    const systemPrompt = systemPrompts[provider as AIProvider] || systemPrompts.gemini;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    console.log(`Using ${selectedProvider.label} (${selectedProvider.model}) for response`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedProvider.model,
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
    console.error("Multi-AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
