import { Droplets, Leaf, Sun, ThermometerSun } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "healthy" | "warning" | "critical";
}

const statusStyles = {
  healthy: "bg-healthy/10 text-healthy border-healthy/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-critical/10 text-critical border-critical/20",
};

const Metric = ({ icon, label, value, status }: MetricProps) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-lg border",
    statusStyles[status]
  )}>
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <p className="text-xs opacity-80">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  </div>
);

interface SoilHealthCardProps {
  ph: number;
  organicMatter: number;
  moisture: number;
  temperature: number;
}

const getPhStatus = (ph: number): "healthy" | "warning" | "critical" => {
  if (ph >= 6.0 && ph <= 7.5) return "healthy";
  if (ph >= 5.5 && ph <= 8.0) return "warning";
  return "critical";
};

const getOrganicMatterStatus = (om: number): "healthy" | "warning" | "critical" => {
  if (om >= 3) return "healthy";
  if (om >= 2) return "warning";
  return "critical";
};

export const SoilHealthCard = ({
  ph,
  organicMatter,
  moisture,
  temperature,
}: SoilHealthCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-earth animate-fade-up">
      <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Leaf className="w-5 h-5 text-primary" />
        Soil Health Overview
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={<Droplets className="w-5 h-5" />}
          label="pH Level"
          value={ph.toFixed(1)}
          status={getPhStatus(ph)}
        />
        <Metric
          icon={<Leaf className="w-5 h-5" />}
          label="Organic Matter"
          value={`${organicMatter.toFixed(1)}%`}
          status={getOrganicMatterStatus(organicMatter)}
        />
        <Metric
          icon={<Sun className="w-5 h-5" />}
          label="Moisture"
          value={`${moisture}%`}
          status={moisture >= 30 && moisture <= 60 ? "healthy" : "warning"}
        />
        <Metric
          icon={<ThermometerSun className="w-5 h-5" />}
          label="Temperature"
          value={`${temperature}°C`}
          status={temperature >= 15 && temperature <= 25 ? "healthy" : "warning"}
        />
      </div>
    </div>
  );
};
