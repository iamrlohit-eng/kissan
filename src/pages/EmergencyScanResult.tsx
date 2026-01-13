import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FileText,
  Download,
  Share2,
  Printer,
  Image,
  FileImage,
  ChevronDown,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { EmergencyScanPrintableReport } from "@/components/EmergencyScanPrintableReport";
import { SocialShareCard } from "@/components/SocialShareCard";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const printRef = useRef<HTMLDivElement>(null);
  const socialCardRef = useRef<HTMLDivElement>(null);
  
  const [scan, setScan] = useState<EmergencyScan | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingJpeg, setIsGeneratingJpeg] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

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

  const handlePrint = () => {
    if (!scan) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print blocked",
        description: "Please allow pop-ups to print the report.",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = format(new Date(scan.created_at), "MMMM d, yyyy");
    const crops = scan.recommended_crops || analysis?.recommendedCrops || [];
    const techniques = analysis?.improvementTechniques || [];
    const overallHealth = analysis?.overallHealth || "fair";
    const healthColor = overallHealth === "excellent" || overallHealth === "good" ? "#16a34a" : overallHealth === "fair" ? "#f59e0b" : "#dc2626";

    const printHtml = `
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
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
            .health-box { border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid ${healthColor}; background: ${healthColor}15; }
            .health-title { font-size: 18px; font-weight: bold; text-transform: capitalize; color: ${healthColor}; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #166534; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #16a34a; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background: #f9fafb; }
            .crop-tag { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; margin: 4px; font-size: 14px; }
            .technique { background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid #22c55e; }
            .technique-title { font-weight: bold; margin-bottom: 4px; }
            .technique-desc { font-size: 14px; color: #6b7280; }
            .footer { border-top: 2px solid #16a34a; padding-top: 16px; margin-top: 24px; text-align: center; color: #6b7280; font-size: 12px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(22, 163, 74, 0.08); font-weight: bold; z-index: -1; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
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
              <div>Report ID: ${scan.guest_identifier.slice(0, 8)}</div>
            </div>
          </div>

          <div class="info-box">
            <div class="info-grid">
              <div><strong>Guest Name:</strong> ${scan.guest_name || "Anonymous"}</div>
              <div><strong>Location:</strong> ${scan.location_text || "Not specified"}</div>
              <div><strong>Scan Date:</strong> ${formattedDate}</div>
            </div>
          </div>

          <div class="health-box">
            <div class="health-title">Soil Health: ${overallHealth}</div>
            <p style="margin-top: 8px; color: #374151;">${analysis?.summary || "Soil analysis completed successfully."}</p>
          </div>

          <div class="section">
            <div class="section-title">🧪 Nutrient Analysis</div>
            <table>
              <thead>
                <tr>
                  <th>Nutrient</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Nitrogen (N)</strong></td>
                  <td>${scan.nitrogen ?? "N/A"} ppm</td>
                  <td>${analysis?.nutrientAnalysis?.nitrogen?.status || "—"}</td>
                </tr>
                <tr>
                  <td><strong>Phosphorus (P)</strong></td>
                  <td>${scan.phosphorus ?? "N/A"} ppm</td>
                  <td>${analysis?.nutrientAnalysis?.phosphorus?.status || "—"}</td>
                </tr>
                <tr>
                  <td><strong>Potassium (K)</strong></td>
                  <td>${scan.potassium ?? "N/A"} ppm</td>
                  <td>${analysis?.nutrientAnalysis?.potassium?.status || "—"}</td>
                </tr>
                <tr>
                  <td><strong>pH Level</strong></td>
                  <td>${scan.ph ?? "N/A"}</td>
                  <td>${scan.ph ? (scan.ph < 6 ? "Acidic" : scan.ph > 7.5 ? "Alkaline" : "Optimal") : "—"}</td>
                </tr>
                <tr>
                  <td><strong>Organic Matter</strong></td>
                  <td>${scan.organic_matter ?? "N/A"}%</td>
                  <td>${scan.organic_matter ? (scan.organic_matter < 3 ? "Low" : scan.organic_matter > 5 ? "High" : "Good") : "—"}</td>
                </tr>
                <tr>
                  <td><strong>Moisture</strong></td>
                  <td>${scan.moisture ?? "N/A"}%</td>
                  <td>${scan.moisture ? (scan.moisture < 20 ? "Dry" : scan.moisture > 60 ? "Wet" : "Adequate") : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

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

          ${analysis?.seasonalRecommendations ? `
          <div class="section" style="background: #eff6ff; border-radius: 8px; padding: 16px; border-left: 4px solid #3b82f6;">
            <div class="section-title" style="color: #1e40af;">🗓️ Seasonal Tips</div>
            <p style="color: #374151;">${analysis.seasonalRecommendations}</p>
          </div>
          ` : ""}

          <div class="footer">
            <p><strong>Generated by KISAAN - AI Agricultural Analysis System</strong></p>
            <p style="margin-top: 4px;">This report is AI-powered and should be used as guidance alongside expert consultation.</p>
            <p style="margin-top: 8px; font-size: 11px;">Visit kisaan.app to create an account and track your soil health over time.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDownloadSocialImage = async () => {
    if (!socialCardRef.current || !scan) return;

    setIsGeneratingImage(true);
    try {
      // Temporarily make the card visible for rendering
      const card = socialCardRef.current;
      card.style.position = "fixed";
      card.style.left = "-9999px";
      card.style.top = "0";
      card.style.display = "flex";

      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      // Hide it again
      card.style.display = "none";

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to generate image",
            variant: "destructive",
          });
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `kisaan-soil-analysis-${scan.guest_identifier.slice(0, 8)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Image downloaded!",
          description: "Share it on social media to show your soil analysis results.",
        });
      }, "image/png");
    } catch (error) {
      console.error("Error generating social image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !scan) return;

    setIsGeneratingPdf(true);
    try {
      const element = printRef.current;
      element.style.position = "fixed";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.display = "block";
      element.style.width = "800px";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      element.style.display = "none";

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "JPEG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add KISAAN watermark
      pdf.setFontSize(60);
      pdf.setTextColor(200, 200, 200);
      pdf.saveGraphicsState();
      pdf.text("KISAAN", pdfWidth / 2, pdfHeight / 2, { angle: 45, align: "center" });
      pdf.restoreGraphicsState();
      
      pdf.save(`kisaan-soil-report-${scan.guest_identifier.slice(0, 8)}.pdf`);

      toast({
        title: "PDF downloaded!",
        description: "Your soil analysis report has been saved as PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadJpeg = async () => {
    if (!printRef.current || !scan) return;

    setIsGeneratingJpeg(true);
    try {
      const element = printRef.current;
      element.style.position = "fixed";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.display = "block";
      element.style.width = "800px";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      element.style.display = "none";

      // Add KISAAN watermark to canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.font = "bold 120px Arial";
        ctx.fillStyle = "#16a34a";
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = "center";
        ctx.fillText("KISAAN", 0, 0);
        ctx.restore();
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `kisaan-soil-report-${scan.guest_identifier.slice(0, 8)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "JPEG downloaded!", description: "Your soil analysis report has been saved as JPEG image." });
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Error generating JPEG:", error);
      toast({ title: "Error", description: "Failed to generate JPEG. Please try again.", variant: "destructive" });
    } finally {
      setIsGeneratingJpeg(false);
    }
  };

  const handleSendEmail = async () => {
    if (!scan || !emailAddress) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-scan-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailAddress,
          guestName: scan.guest_name,
          location: scan.location_text,
          scanDate: scan.created_at,
          scanId: scan.guest_identifier,
          summary: analysis?.summary || null,
          recommendedCrops: scan.recommended_crops || [],
          nutrients: {
            nitrogen: scan.nitrogen,
            phosphorus: scan.phosphorus,
            potassium: scan.potassium,
            ph: scan.ph,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      toast({ title: "Email sent!", description: `Report sent to ${emailAddress}` });
      setIsEmailDialogOpen(false);
      setEmailAddress("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to send email", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = "My Soil Analysis Report - KISAAN";
    const text = `Check out my soil analysis results from KISAAN: ${scan?.guest_name ? `Scanned for ${scan.guest_name}` : "Emergency Soil Scan"}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        toast({ title: "Shared successfully!" });
      } catch (error) {
        // User cancelled or share failed, try clipboard
        await copyLink();
      }
    } else {
      await copyLink();
    }
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
            <div className="flex items-center gap-2 flex-wrap">
              {/* Download Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isGeneratingPdf || isGeneratingJpeg}
                  >
                    {(isGeneratingPdf || isGeneratingJpeg) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadJpeg} disabled={isGeneratingJpeg}>
                    <FileImage className="w-4 h-4 mr-2" />
                    Download as JPEG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSocialImage} disabled={isGeneratingImage}>
                    <Image className="w-4 h-4 mr-2" />
                    Social Media Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
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
              <Button variant="outline" size="sm" onClick={() => setIsEmailDialogOpen(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Email
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

      {/* Hidden printable report */}
      <div className="hidden">
        {scan && (
          <EmergencyScanPrintableReport
            ref={printRef}
            guestName={scan.guest_name}
            location={scan.location_text}
            scanDate={scan.created_at}
            analysis={analysis}
            scanData={{
              nitrogen: scan.nitrogen,
              phosphorus: scan.phosphorus,
              potassium: scan.potassium,
              ph: scan.ph,
              organic_matter: scan.organic_matter,
              moisture: scan.moisture,
            }}
          />
        )}
      </div>

      {/* Hidden social share card */}
      <div style={{ display: "none" }}>
        {scan && (
          <SocialShareCard
            ref={socialCardRef}
            guestName={scan.guest_name}
            location={scan.location_text}
            scanDate={scan.created_at}
            recommendedCrops={scan.recommended_crops || []}
            summary={analysis?.summary || null}
            nutrientData={{
              nitrogen: scan.nitrogen,
              phosphorus: scan.phosphorus,
              potassium: scan.potassium,
              ph: scan.ph,
            }}
          />
        )}
      </div>
      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
            <DialogDescription>Enter your email address to receive the soil analysis report.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail || !emailAddress}>
              {isSendingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Mail className="w-4 h-4 mr-2" />Send Email</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmergencyScanResult;
