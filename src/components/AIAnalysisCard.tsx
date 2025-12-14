import { Sparkles, Wheat, TrendingUp, Info, CheckCircle, AlertCircle, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Please allow popups for this site to print the report.");
      return;
    }

    const printStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 24px; background: white; color: black; }
        .report-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-box { width: 48px; height: 48px; background: #16a34a; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-box svg { width: 32px; height: 32px; color: white; }
        .title-area h1 { font-size: 24px; color: #166534; margin: 0; }
        .title-area p { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .date-section { text-align: right; font-size: 12px; color: #6b7280; }
        .field-info { background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .field-info h2 { font-size: 16px; color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .field-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; font-size: 13px; }
        .health-box { padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid; }
        .health-excellent, .health-good { background: #dcfce7; border-color: #16a34a; }
        .health-fair { background: #fef9c3; border-color: #ca8a04; }
        .health-poor { background: #fee2e2; border-color: #dc2626; }
        .health-box h3 { font-size: 16px; margin-bottom: 8px; text-transform: capitalize; }
        .health-box p { font-size: 13px; color: #374151; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 16px; font-weight: bold; color: #166534; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #16a34a; color: white; padding: 10px; text-align: left; font-size: 13px; }
        td { padding: 10px; border: 1px solid #d1d5db; font-size: 13px; }
        tr:nth-child(even) { background: #f9fafb; }
        .crop-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .crop-tag { background: #fef9c3; color: #854d0e; padding: 6px 14px; border-radius: 20px; font-size: 13px; border: 1px solid #fde047; }
        .technique-card { background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid; }
        .technique-high { border-color: #dc2626; }
        .technique-medium { border-color: #f59e0b; }
        .technique-low { border-color: #22c55e; }
        .technique-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
        .technique-desc { font-size: 13px; color: #4b5563; }
        .priority-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; text-transform: capitalize; }
        .priority-high { background: #fee2e2; color: #dc2626; }
        .priority-medium { background: #fef3c7; color: #d97706; }
        .priority-low { background: #dcfce7; color: #16a34a; }
        .seasonal-box { background: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin-bottom: 24px; }
        .seasonal-box h3 { color: #1e40af; font-size: 15px; margin-bottom: 8px; }
        .seasonal-box p { font-size: 13px; color: #374151; }
        .footer { border-top: 2px solid #16a34a; padding-top: 16px; margin-top: 32px; text-align: center; font-size: 12px; color: #6b7280; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style>
    `;

    const healthClass = analysis.overallHealth === "excellent" || analysis.overallHealth === "good" 
      ? "health-good" 
      : analysis.overallHealth === "fair" ? "health-fair" : "health-poor";

    const getNutrientValue = (nutrient: 'nitrogen' | 'phosphorus' | 'potassium') => {
      return reportData[nutrient] ?? analysis.extractedData?.[nutrient] ?? "N/A";
    };

    const cropsHtml = analysis.recommendedCrops?.length 
      ? `<div class="section">
          <div class="section-title">🌾 Recommended Crops</div>
          <div class="crop-tags">
            ${analysis.recommendedCrops.map(crop => `<span class="crop-tag">${crop}</span>`).join('')}
          </div>
        </div>`
      : '';

    const techniquesHtml = analysis.improvementTechniques?.length
      ? `<div class="section">
          <div class="section-title">📈 Improvement Techniques</div>
          ${analysis.improvementTechniques.map(t => `
            <div class="technique-card technique-${t.priority}">
              <div class="technique-title">${t.title}<span class="priority-badge priority-${t.priority}">${t.priority} priority</span></div>
              <div class="technique-desc">${t.description}</div>
            </div>
          `).join('')}
        </div>`
      : '';

    const seasonalHtml = analysis.seasonalRecommendations
      ? `<div class="seasonal-box">
          <h3>🌱 Seasonal Tips</h3>
          <p>${analysis.seasonalRecommendations}</p>
        </div>`
      : '';

    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>KISAAN - Soil Analysis Report - ${fieldName}</title>
          ${printStyles}
        </head>
        <body>
          <div class="report-header">
            <div class="logo-section">
              <div class="logo-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 20h10M10 20c5.5-2.5.8-6.4 3-10M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8zM14.1 6a7 7 0 00-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
                </svg>
              </div>
              <div class="title-area">
                <h1>KISAAN - Soil Analysis Report</h1>
                <p>AI-Powered Agricultural Insights</p>
              </div>
            </div>
            <div class="date-section">
              <p>Generated: ${new Date().toLocaleDateString()}</p>
              ${detectedLanguage ? `<p>Language: ${detectedLanguage.languageName}</p>` : ''}
            </div>
          </div>

          <div class="field-info">
            <h2>📍 Field Information</h2>
            <div class="field-grid">
              <div><strong>Field:</strong> ${fieldName}</div>
              <div><strong>Location:</strong> ${location}</div>
              <div><strong>Report Date:</strong> ${new Date(reportDate).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="health-box ${healthClass}">
            <h3>Soil Health: ${analysis.overallHealth}</h3>
            <p>${analysis.summary}</p>
          </div>

          <div class="section">
            <div class="section-title">🧪 Soil Nutrient Analysis</div>
            <table>
              <thead>
                <tr>
                  <th>Nutrient</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Nitrogen (N)</strong></td>
                  <td>${getNutrientValue('nitrogen')} ppm</td>
                  <td style="text-transform:capitalize">${analysis.nutrientAnalysis?.nitrogen?.status || "—"}</td>
                  <td>${analysis.nutrientAnalysis?.nitrogen?.advice || "—"}</td>
                </tr>
                <tr>
                  <td><strong>Phosphorus (P)</strong></td>
                  <td>${getNutrientValue('phosphorus')} ppm</td>
                  <td style="text-transform:capitalize">${analysis.nutrientAnalysis?.phosphorus?.status || "—"}</td>
                  <td>${analysis.nutrientAnalysis?.phosphorus?.advice || "—"}</td>
                </tr>
                <tr>
                  <td><strong>Potassium (K)</strong></td>
                  <td>${getNutrientValue('potassium')} ppm</td>
                  <td style="text-transform:capitalize">${analysis.nutrientAnalysis?.potassium?.status || "—"}</td>
                  <td>${analysis.nutrientAnalysis?.potassium?.advice || "—"}</td>
                </tr>
                <tr>
                  <td><strong>pH Level</strong></td>
                  <td>${reportData.ph ?? analysis.extractedData?.ph ?? "N/A"}</td>
                  <td colspan="2">${reportData.ph ? (reportData.ph < 6 ? "Acidic - Consider lime" : reportData.ph > 7.5 ? "Alkaline - Consider sulfur" : "Optimal") : "—"}</td>
                </tr>
                <tr>
                  <td><strong>Organic Matter</strong></td>
                  <td>${reportData.organicMatter ?? analysis.extractedData?.organicMatter ?? "N/A"}%</td>
                  <td colspan="2">${reportData.organicMatter ? (reportData.organicMatter < 3 ? "Low - Add compost" : reportData.organicMatter > 5 ? "Excellent" : "Good") : "—"}</td>
                </tr>
                <tr>
                  <td><strong>Moisture</strong></td>
                  <td>${reportData.moisture ?? analysis.extractedData?.moisture ?? "N/A"}%</td>
                  <td colspan="2">${reportData.moisture ? (reportData.moisture < 20 ? "Dry - Irrigate" : reportData.moisture > 60 ? "Wet - Improve drainage" : "Adequate") : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${cropsHtml}
          ${techniquesHtml}
          ${seasonalHtml}

          <div class="footer">
            <p>Generated by KISAAN - AI Agricultural Analysis System</p>
            <p>This report is based on AI analysis and should be used as guidance alongside expert consultation.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <>
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