import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sprout, 
  Loader2, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Leaf, 
  ArrowLeft,
  Copy,
  Check,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface EmergencyScan {
  id: string;
  guest_identifier: string;
  guest_name: string | null;
  latitude: number | null;
  longitude: number | null;
  location_text: string | null;
  file_url: string | null;
  file_type: string | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  organic_matter: number | null;
  moisture: number | null;
  ai_analysis: string | null;
  recommended_crops: string[] | null;
  improvement_techniques: string[] | null;
  created_at: string;
}

const EmergencyScanResult = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [scan, setScan] = useState<EmergencyScan | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scanId) {
      fetchScan();
    }
  }, [scanId]);

  const fetchScan = async () => {
    setIsLoading(true);
    try {
      // Use the guest identifier from URL to find the scan
      const { data, error } = await supabase
        .from("emergency_scans")
        .select("*")
        .eq("guest_identifier", scanId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setNotFound(true);
        return;
      }

      setScan(data);
      
      if (data.ai_analysis) {
        try {
          setAnalysis(JSON.parse(data.ai_analysis));
        } catch {
          setAnalysis(null);
        }
      }
    } catch (error) {
      console.error("Error fetching scan:", error);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "You can bookmark this page to view your results later.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading your scan results...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">Scan Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This emergency scan result could not be found. The link may be incorrect or the scan may have been deleted.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-earth rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Soil Analysis</h1>
                <p className="text-xs text-muted-foreground">Emergency Scan Result</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Emergency Scan Result</p>
              <p className="text-sm text-amber-700">
                Bookmark this page to access your results later. Create an account to save and track multiple soil reports over time.
              </p>
            </div>
          </div>
        </div>

        {/* Scan Details */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Metrics */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Scan Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {scan && format(new Date(scan.created_at), "MMMM d, yyyy")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {scan && format(new Date(scan.created_at), "h:mm a")}
                </p>
              </CardContent>
            </Card>

            {scan?.location_text && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{scan.location_text}</p>
                </CardContent>
              </Card>
            )}

            {/* NPK Values */}
            {(scan?.nitrogen != null || scan?.phosphorus != null || scan?.potassium != null) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Nutrient Levels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scan?.nitrogen != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nitrogen (N)</span>
                      <Badge variant="outline">{scan.nitrogen} ppm</Badge>
                    </div>
                  )}
                  {scan?.phosphorus != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phosphorus (P)</span>
                      <Badge variant="outline">{scan.phosphorus} ppm</Badge>
                    </div>
                  )}
                  {scan?.potassium != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Potassium (K)</span>
                      <Badge variant="outline">{scan.potassium} ppm</Badge>
                    </div>
                  )}
                  {scan?.ph != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">pH Level</span>
                      <Badge variant="outline">{scan.ph}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {scan?.file_url && (
              <Button variant="outline" className="w-full" asChild>
                <a href={scan.file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" />
                  View Original Report
                </a>
              </Button>
            )}
          </div>

          {/* Right Column - Analysis */}
          <div className="md:col-span-2 space-y-4">
            {analysis?.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    AI Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </CardContent>
              </Card>
            )}

            {scan?.recommended_crops && scan.recommended_crops.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Crops</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {scan.recommended_crops.map((crop, i) => (
                      <Badge key={i} className="bg-primary/10 text-primary border-primary/20">
                        {crop}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis?.improvementTechniques && analysis.improvementTechniques.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improvement Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {analysis.improvementTechniques.map((tech: any, i: number) => (
                      <li key={i} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{tech.title}</p>
                            {tech.description && (
                              <p className="text-sm text-muted-foreground mt-1">{tech.description}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* CTA to create account */}
            <Card className="bg-gradient-earth text-primary-foreground">
              <CardContent className="pt-6">
                <h3 className="font-display text-xl font-bold mb-2">Want to track your soil health?</h3>
                <p className="opacity-90 mb-4">
                  Create a free account to save multiple fields, track changes over time, and get personalized recommendations.
                </p>
                <Button variant="secondary" onClick={() => navigate("/auth")}>
                  Create Free Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmergencyScanResult;
