import { AlertCircle, CheckCircle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
type Priority = "high" | "medium" | "low";
interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
}
interface RecommendationCardProps {
  recommendations: Recommendation[];
}
const priorityStyles = {
  high: {
    bg: "bg-critical/5 border-critical/20",
    icon: <AlertCircle className="w-5 h-5 text-critical" />,
    badge: "bg-critical/10 text-critical"
  },
  medium: {
    bg: "bg-warning/5 border-warning/20",
    icon: <Info className="w-5 h-5 text-warning" />,
    badge: "bg-warning/10 text-warning"
  },
  low: {
    bg: "bg-healthy/5 border-healthy/20",
    icon: <CheckCircle className="w-5 h-5 text-healthy" />,
    badge: "bg-healthy/10 text-healthy"
  }
};
export const RecommendationCard = ({
  recommendations
}: RecommendationCardProps) => {
  return <div className="bg-card rounded-xl p-6 shadow-earth animate-fade-up" style={{
    animationDelay: "0.2s"
  }}>
      <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">Recommendations<Lightbulb className="w-5 h-5 text-accent" />
        Recommendations
      </h2>

      <div className="space-y-3">
        {recommendations.map(rec => {
        const style = priorityStyles[rec.priority];
        return <div key={rec.id} className={cn("p-4 rounded-lg border flex gap-3", style.bg)}>
              <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{rec.title}</h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", style.badge)}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            </div>;
      })}
      </div>
    </div>;
};