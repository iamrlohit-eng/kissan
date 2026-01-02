import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Sprout, BarChart3, Sparkles, Users, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useLanguage();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-earth rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">{t("app.title")}</h1>
                <p className="text-xs text-muted-foreground">{t("app.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Button onClick={handleGetStarted} disabled={isLoading}>
                {isLoading ? t("app.loading") : user ? t("app.goToDashboard") : t("app.getStarted")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-wheat">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-up">
            {t("hero.title1")}
            <br />
            <span className="text-gradient-primary">{t("hero.title2")}</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {t("hero.description")}
          </p>
          <Button size="lg" onClick={handleGetStarted} className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            {user ? t("hero.viewFields") : t("hero.startFree")}
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <h3 className="font-display text-2xl font-bold text-center text-foreground mb-12">
            {t("features.title")}
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: t("features.npk.title"),
                desc: t("features.npk.desc"),
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: t("features.ai.title"),
                desc: t("features.ai.desc"),
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: t("features.multiField.title"),
                desc: t("features.multiField.desc"),
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-earth text-center animate-fade-up"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h4 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-earth text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h3 className="font-display text-3xl font-bold mb-4">
            {t("cta.title")}
          </h3>
          <p className="mb-8 opacity-90">
            {t("cta.description")}
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted}>
            {user ? t("app.goToDashboard") : t("cta.createAccount")}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(user && isAdmin ? "/admin" : "/admin-login")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Portal
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;