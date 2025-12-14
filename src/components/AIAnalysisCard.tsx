import { useRef } from "react";
import { Sparkles, Wheat, TrendingUp, Info, CheckCircle, AlertCircle, Printer, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintableReport } from "./PrintableReport";

interface AIAnalysis {
  overallHealth: string;
  summary: string;
  recommendedCrops: string[];
  improvementTechniques?: Array<{ title: string; description: string; priority: string }>;
  nutrientAnalysis?: {
    nitrogen?: { status: string; advice: string };
    phosphorus?: { status: string; advice: string };
    potassium?: { status: string; advice: string };
  };
  seasonalRecommendations?: string;
  extractedData?: {
    nitrogen?: number | null;
    phosphorus?: number | null;
    potassium?: number | null;
    ph?: number | null;
    organicMatter?: number | null;
    moisture?: number | null;
  };
}

interface AIAnalysisCardProps {
  analysis: AIAnalysis;
  detectedLanguage?: { language: string; languageName: string };
  fieldName?: string;
  location?: string;
  reportDate?: string;
  reportData?: {
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
    organicMatter: number | null;
    moisture: number | null;
    temperature: number | null;
  };
}

const healthColors: Record<string, string> = {
  excellent: "bg-healthy/10 text-healthy border-healthy/20",
  good: "bg-healthy/10 text-healthy border-healthy/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  poor: "bg-critical/10 text-critical border-critical/20",
};

const statusColors: Record<string, string> = {
  low: "text-warning",
  optimal: "text-healthy",
  high: "text-primary",
};

export const AIAnalysisCard = ({ 
  analysis, 
  detectedLanguage,
  fieldName = "Field",
  location = "Unknown",
  reportDate = new Date().toISOString(),
  reportData = { nitrogen: null, phosphorus: null, potassium: null, ph: null, organicMatter: null, moisture: null, temperature: null }
}: AIAnalysisCardProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KISAAN - Soil Analysis Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            .print-report { padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #16a34a; color: white; }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-green-100 { background-color: #dcfce7; }
            .bg-yellow-100 { background-color: #fef9c3; }
            .bg-red-100 { background-color: #fee2e2; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-gray-50 { background-color: #f9fafb; }
            .text-green-800 { color: #166534; }
            .text-green-600 { color: #16a34a; }
            .text-yellow-600 { color: #ca8a04; }
            .text-blue-800 { color: #1e40af; }
            .border-green-600 { border-color: #16a34a; }
            .border-yellow-600 { border-color: #ca8a04; }
            .border-red-600 { border-color: #dc2626; }
            .border-blue-600 { border-color: #2563eb; }
            .rounded-lg { border-radius: 8px; }
            .rounded-full { border-radius: 9999px; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .gap-2 { gap: 8px; }
            .gap-3 { gap: 12px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-6 { margin-bottom: 24px; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .p-8 { padding: 32px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-4 { padding-top: 16px; }
            .mt-8 { margin-top: 32px; }
            .text-sm { font-size: 14px; }
            .text-xs { font-size: 12px; }
            .text-lg { font-size: 18px; }
            .text-2xl { font-size: 24px; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .capitalize { text-transform: capitalize; }
            .border-b-2 { border-bottom: 2px solid; }
            .border-t-2 { border-top: 2px solid; }
            .border-l-4 { border-left: 4px solid; }
            .grid { display: grid; }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .space-y-3 > * + * { margin-top: 12px; }
            .flex-wrap { flex-wrap: wrap; }
            .justify-between { justify-content: space-between; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      {/* Hidden printable report */}
      <div className="hidden">
        <PrintableReport
          ref={printRef}
          fieldName={fieldName}
          location={location}
          reportDate={reportDate}
          analysis={analysis}
          reportData={reportData}
          detectedLanguage={detectedLanguage}
        />
      </div>

      <div className="bg-card rounded-xl p-6 shadow-earth animate-fade-up space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="font-display text-lg font-bold text-foreground">AI Analysis</h3>
          </div>
          <div className="flex items-center gap-2">
            {detectedLanguage && (
              <Badge variant="outline" className="text-xs">
                {detectedLanguage.languageName}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

      {/* Overall Health */}
      <div className={cn(
        "px-4 py-3 rounded-lg border",
        healthColors[analysis.overallHealth] || healthColors.fair
      )}>
        <div className="flex items-center gap-2 mb-1">
          {analysis.overallHealth === "excellent" || analysis.overallHealth === "good" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <p className="text-sm font-medium capitalize">
            Soil Health: {analysis.overallHealth}
          </p>
        </div>
        <p className="text-sm opacity-80">{analysis.summary}</p>
      </div>

      {/* Extracted Data from Image */}
      {analysis.extractedData && (
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Extracted from Report</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {analysis.extractedData.nitrogen != null && (
              <div className="bg-background rounded p-2">
                <p className="font-bold text-foreground">{analysis.extractedData.nitrogen}</p>
                <p className="text-xs text-muted-foreground">N (ppm)</p>
              </div>
            )}
            {analysis.extractedData.phosphorus != null && (
              <div className="bg-background rounded p-2">
                <p className="font-bold text-foreground">{analysis.extractedData.phosphorus}</p>
                <p className="text-xs text-muted-foreground">P (ppm)</p>
              </div>
            )}
            {analysis.extractedData.potassium != null && (
              <div className="bg-background rounded p-2">
                <p className="font-bold text-foreground">{analysis.extractedData.potassium}</p>
                <p className="text-xs text-muted-foreground">K (ppm)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NPK Nutrient Analysis */}
      {analysis.nutrientAnalysis && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">NPK Analysis</span>
          </div>
          <div className="space-y-2 text-sm">
            {analysis.nutrientAnalysis.nitrogen && (
              <div className="flex gap-2">
                <span className={cn("font-medium", statusColors[analysis.nutrientAnalysis.nitrogen.status] || "")}>
                  N ({analysis.nutrientAnalysis.nitrogen.status}):
                </span>
                <span className="text-muted-foreground">{analysis.nutrientAnalysis.nitrogen.advice}</span>
              </div>
            )}
            {analysis.nutrientAnalysis.phosphorus && (
              <div className="flex gap-2">
                <span className={cn("font-medium", statusColors[analysis.nutrientAnalysis.phosphorus.status] || "")}>
                  P ({analysis.nutrientAnalysis.phosphorus.status}):
                </span>
                <span className="text-muted-foreground">{analysis.nutrientAnalysis.phosphorus.advice}</span>
              </div>
            )}
            {analysis.nutrientAnalysis.potassium && (
              <div className="flex gap-2">
                <span className={cn("font-medium", statusColors[analysis.nutrientAnalysis.potassium.status] || "")}>
                  K ({analysis.nutrientAnalysis.potassium.status}):
                </span>
                <span className="text-muted-foreground">{analysis.nutrientAnalysis.potassium.advice}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommended Crops */}
      {analysis.recommendedCrops && analysis.recommendedCrops.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wheat className="w-4 h-4 text-wheat" />
            <span className="text-sm font-medium text-foreground">Recommended Crops</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.recommendedCrops.map((crop, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-wheat/10 text-soil rounded-full text-sm"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Seasonal Recommendations */}
      {analysis.seasonalRecommendations && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Seasonal Tips</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {analysis.seasonalRecommendations}
          </p>
        </div>
      )}
      </div>
    </>
  );
};