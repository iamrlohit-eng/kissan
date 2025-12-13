import { Sparkles, Wheat, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnalysis {
  overallHealth: string;
  summary: string;
  recommendedCrops: string[];
  nutrientAnalysis?: {
    nitrogen: { status: string; advice: string };
    phosphorus: { status: string; advice: string };
    potassium: { status: string; advice: string };
  };
  seasonalRecommendations?: string;
}

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
}

const healthColors: Record<string, string> = {
  excellent: "bg-healthy/10 text-healthy border-healthy/20",
  good: "bg-healthy/10 text-healthy border-healthy/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-critical/10 text-critical border-critical/20",
};

export const AIAnalysisCard = ({ analysis }: AIAnalysisCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-earth animate-fade-up space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        <h3 className="font-display text-lg font-bold text-foreground">AI Analysis</h3>
      </div>

      {/* Overall Health */}
      <div className={cn(
        "px-4 py-3 rounded-lg border",
        healthColors[analysis.overallHealth] || healthColors.fair
      )}>
        <p className="text-sm font-medium capitalize">
          Soil Health: {analysis.overallHealth}
        </p>
        <p className="text-sm mt-1 opacity-80">{analysis.summary}</p>
      </div>

      {/* Recommended Crops */}
      {analysis.recommendedCrops && analysis.recommendedCrops.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wheat className="w-4 h-4 text-wheat" />
            <span className="text-sm font-medium text-foreground">Recommended Crops</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.recommendedCrops.map((crop, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-wheat/10 text-soil rounded-full text-sm"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Recommendations */}
      {analysis.seasonalRecommendations && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Seasonal Tips</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {analysis.seasonalRecommendations}
          </p>
        </div>
      )}
    </div>
  );
};
