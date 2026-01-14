import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Upload, Camera, AlertTriangle, Leaf, X, Copy, Check, ExternalLink, Printer } from "lucide-react";

interface EmergencyScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES = [
  { code: "auto", name: "Auto-detect (GPS)" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "ta", name: "Tamil (தமிழ்)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "bn", name: "Bengali (বাংলা)" },
  { code: "mr", name: "Marathi (मराठी)" },
  { code: "gu", name: "Gujarati (ગુજરાતી)" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
  { code: "pa", name: "Punjabi (ਪੰਜਾਬੀ)" },
];

export const EmergencyScanDialog = ({ open, onOpenChange }: EmergencyScanDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"info" | "upload" | "analyzing" | "results">("info");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationText, setLocationText] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("auto");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [scanIdentifier, setScanIdentifier] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const resetForm = () => {
    setStep("info");
    setGuestName("");
    setGuestPhone("");
    setLocation(null);
    setLocationText("");
    setPreferredLanguage("auto");
    setSelectedFile(null);
    setFilePreview(null);
    setAnalysisResult(null);
    setScanIdentifier(null);
    setLinkCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const getGPSLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationText(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
      
      toast({
        title: "Location captured",
        description: "GPS coordinates saved successfully",
      });
    } catch (error) {
      toast({
        title: "Location error",
        description: "Could not get GPS location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG, WebP) or PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a soil report image or PDF",
        variant: "destructive",
      });
      return;
    }

    setStep("analyzing");
    setIsUploading(true);

    try {
      // Generate unique identifier for guest
      const guestIdentifier = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload file to dedicated emergency-scans bucket (scans folder for policy compliance)
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${guestIdentifier}.${fileExt}`;
      const filePath = `scans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("emergency-scans")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from("emergency-scans")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      const fileUrl = urlData?.signedUrl;

      // Convert file to base64 for AI analysis
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Call AI analysis - edge function now handles database insert securely
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-soil",
        {
          body: {
            latitude: location?.lat,
            longitude: location?.lng,
            preferredLanguage: preferredLanguage === "auto" ? undefined : preferredLanguage,
            fileBase64,
            fileType: selectedFile.type,
            isEmergencyScan: true,
            // Pass guest data to edge function for secure server-side insert
            guestIdentifier,
            guestName: guestName || null,
            guestPhone: guestPhone || null,
            locationText: locationText || null,
            fileUrl,
          },
        }
      );

      if (analysisError) throw analysisError;

      // No need to insert directly - edge function handles it securely with service role
      setAnalysisResult(analysisData?.analysis);
      setScanIdentifier(guestIdentifier);
      setStep("results");

      // Send notification to admins
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "emergency_scan",
            userEmail: "guest@emergency-scan.local",
            adminEmail: "admin@kisaan.app",
            scanDetails: {
              guestName: guestName || undefined,
              guestPhone: guestPhone || undefined,
              location: locationText || undefined,
              scanLink: `${window.location.origin}/scan/${guestIdentifier}`,
              recommendedCrops: analysisData?.analysis?.recommendedCrops || [],
            },
          },
        });
      } catch (notifyError) {
        console.error("Failed to send admin notification:", notifyError);
        // Don't fail the whole process if notification fails
      }
      
      toast({
        title: "Analysis Complete!",
        description: "Your soil report has been analyzed successfully.",
      });
    } catch (error: any) {
      console.error("Emergency scan error:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze the report. Please try again.",
        variant: "destructive",
      });
      setStep("upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Emergency Soil Scan
          </DialogTitle>
          <DialogDescription>
            Quick soil analysis without creating an account
          </DialogDescription>
        </DialogHeader>

        {step === "info" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-1">For Emergency Use Only</p>
              <p>This feature is for quick analysis. Create an account to save your reports and track soil health over time.</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="guestName">Your Name (Optional)</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <Label htmlFor="guestPhone">Phone Number (Optional)</Label>
                <Input
                  id="guestPhone"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label>GPS Location</Label>
                <div className="flex gap-2">
                  <Input
                    value={locationText}
                    readOnly
                    placeholder="Click to get location"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getGPSLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Preferred Language</Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={() => setStep("upload")}>
              Continue to Upload
            </Button>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="h-24 flex flex-col gap-2"
              >
                <Camera className="w-6 h-6" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 flex flex-col gap-2"
              >
                <Upload className="w-6 h-6" />
                Upload File
              </Button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile && (
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate flex-1">
                    {selectedFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreview(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {filePreview && (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded"
                  />
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedFile}
                className="flex-1"
              >
                Analyze Soil
              </Button>
            </div>
          </div>
        )}

        {step === "analyzing" && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Analyzing your soil report...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        )}

        {step === "results" && analysisResult && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Analysis Complete</span>
              </div>
              <p className="text-sm text-green-700">
                {analysisResult.summary || "Your soil has been analyzed successfully."}
              </p>
            </div>

            {analysisResult.extractedData && (
              <div className="grid grid-cols-3 gap-2 text-center">
                {analysisResult.extractedData.nitrogen != null && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Nitrogen</p>
                    <p className="font-bold text-lg">{analysisResult.extractedData.nitrogen}</p>
                  </div>
                )}
                {analysisResult.extractedData.phosphorus != null && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Phosphorus</p>
                    <p className="font-bold text-lg">{analysisResult.extractedData.phosphorus}</p>
                  </div>
                )}
                {analysisResult.extractedData.potassium != null && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Potassium</p>
                    <p className="font-bold text-lg">{analysisResult.extractedData.potassium}</p>
                  </div>
                )}
              </div>
            )}

            {analysisResult.recommendedCrops?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Recommended Crops</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.recommendedCrops.map((crop: string, i: number) => (
                    <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.improvementTechniques?.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Recommendations</p>
                <ul className="space-y-2">
                  {analysisResult.improvementTechniques.slice(0, 3).map((tech: any, i: number) => (
                    <li key={i} className="text-sm bg-muted p-2 rounded">
                      <span className="font-medium">{tech.title}</span>
                      {tech.description && (
                        <p className="text-muted-foreground text-xs mt-1">{tech.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Shareable Link */}
            {scanIdentifier && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-2 font-medium">Bookmark this link to view your results later:</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/scan/${scanIdentifier}`}
                    className="flex-1 text-xs bg-white border rounded px-2 py-1.5"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/scan/${scanIdentifier}`);
                      setLinkCopied(true);
                      toast({ title: "Link copied!", description: "Bookmark this page to access later." });
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/scan/${scanIdentifier}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const crops = analysisResult?.recommendedCrops || [];
                  const techniques = analysisResult?.improvementTechniques || [];
                  const overallHealth = analysisResult?.overallHealth || "fair";
                  const healthColor = overallHealth === "excellent" || overallHealth === "good" ? "#16a34a" : overallHealth === "fair" ? "#f59e0b" : "#dc2626";
                  
                  const printWindow = window.open("", "_blank");
                  if (!printWindow) {
                    toast({ title: "Print blocked", description: "Please allow pop-ups to print.", variant: "destructive" });
                    return;
                  }
                  
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Soil Analysis Report - KISAAN</title>
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body { font-family: Arial, sans-serif; padding: 20px; background: white; color: #333; }
                          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
                          .logo { display: flex; align-items: center; gap: 12px; }
                          .logo-icon { width: 48px; height: 48px; background: #16a34a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
                          .title { font-size: 24px; font-weight: bold; color: #166534; }
                          .subtitle { font-size: 12px; color: #6b7280; }
                          .info-box { background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
                          .health-box { border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid ${healthColor}; background: ${healthColor}15; }
                          .health-title { font-size: 18px; font-weight: bold; text-transform: capitalize; color: ${healthColor}; }
                          .section { margin-bottom: 20px; }
                          .section-title { font-size: 16px; font-weight: bold; color: #166534; margin-bottom: 12px; }
                          .nutrient-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
                          .nutrient-box { background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center; }
                          .nutrient-label { font-size: 12px; color: #6b7280; }
                          .nutrient-value { font-size: 20px; font-weight: bold; color: #111; }
                          .crop-tag { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; margin: 4px; font-size: 14px; }
                          .technique { background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid #22c55e; }
                          .technique-title { font-weight: bold; margin-bottom: 4px; }
                          .technique-desc { font-size: 14px; color: #6b7280; }
                          .footer { border-top: 2px solid #16a34a; padding-top: 16px; margin-top: 24px; text-align: center; color: #6b7280; font-size: 12px; }
                          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(22, 163, 74, 0.08); font-weight: bold; z-index: -1; }
                          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
                        </style>
                      </head>
                      <body>
                        <div class="watermark">KISAAN</div>
                        <div class="header">
                          <div class="logo">
                            <div class="logo-icon">🌱</div>
                            <div>
                              <div class="title">KISAAN - Soil Analysis Report</div>
                              <div class="subtitle">AI-Powered Agricultural Insights</div>
                            </div>
                          </div>
                          <div style="text-align: right; font-size: 12px; color: #6b7280;">
                            <div>Generated: ${new Date().toLocaleDateString()}</div>
                            ${scanIdentifier ? `<div>Report ID: ${scanIdentifier.slice(0, 15)}</div>` : ""}
                          </div>
                        </div>
                        
                        <div class="info-box">
                          <div><strong>Guest Name:</strong> ${guestName || "Anonymous"}</div>
                          ${locationText ? `<div><strong>Location:</strong> ${locationText}</div>` : ""}
                        </div>
                        
                        <div class="health-box">
                          <div class="health-title">Soil Health: ${overallHealth}</div>
                          <p style="margin-top: 8px; color: #374151;">${analysisResult?.summary || "Soil analysis completed."}</p>
                        </div>
                        
                        ${analysisResult?.extractedData ? `
                        <div class="nutrient-grid">
                          ${analysisResult.extractedData.nitrogen != null ? `<div class="nutrient-box"><div class="nutrient-label">Nitrogen</div><div class="nutrient-value">${analysisResult.extractedData.nitrogen}</div></div>` : ""}
                          ${analysisResult.extractedData.phosphorus != null ? `<div class="nutrient-box"><div class="nutrient-label">Phosphorus</div><div class="nutrient-value">${analysisResult.extractedData.phosphorus}</div></div>` : ""}
                          ${analysisResult.extractedData.potassium != null ? `<div class="nutrient-box"><div class="nutrient-label">Potassium</div><div class="nutrient-value">${analysisResult.extractedData.potassium}</div></div>` : ""}
                        </div>
                        ` : ""}
                        
                        ${crops.length > 0 ? `
                        <div class="section">
                          <div class="section-title">🌾 Recommended Crops</div>
                          <div>${crops.map((crop: string) => `<span class="crop-tag">${crop}</span>`).join("")}</div>
                        </div>
                        ` : ""}
                        
                        ${techniques.length > 0 ? `
                        <div class="section">
                          <div class="section-title">📈 Improvement Techniques</div>
                          ${techniques.map((tech: any) => `
                            <div class="technique">
                              <div class="technique-title">${tech.title}</div>
                              ${tech.description ? `<div class="technique-desc">${tech.description}</div>` : ""}
                            </div>
                          `).join("")}
                        </div>
                        ` : ""}
                        
                        <div class="footer">
                          <p><strong>Generated by KISAAN - AI Agricultural Analysis System</strong></p>
                          <p style="margin-top: 4px;">This report is AI-powered and should be used as guidance alongside expert consultation.</p>
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.onload = () => {
                    printWindow.print();
                    printWindow.close();
                  };
                }}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => window.location.href = "/auth"} className="flex-1">
                Create Account
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
