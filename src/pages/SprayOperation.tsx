import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

const SAFETY_PRECAUTIONS = [
  "Use protective gear (gloves, mask, goggles)",
  "Keep children and pets away from field",
  "Avoid spraying near water sources",
  "Wear long sleeves and pants",
  "Use respirator if needed",
];

const SprayOperation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pesticide_name: state?.recommendation?.pesticide_name || "",
    concentration: state?.recommendation?.concentration || 0,
    quantity_liters: state?.recommendation?.quantity_liters || 0,
    application_method: state?.recommendation?.application_method || "ground_sprayer",
    spray_date: new Date().toISOString().slice(0, 16),
    temperature: 25,
    humidity: 60,
    wind_speed: 5,
    safety_precautions: [] as string[],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "record-spray-operation",
        {
          body: {
            field_id: state?.fieldId,
            pest_detection_id: state?.pestDetectionId,
            spray_date: formData.spray_date,
            pesticide_used: formData.pesticide_name,
            quantity_used: formData.quantity_liters,
            coverage_area: 0,
            application_method: formData.application_method,
            weather_conditions: {
              temperature: formData.temperature,
              humidity: formData.humidity,
              wind_speed: formData.wind_speed,
            },
            safety_precautions: formData.safety_precautions,
            notes: formData.notes,
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Spray Operation Created",
        description: "Your spray operation has been scheduled successfully.",
      });
      navigate("/dashboard/pest-detection/history");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create spray operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePrecaution = (precaution: string) => {
    setFormData((prev) => ({
      ...prev,
      safety_precautions: prev.safety_precautions.includes(precaution)
        ? prev.safety_precautions.filter((p) => p !== precaution)
        : [...prev.safety_precautions, precaution],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Spray Operation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Schedule and plan your spray operation
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pesticide Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Pesticide Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pesticide Name</Label>
                    <Input
                      value={formData.pesticide_name}
                      onChange={(e) =>
                        setFormData({ ...formData, pesticide_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Concentration (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.concentration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          concentration: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (Liters)</Label>
                    <Input
                      type="number"
                      value={formData.quantity_liters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity_liters: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Application Method</Label>
                    <Select
                      value={formData.application_method}
                      onValueChange={(v) =>
                        setFormData({ ...formData, application_method: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drone">Drone Sprayer</SelectItem>
                        <SelectItem value="ground_sprayer">Ground Sprayer</SelectItem>
                        <SelectItem value="manual">Manual Application</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Spray Timing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Spray Timing</h3>
                <div className="space-y-2">
                  <Label>Planned Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.spray_date}
                    onChange={(e) =>
                      setFormData({ ...formData, spray_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Weather */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Weather Conditions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input
                      type="number"
                      value={formData.temperature}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Humidity (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.humidity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          humidity: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wind Speed (km/h)</Label>
                    <Input
                      type="number"
                      value={formData.wind_speed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wind_speed: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Safety */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Safety Precautions</h3>
                <div className="space-y-3">
                  {SAFETY_PRECAUTIONS.map((precaution) => (
                    <label
                      key={precaution}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Checkbox
                        checked={formData.safety_precautions.includes(precaution)}
                        onCheckedChange={() => togglePrecaution(precaution)}
                      />
                      <span className="text-sm text-foreground">{precaution}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any additional information..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Spray Operation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SprayOperation;
