import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { logActivityDirect } from "@/hooks/useActivityLogger";
import { Sprout, Mail, Lock, User } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = authSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Function to get user location
  const getLocationOnLogin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-location');
      if (error) {
        console.error('Error getting location:', error);
        return { location: 'Unknown', locationData: {} };
      }
      return data;
    } catch (err) {
      console.error('Location fetch error:', err);
      return { location: 'Unknown', locationData: {} };
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Log login activity with location
        if (event === 'SIGNED_IN') {
          setTimeout(async () => {
            const locationInfo = await getLocationOnLogin();
            logActivityDirect(
              session.user.id, 
              session.user.email || null, 
              'login', 
              `User signed in from ${locationInfo.location}`,
              { location: locationInfo.location, ...locationInfo.locationData }
            );
          }, 0);
        }
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const validation = authSchema.safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: t("common.error"),
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: t("common.error"),
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: t("common.error"),
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: t("common.success"),
            description: "You have successfully logged in.",
          });
        }
      } else {
        const validation = signupSchema.safeParse({ email, password, fullName });
        if (!validation.success) {
          toast({
            title: t("common.error"),
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: t("common.error"),
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: t("common.error"),
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          // Log signup activity
          logActivityDirect(null, email, 'signup', 'New user signed up', { fullName });
          
          // Send email notification to admin about new signup
          supabase.functions.invoke('send-notification', {
            body: {
              type: 'new_signup',
              userEmail: email,
              userName: fullName,
              adminEmail: 'iamrlohit@gmail.com',
            },
          }).catch(err => console.error('Failed to send notification:', err));
          
          toast({
            title: t("common.success"),
            description: "Account created! You can now start analyzing your fields.",
          });
        }
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-16 h-16 bg-gradient-earth rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">{t("app.title")}</h1>
          <p className="text-muted-foreground">
            {isLogin ? t("dashboard.welcome") : t("auth.signUp")}
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-earth animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Farmer"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : isLogin ? t("auth.signIn") : t("auth.signUp")}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;