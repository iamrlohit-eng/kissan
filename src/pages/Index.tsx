import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sprout, BarChart3, Sparkles, Users } from "lucide-react";
const Index = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoading
  } = useAuth();
  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-earth rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">KISAAN - Analysiser</h1>
                <p className="text-xs text-muted-foreground">Fertilizer Report Reader</p>
              </div>
            </div>
            <Button onClick={handleGetStarted} disabled={isLoading}>
              {isLoading ? "Loading..." : user ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-wheat">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-up">
            Understand Your Soil,
            <br />
            <span className="text-gradient-primary">Grow Better Crops</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up" style={{
          animationDelay: "0.1s"
        }}>
            Upload your fertilizer reports, get AI-powered analysis, and receive personalized recommendations for improving your fields.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="animate-fade-up" style={{
          animationDelay: "0.2s"
        }}>
            {user ? "View Your Fields" : "Start Free"}
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container max-w-6xl mx-auto px-4">
          <h3 className="font-display text-2xl font-bold text-center text-foreground mb-12">
            Everything You Need
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[{
            icon: <BarChart3 className="w-8 h-8" />,
            title: "NPK Analysis",
            desc: "Track nitrogen, phosphorus, potassium levels with visual gauges and optimal range indicators."
          }, {
            icon: <Sparkles className="w-8 h-8" />,
            title: "AI Recommendations",
            desc: "Get personalized crop suggestions and field improvement techniques powered by AI."
          }, {
            icon: <Users className="w-8 h-8" />,
            title: "Multi-Field Tracking",
            desc: "Manage multiple fields and track soil health history with detailed reports."
          }].map((feature, i) => <div key={feature.title} className="bg-card rounded-xl p-6 shadow-earth text-center animate-fade-up" style={{
            animationDelay: `${0.1 * (i + 1)}s`
          }}>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h4 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-earth text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h3 className="font-display text-3xl font-bold mb-4">
            Ready to Improve Your Yields?
          </h3>
          <p className="mb-8 opacity-90">
            Join farmers who are making data-driven decisions for healthier soil.
          </p>
          <Button size="lg" variant="secondary" onClick={handleGetStarted}>
            {user ? "Go to Dashboard" : "Create Free Account"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SoilSense — Helping farmers make informed decisions</p>
        </div>
      </footer>
    </div>;
};
export default Index;