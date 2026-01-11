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
import { Loader2, MapPin, Upload, Camera, AlertTriangle, Leaf, X, Copy, Check, ExternalLink } from "lucide-react";

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

      // Upload file to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${guestIdentifier}.${fileExt}`;
      const filePath = `emergency-scans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("report-files")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from("report-files")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      const fileUrl = urlData?.signedUrl;

      // Convert file to base64 for AI analysis
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Call AI analysis
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
          },
        }
      );

      if (analysisError) throw analysisError;

      // Save to database
      const { error: insertError } = await supabase.from("emergency_scans").insert({
        guest_identifier: guestIdentifier,
        guest_name: guestName || null,
        guest_phone: guestPhone || null,
        latitude: location?.lat,
        longitude: location?.lng,
        location_text: locationText || null,
        file_url: fileUrl,
        file_type: selectedFile.type,
        ai_analysis: analysisData?.analysis ? JSON.stringify(analysisData.analysis) : null,
        recommended_crops: analysisData?.analysis?.recommendedCrops || null,
        improvement_techniques: analysisData?.analysis?.improvementTechniques?.map((t: any) => t.title) || null,
        preferred_language: preferredLanguage,
        nitrogen: analysisData?.analysis?.extractedData?.nitrogen,
        phosphorus: analysisData?.analysis?.extractedData?.phosphorus,
        potassium: analysisData?.analysis?.extractedData?.potassium,
        ph: analysisData?.analysis?.extractedData?.ph,
        organic_matter: analysisData?.analysis?.extractedData?.organicMatter,
        moisture: analysisData?.analysis?.extractedData?.moisture,
      });

      if (insertError) throw insertError;

      setAnalysisResult(analysisData?.analysis);
      setScanIdentifier(guestIdentifier);
      setStep("results");
      
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
