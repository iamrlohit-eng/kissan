import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ImageUploader,
  DetectionResults,
  SprayRecommendations,
} from "@/components/PestDetection";
import type { PestDetectionResult, SprayRecommendation } from "@/components/PestDetection";
import { ArrowLeft, Download, Bug } from "lucide-react";

const PestAnalyze = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fieldId = searchParams.get("field");
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [stage, setStage] = useState<"upload" | "analyzing" | "results">("upload");
  const [imageBase64, setImageBase64] = useState("");
  const [detectionResult, setDetectionResult] = useState<PestDetectionResult | null>(null);
  const [detectionId, setDetectionId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<SprayRecommendation[]>([]);

  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleImageSelect = async (base64: string, metadata: any) => {
    setImageBase64(base64);
    setStage("analyzing");

    try {
      // Step 1: Analyze image
      const { data: analysisData, error: analysisError } =
        await supabase.functions.invoke("analyze-plant-disease", {
          body: {
            field_id: fieldId,
            image_base64: base64,
            image_metadata: metadata,
          },
        });

      if (analysisError) throw analysisError;
      if (!analysisData?.success) throw new Error(analysisData?.error || "Analysis failed");

      setDetectionResult(analysisData);
      setDetectionId(analysisData.id);

      // Step 2: Generate spray recommendations
      const { data: recData, error: recError } =
        await supabase.functions.invoke("generate-spray-map", {
          body: {
            pest_detection_id: analysisData.id,
            field_id: fieldId,
          },
        });

      if (recError) throw recError;
      setRecommendations(recData?.recommendations || []);
      setStage("results");

      toast({
        title: "Analysis Complete",
        description: `Detected: ${analysisData.disease_detected} (${analysisData.infection_level}% infection)`,
      });
    } catch (error: any) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze the image",
        variant: "destructive",
      });
      setStage("upload");
    }
  };

  const handleSelectRecommendation = (rec: SprayRecommendation) => {
    navigate("/dashboard/pest-detection/create-operation", {
      state: {
        fieldId,
        pestDetectionId: detectionId,
        recommendation: rec,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl font-bold text-foreground">
                Pest & Disease Analysis
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {!fieldId && (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Please select a field from the dashboard first.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {fieldId && stage === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Field Image</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload a photo of your field to detect pests and diseases
              </p>
            </CardHeader>
            <CardContent>
              <ImageUploader
                onImageSelect={handleImageSelect}
                fieldId={fieldId}
              />
            </CardContent>
          </Card>
        )}

        {stage === "analyzing" && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Analyzing Field Image
              </h2>
              <p className="text-muted-foreground">
                AI is identifying pests, diseases, and infection levels...
              </p>
            </CardContent>
          </Card>
        )}

        {stage === "results" && detectionResult && (
          <div className="space-y-8">
            <DetectionResults result={detectionResult} imagePreview={imageBase64} />

            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Spray Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <SprayRecommendations
                    recommendations={recommendations}
                    fieldName="Current Field"
                    onSelectRecommendation={handleSelectRecommendation}
                  />
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStage("upload");
                  setDetectionResult(null);
                  setRecommendations([]);
                  setImageBase64("");
                }}
              >
                Analyze Another Image
              </Button>
              <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PestAnalyze;
