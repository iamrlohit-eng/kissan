import { cn } from "@/lib/utils";

interface NutrientGaugeProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  optimal: { min: number; max: number };
  color: "nitrogen" | "phosphorus" | "potassium";
}

const colorClasses = {
  nitrogen: "bg-nitrogen",
  phosphorus: "bg-phosphorus",
  potassium: "bg-potassium",
};

const getStatus = (value: number, optimal: { min: number; max: number }) => {
  if (value < optimal.min) return { status: "Low", color: "text-warning" };
  if (value > optimal.max) return { status: "High", color: "text-critical" };
  return { status: "Optimal", color: "text-healthy" };
};

export const NutrientGauge = ({
  label,
  value,
  unit,
  min,
  max,
  optimal,
  color,
}: NutrientGaugeProps) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const { status, color: statusColor } = getStatus(value, optimal);

  return (
    <div className="bg-card rounded-lg p-5 shadow-earth animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-foreground">{label}</h3>
        <span className={cn("text-sm font-medium", statusColor)}>{status}</span>
      </div>
      
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-3xl font-display font-bold text-foreground">{value}</span>
        <span className="text-muted-foreground text-sm">{unit}</span>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        {/* Optimal range indicator */}
        <div
          className="absolute h-full bg-healthy/20"
          style={{
            left: `${((optimal.min - min) / (max - min)) * 100}%`,
            width: `${((optimal.max - optimal.min) / (max - min)) * 100}%`,
          }}
        />
        {/* Value bar */}
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{min}</span>
        <span className="text-healthy">Optimal: {optimal.min}-{optimal.max}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
