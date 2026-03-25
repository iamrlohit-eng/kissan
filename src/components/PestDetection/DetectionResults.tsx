import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface PestDetectionResult {
  infection_level: number;
  pest_types: Array<{
    name: string;
    confidence: number;
    affected_percentage: number;
  }>;
  disease_detected: string;
  severity_classification: "low" | "medium" | "high" | "critical";
  analysis_text: string;
  affected_areas: Array<{
    x: number;
    y: number;
    radius: number;
    severity: string;
  }>;
}

interface DetectionResultsProps {
  result: PestDetectionResult;
  imagePreview: string;
}

const getSeverityVariant = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive" as const;
    case "high":
      return "destructive" as const;
    case "medium":
      return "secondary" as const;
    case "low":
      return "outline" as const;
    default:
      return "outline" as const;
  }
};

export const DetectionResults = ({ result, imagePreview }: DetectionResultsProps) => {
  const gaugeColor =
    result.infection_level > 70
      ? "hsl(var(--destructive))"
      : result.infection_level > 40
      ? "hsl(30, 80%, 50%)"
      : "hsl(var(--primary))";

  return (
    <div className="space-y-6">
      {/* Infection Level Gauge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Infection Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="8"
                  strokeDasharray={`${(result.infection_level / 100) * 283} 283`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="50"
                  textAnchor="middle"
                  dy="0.3em"
                  className="text-2xl font-bold"
                  fill="currentColor"
                >
                  {result.infection_level.toFixed(1)}%
                </text>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Severity:
                </span>
                <Badge variant={getSeverityVariant(result.severity_classification)}>
                  {result.severity_classification.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-foreground mb-1">
                <strong>Detected:</strong> {result.disease_detected}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.infection_level > 70
                  ? "Immediate action required. Consider emergency spray."
                  : result.infection_level > 40
                  ? "Schedule spray operation soon."
                  : "Monitor and preventive care recommended."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detected Pests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detected Pests & Diseases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.pest_types.map((pest, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{pest.name}</span>
                <span className="text-sm text-muted-foreground">
                  {pest.affected_percentage.toFixed(1)}% coverage
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(pest.affected_percentage, 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Confidence: {(pest.confidence * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card className="bg-accent/30">
        <CardHeader>
          <CardTitle className="text-lg">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">{result.analysis_text}</p>
        </CardContent>
      </Card>

      {/* Affected Areas Map */}
      {imagePreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Affected Areas Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={imagePreview}
                alt="Field with infection zones"
                className="w-full h-72 object-cover"
              />
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
              >
                {result.affected_areas.map((area, idx) => (
                  <circle
                    key={idx}
                    cx={`${area.x}%`}
                    cy={`${area.y}%`}
                    r="25"
                    fill="none"
                    stroke={
                      area.severity === "critical"
                        ? "#ef4444"
                        : area.severity === "high"
                        ? "#f97316"
                        : "#eab308"
                    }
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.8"
                  />
                ))}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Red = Critical • Orange = High • Yellow = Medium infection areas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
