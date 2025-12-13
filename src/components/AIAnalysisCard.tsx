import { Sparkles, Wheat, TrendingUp, Info, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AIAnalysis {
  overallHealth: string;
  summary: string;
  recommendedCrops: string[];
  improvementTechniques?: Array<{ title: string; description: string; priority: string }>;
  nutrientAnalysis?: {
    nitrogen?: { status: string; advice: string };
    phosphorus?: { status: string; advice: string };
    potassium?: { status: string; advice: string };
  };
  seasonalRecommendations?: string;
  extractedData?: {
    nitrogen?: number | null;
    phosphorus?: number | null;
    potassium?: number | null;
    ph?: number | null;
    organicMatter?: number | null;
    moisture?: number | null;
  };
}

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
  detectedLanguage?: { language: string; languageName: string };
}

const healthColors: Record<string, string> = {
  excellent: "bg-healthy/10 text-healthy border-healthy/20",
  good: "bg-healthy/10 text-healthy border-healthy/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-critical/10 text-critical border-critical/20",
};

const statusColors: Record<string, string> = {
  low: "text-warning",
  optimal: "text-healthy",
  high: "text-primary",
};

export const AIAnalysisCard = ({ analysis, detectedLanguage }: AIAnalysisCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-earth animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-display text-lg font-bold text-foreground">AI Analysis</h3>
        </div>
        {detectedLanguage && (
          <Badge variant="outline" className="text-xs">
            {detectedLanguage.languageName}
          </Badge>
        )}
      </div>

      {/* Overall Health */}
      <div className={cn(
        "px-4 py-3 rounded-lg border",
        healthColors[analysis.overallHealth] || healthColors.fair
      )}>
        <div className="flex items-center gap-2 mb-1">
          {analysis.overallHealth === "excellent" || analysis.overallHealth === "good" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <p className="text-sm font-medium capitalize">
            Soil Health: {analysis.overallHealth}
          </p>
        </div>
        <p className="text-sm opacity-80">{analysis.summary}</p>
      </div>

      {/* Extracted Data from Image */}
      {analysis.extractedData && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Extracted from Report</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {analysis.extractedData.nitrogen != null && (
              <div className="bg-background rounded p-2">
                <p className="font-bold text-foreground">{analysis.extractedData.nitrogen}</p>
                <p className="text-xs text-muted-foreground">N (ppm)</p>
              </div>
            )}
            {analysis.extractedData.phosphorus != null && (
              <div className="bg-background rounded p-2">
                <p className="font-bold text-foreground">{analysis.extractedData.phosphorus}</p>
                <p className="text-xs text-muted-foreground">P (ppm)</p>
              </div>
            )}
            {analysis.extractedData.potassium != null && (
              <div className="bg-background rounded p-2">
                <p className="font-bold text-foreground">{analysis.extractedData.potassium}</p>
                <p className="text-xs text-muted-foreground">K (ppm)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NPK Nutrient Analysis */}
      {analysis.nutrientAnalysis && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">NPK Analysis</span>
          </div>
          <div className="space-y-2 text-sm">
            {analysis.nutrientAnalysis.nitrogen && (
              <div className="flex gap-2">
                <span className={cn("font-medium", statusColors[analysis.nutrientAnalysis.nitrogen.status] || "")}>
                  N ({analysis.nutrientAnalysis.nitrogen.status}):
                </span>
                <span className="text-muted-foreground">{analysis.nutrientAnalysis.nitrogen.advice}</span>
              </div>
            )}
            {analysis.nutrientAnalysis.phosphorus && (
              <div className="flex gap-2">
                <span className={cn("font-medium", statusColors[analysis.nutrientAnalysis.phosphorus.status] || "")}>
                  P ({analysis.nutrientAnalysis.phosphorus.status}):
                </span>
                <span className="text-muted-foreground">{analysis.nutrientAnalysis.phosphorus.advice}</span>
              </div>
            )}
            {analysis.nutrientAnalysis.potassium && (
              <div className="flex gap-2">
                <span className={cn("font-medium", statusColors[analysis.nutrientAnalysis.potassium.status] || "")}>
                  K ({analysis.nutrientAnalysis.potassium.status}):
                </span>
                <span className="text-muted-foreground">{analysis.nutrientAnalysis.potassium.advice}</span>
              </div>
            )}
          </div>
        </div>
      )}

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