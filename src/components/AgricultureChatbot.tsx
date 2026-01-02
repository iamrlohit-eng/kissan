import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Language code mapping for Web Speech API
const speechLanguageMap: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  pa: "pa-IN",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  ar: "ar-SA",
  ja: "ja-JP",
  ko: "ko-KR",
  ru: "ru-RU",
  zh: "zh-CN",
  it: "it-IT",
  nl: "nl-NL",
  pl: "pl-PL",
  th: "th-TH",
  vi: "vi-VN",
  id: "id-ID",
  ms: "ms-MY",
  sw: "sw-KE",
  ur: "ur-PK",
};

export const AgricultureChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  // Check if browser supports speech recognition
  const isSpeechSupported = typeof window !== "undefined" && 
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLanguageMap[language] || "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      
      setInput(transcript);

      // If this is a final result, stop listening
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      
      if (event.error === "not-allowed") {
        toast({
          title: t("error") || "Error",
          description: "Microphone access denied. Please enable microphone permissions.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [language, toast, t, isSpeechSupported]);

  // Update recognition language when app language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLanguageMap[language] || "en-US";
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: t("error") || "Error",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agriculture-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            language,
            conversationHistory: messages.slice(-10),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, will be handled in next chunk
          }
        }
      }
      
      // Log AI chat activity after successful response
      if (assistantContent) {
        logActivity({
          activityType: 'ai_chat',
          description: 'User chatted with AI assistant',
          metadata: { messageLength: userMessage.length }
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      if (!assistantContent) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getWelcomeMessage = () => {
    const welcomeMessages: Record<string, string> = {
      en: "Hello! I'm your agriculture assistant. Ask me anything about farming, crops, soil health, pest control, and more! You can also use the microphone to speak your question.",
      hi: "नमस्ते! मैं आपका कृषि सहायक हूं। खेती, फसलों, मिट्टी की सेहत, कीट नियंत्रण और अन्य विषयों पर मुझसे कुछ भी पूछें! आप माइक्रोफोन का उपयोग करके भी बोल सकते हैं।",
      ta: "வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். விவசாயம், பயிர்கள், மண் ஆரோக்கியம், பூச்சி கட்டுப்பாடு மற்றும் பலவற்றைப் பற்றி என்னிடம் கேளுங்கள்! மைக்ரோஃபோனைப் பயன்படுத்தியும் பேசலாம்।",
      te: "నమస్కారం! నేను మీ వ్యవసాయ సహాయకుడిని. వ్యవసాయం, పంటలు, నేల ఆరోగ్యం, పురుగుల నియంత్రణ మరియు మరిన్ని విషయాలపై నన్ను అడగండి! మీరు మైక్రోఫోన్ ఉపయోగించి కూడా మాట్లాడవచ్చు।",
      es: "¡Hola! Soy tu asistente agrícola. ¡Pregúntame sobre cultivos, salud del suelo, control de plagas y más! También puedes usar el micrófono para hablar.",
      fr: "Bonjour! Je suis votre assistant agricole. Posez-moi des questions sur l'agriculture, les cultures, la santé des sols et plus encore! Vous pouvez aussi utiliser le microphone.",
      de: "Hallo! Ich bin Ihr Landwirtschaftsassistent. Fragen Sie mich alles über Landwirtschaft, Kulturen, Bodengesundheit und mehr! Sie können auch das Mikrofon benutzen.",
    };
    return welcomeMessages[language] || welcomeMessages.en;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 ${isOpen ? "hidden" : ""}`}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[500px] bg-background border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">{t("aiAssistant") || "Agriculture Assistant"}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex items-start gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-lg max-w-[280px]">
                  <p className="text-sm">{getWelcomeMessage()}</p>
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 mb-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user" ? "bg-primary" : "bg-primary/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg max-w-[280px] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content || "..."}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{t("analyzing") || "Thinking..."}</span>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              {isSpeechSupported && (
                <Button
                  onClick={toggleListening}
                  disabled={isLoading}
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  className={isListening ? "animate-pulse" : ""}
                  title={isListening ? "Stop listening" : "Speak your question"}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : (t("askQuestion") || "Ask your question...")}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
                🎤 Listening... Speak now
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
