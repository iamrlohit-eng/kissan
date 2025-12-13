import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  onReportAdded: () => void;
}

export const AddReportDialog = ({ open, onOpenChange, fieldId, onReportAdded }: AddReportDialogProps) => {
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [ph, setPh] = useState("");
  const [organicMatter, setOrganicMatter] = useState("");
  const [moisture, setMoisture] = useState("");
  const [temperature, setTemperature] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("fertilizer_reports").insert({
        field_id: fieldId,
        user_id: user.id,
        report_date: reportDate,
        nitrogen: nitrogen ? parseFloat(nitrogen) : null,
        phosphorus: phosphorus ? parseFloat(phosphorus) : null,
        potassium: potassium ? parseFloat(potassium) : null,
        ph: ph ? parseFloat(ph) : null,
        organic_matter: organicMatter ? parseFloat(organicMatter) : null,
        moisture: moisture ? parseFloat(moisture) : null,
        temperature: temperature ? parseFloat(temperature) : null,
      });

      if (error) throw error;

      toast({
        title: "Report Added",
        description: "Your fertilizer report has been saved.",
      });

      // Reset form
      setNitrogen("");
      setPhosphorus("");
      setPotassium("");
      setPh("");
      setOrganicMatter("");
      setMoisture("");
      setTemperature("");
      onOpenChange(false);
      onReportAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Add Fertilizer Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportDate">Report Date</Label>
            <Input
              id="reportDate"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nitrogen">Nitrogen (ppm)</Label>
              <Input
                id="nitrogen"
                type="number"
                step="0.1"
                placeholder="35"
                value={nitrogen}
                onChange={(e) => setNitrogen(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phosphorus">Phosphorus (ppm)</Label>
              <Input
                id="phosphorus"
                type="number"
                step="0.1"
                placeholder="18"
                value={phosphorus}
                onChange={(e) => setPhosphorus(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium (ppm)</Label>
              <Input
                id="potassium"
                type="number"
                step="0.1"
                placeholder="180"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ph">pH Level</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                min="0"
                max="14"
                placeholder="6.5"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organicMatter">Organic Matter (%)</Label>
              <Input
                id="organicMatter"
                type="number"
                step="0.1"
                placeholder="3.2"
                value={organicMatter}
                onChange={(e) => setOrganicMatter(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moisture">Moisture (%)</Label>
              <Input
                id="moisture"
                type="number"
                step="0.1"
                placeholder="42"
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="18"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
