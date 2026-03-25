import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SprayRecommendation {
  id: string;
  pesticide_name: string;
  concentration: number;
  quantity_liters: number;
  application_method: "drone" | "ground_sprayer" | "manual";
  success_rate: number;
  cost_estimate: number;
  weather_requirements: {
    max_wind_speed: number;
    optimal_temperature: [number, number];
    min_humidity: number;
  };
  urgency_level: "low" | "medium" | "high" | "critical";
  waiting_period_days: number;
}

interface SprayRecommendationsProps {
  recommendations: SprayRecommendation[];
  fieldName: string;
  onSelectRecommendation: (rec: SprayRecommendation) => void;
}

const urgencyIcons: Record<string, string> = {
  critical: "🚨",
  high: "⚠️",
  medium: "⏱️",
  low: "✓",
};

export const SprayRecommendations = ({
  recommendations,
  fieldName,
  onSelectRecommendation,
}: SprayRecommendationsProps) => {
  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <Card
          key={rec.id}
          className="hover:border-primary/50 transition-all"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {urgencyIcons[rec.urgency_level] || "•"}
                  </span>
                  <h4 className="text-lg font-semibold text-foreground">
                    {rec.pesticide_name}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Application:{" "}
                  <span className="font-medium">
                    {rec.application_method.replace("_", " ").toUpperCase()}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ₹{rec.cost_estimate.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Estimated cost</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Dosage
                </p>
                <p className="font-semibold text-foreground">
                  {rec.quantity_liters}L @ {rec.concentration}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Success Rate
                </p>
                <p className="font-semibold text-primary">{rec.success_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Wait Period
                </p>
                <p className="font-semibold text-foreground">
                  {rec.waiting_period_days} days
                </p>
              </div>
            </div>

            {/* Weather Requirements */}
            <div className="mb-4 p-3 bg-accent/30 border border-accent rounded-lg">
              <p className="text-xs font-semibold text-foreground mb-2 uppercase">
                Weather Requirements
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  Wind: &lt;{rec.weather_requirements.max_wind_speed} km/h
                </div>
                <div>
                  Temp: {rec.weather_requirements.optimal_temperature[0]}°-
                  {rec.weather_requirements.optimal_temperature[1]}°C
                </div>
                <div>Humidity: &gt;{rec.weather_requirements.min_humidity}%</div>
              </div>
            </div>

            <Badge
              variant={
                rec.urgency_level === "critical" || rec.urgency_level === "high"
                  ? "destructive"
                  : "secondary"
              }
              className="mb-4"
            >
              {rec.urgency_level.toUpperCase()} URGENCY
            </Badge>

            <Button
              className="w-full"
              onClick={() => onSelectRecommendation(rec)}
            >
              Create Spray Operation
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
