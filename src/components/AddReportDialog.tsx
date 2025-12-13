import { useState, useRef, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, MapPin, Loader2 } from "lucide-react";

interface AddReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  onReportAdded: () => void;
}

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect from GPS' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'de', name: 'Deutsch (German)' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'ja', name: '日本語 (Japanese)' },
  { code: 'ko', name: '한국어 (Korean)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'id', name: 'Bahasa Indonesia' },
];

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("auto");
  const [uploadMode, setUploadMode] = useState<"manual" | "file">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get GPS location on mount
  useEffect(() => {
    if (open && !latitude && !longitude) {
      getGPSLocation();
    }
  }, [open]);

  const getGPSLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your browser doesn't support GPS location.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsGettingLocation(false);
        toast({
          title: "Location Detected",
          description: `GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        });
      },
      (error) => {
        console.error("GPS error:", error);
        setIsGettingLocation(false);
        toast({
          title: "Location Error",
          description: "Could not get your location. Language will default to English.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file (JPG, PNG, WebP).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let fileUrl: string | null = null;
      let fileType: string | null = null;
      let fileBase64: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report-files')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('report-files')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;
        fileType = selectedFile.type;
        fileBase64 = await fileToBase64(selectedFile);
      }

      // Create the report
      const { data: report, error } = await supabase.from("fertilizer_reports").insert({
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
        file_url: fileUrl,
        file_type: fileType,
        latitude: latitude,
        longitude: longitude,
        preferred_language: preferredLanguage,
      }).select().single();

      if (error) throw error;

      toast({
        title: "Report Added",
        description: uploadMode === "file" 
          ? "Your report has been uploaded. Click 'Analyze with AI' to process it."
          : "Your fertilizer report has been saved.",
      });

      // Reset form
      resetForm();
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

  const resetForm = () => {
    setNitrogen("");
    setPhosphorus("");
    setPotassium("");
    setPh("");
    setOrganicMatter("");
    setMoisture("");
    setTemperature("");
    setSelectedFile(null);
    setFilePreview(null);
    setUploadMode("manual");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Fertilizer Report</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date and Language */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="language">AI Response Language</Label>
              <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
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

          {/* GPS Location */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              {latitude && longitude ? (
                <span>GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
              ) : (
                <span className="text-muted-foreground">No location detected</span>
              )}
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={getGPSLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Get Location"
              )}
            </Button>
          </div>

          {/* Input Mode Tabs */}
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "manual" | "file")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="file">Upload Report</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg mb-2" />
                ) : selectedFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileText className="w-8 h-8" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="font-medium text-foreground">Upload Soil Report</p>
                    <p className="text-sm text-muted-foreground">PDF, JPG, PNG, or WebP (max 10MB)</p>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                AI will automatically extract NPK values and other data from your report
              </p>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-4">
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
            </TabsContent>
          </Tabs>

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