import { useState } from "react";
import { FieldHeader } from "@/components/FieldHeader";
import { SoilHealthCard } from "@/components/SoilHealthCard";
import { NutrientGauge } from "@/components/NutrientGauge";
import { RecommendationCard } from "@/components/RecommendationCard";
import { UploadReport } from "@/components/UploadReport";
import { Sprout } from "lucide-react";

// Sample data - in a real app this would come from parsed report
const sampleData = {
  field: {
    fieldName: "North Field - Block A",
    location: "Green Valley Farm, Iowa",
    reportDate: "December 10, 2024",
    acres: 45,
  },
  soil: {
    ph: 6.5,
    organicMatter: 3.2,
    moisture: 42,
    temperature: 18,
  },
  nutrients: {
    nitrogen: { value: 35, unit: "ppm", min: 0, max: 100, optimal: { min: 25, max: 50 } },
    phosphorus: { value: 18, unit: "ppm", min: 0, max: 60, optimal: { min: 15, max: 30 } },
    potassium: { value: 180, unit: "ppm", min: 0, max: 400, optimal: { min: 120, max: 250 } },
  },
  recommendations: [
    {
      id: "1",
      title: "Maintain Current Nitrogen Levels",
      description: "Your nitrogen levels are within the optimal range. Continue with your current fertilization schedule for best results.",
      priority: "low" as const,
    },
    {
      id: "2",
      title: "Consider Phosphorus Boost",
      description: "Phosphorus is at the lower end of optimal. Consider applying 20-30 lbs/acre of phosphate before the next growing season.",
      priority: "medium" as const,
    },
    {
      id: "3",
      title: "Monitor Soil pH",
      description: "pH level is ideal at 6.5. This supports excellent nutrient availability. Test again in 6 months.",
      priority: "low" as const,
    },
  ],
};

const Index = () => {
  const [hasReport, setHasReport] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-earth rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">SoilSense</h1>
              <p className="text-xs text-muted-foreground">Fertilizer Report Reader</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {!hasReport ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 animate-fade-up">
              <h2 className="font-display text-3xl font-bold text-foreground mb-3">
                Understand Your Soil Better
              </h2>
              <p className="text-muted-foreground text-lg">
                Upload your fertilizer report and get instant insights, nutrient analysis, and actionable recommendations for your field.
              </p>
            </div>
            <UploadReport onUpload={() => setHasReport(true)} />
            
            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { title: "NPK Analysis", desc: "Detailed nutrient breakdown" },
                { title: "Soil Health", desc: "pH & organic matter insights" },
                { title: "Smart Tips", desc: "Actionable recommendations" },
              ].map((feature, i) => (
                <div 
                  key={feature.title}
                  className="text-center p-4 rounded-lg bg-card shadow-earth animate-fade-up"
                  style={{ animationDelay: `${0.1 * (i + 1)}s` }}
                >
                  <h3 className="font-display font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Field Header */}
            <FieldHeader {...sampleData.field} />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Soil Health & Recommendations */}
              <div className="lg:col-span-1 space-y-6">
                <SoilHealthCard {...sampleData.soil} />
                <RecommendationCard recommendations={sampleData.recommendations} />
              </div>

              {/* Right Column - Nutrients */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-display text-xl font-bold text-foreground">
                  NPK Nutrient Levels
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <NutrientGauge
                    label="Nitrogen (N)"
                    color="nitrogen"
                    {...sampleData.nutrients.nitrogen}
                  />
                  <NutrientGauge
                    label="Phosphorus (P)"
                    color="phosphorus"
                    {...sampleData.nutrients.phosphorus}
                  />
                  <NutrientGauge
                    label="Potassium (K)"
                    color="potassium"
                    {...sampleData.nutrients.potassium}
                  />
                </div>

                {/* Upload Another */}
                <div className="mt-8">
                  <UploadReport onUpload={() => setHasReport(true)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>SoilSense — Helping farmers make informed decisions</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
