import { forwardRef } from "react";
import { Sprout, MapPin, Calendar, Leaf, Wheat, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";

interface EmergencyScanPrintableReportProps {
  guestName: string | null;
  location: string | null;
  scanDate: string;
  analysis: {
    overallHealth?: string;
    summary?: string;
    recommendedCrops?: string[];
    improvementTechniques?: Array<{ title: string; description?: string; priority?: string }>;
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
  } | null;
  scanData: {
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
    organic_matter: number | null;
    moisture: number | null;
  };
}

export const EmergencyScanPrintableReport = forwardRef<HTMLDivElement, EmergencyScanPrintableReportProps>(
  ({ guestName, location, scanDate, analysis, scanData }, ref) => {
    const priorityColors: Record<string, string> = {
      high: "#dc2626",
      medium: "#f59e0b",
      low: "#22c55e",
    };

    const overallHealth = analysis?.overallHealth || "fair";

    return (
      <div
        ref={ref}
        className="print-report bg-white text-black p-8 max-w-4xl mx-auto"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-green-600 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-800">KISAAN - Emergency Soil Scan Report</h1>
              <p className="text-sm text-gray-600">AI-Powered Agricultural Insights</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>Scan ID: {scanDate.split("T")[0]}</p>
          </div>
        </div>

        {/* Scan Info */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Scan Information
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Guest Name:</span> {guestName || "Anonymous"}
            </div>
            <div>
              <span className="font-semibold">Location:</span> {location || "Not specified"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">Scan Date:</span> {new Date(scanDate).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Overall Health */}
        <div
          className={`rounded-lg p-4 mb-6 ${
            overallHealth === "excellent" || overallHealth === "good"
              ? "bg-green-100 border-l-4 border-green-600"
              : overallHealth === "fair"
              ? "bg-yellow-100 border-l-4 border-yellow-600"
              : "bg-red-100 border-l-4 border-red-600"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {overallHealth === "excellent" || overallHealth === "good" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <h2 className="text-lg font-bold capitalize">
              Soil Health: {overallHealth}
            </h2>
          </div>
          <p className="text-gray-700">{analysis?.summary || "Soil analysis completed."}</p>
        </div>

        {/* NPK Values Table */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
            <Leaf className="w-5 h-5" /> Soil Nutrient Analysis
          </h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="border border-gray-300 p-2 text-left">Nutrient</th>
                <th className="border border-gray-300 p-2 text-center">Value</th>
                <th className="border border-gray-300 p-2 text-center">Status</th>
                <th className="border border-gray-300 p-2 text-left">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-semibold">Nitrogen (N)</td>
                <td className="border border-gray-300 p-2 text-center">
                  {scanData.nitrogen ?? analysis?.extractedData?.nitrogen ?? "N/A"} ppm
                </td>
                <td className="border border-gray-300 p-2 text-center capitalize">
                  {analysis?.nutrientAnalysis?.nitrogen?.status || "—"}
                </td>
                <td className="border border-gray-300 p-2 text-sm">
                  {analysis?.nutrientAnalysis?.nitrogen?.advice || "—"}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 font-semibold">Phosphorus (P)</td>
                <td className="border border-gray-300 p-2 text-center">
                  {scanData.phosphorus ?? analysis?.extractedData?.phosphorus ?? "N/A"} ppm
                </td>
                <td className="border border-gray-300 p-2 text-center capitalize">
                  {analysis?.nutrientAnalysis?.phosphorus?.status || "—"}
                </td>
                <td className="border border-gray-300 p-2 text-sm">
                  {analysis?.nutrientAnalysis?.phosphorus?.advice || "—"}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-semibold">Potassium (K)</td>
                <td className="border border-gray-300 p-2 text-center">
                  {scanData.potassium ?? analysis?.extractedData?.potassium ?? "N/A"} ppm
                </td>
                <td className="border border-gray-300 p-2 text-center capitalize">
                  {analysis?.nutrientAnalysis?.potassium?.status || "—"}
                </td>
                <td className="border border-gray-300 p-2 text-sm">
                  {analysis?.nutrientAnalysis?.potassium?.advice || "—"}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 font-semibold">pH Level</td>
                <td className="border border-gray-300 p-2 text-center">
                  {scanData.ph ?? analysis?.extractedData?.ph ?? "N/A"}
                </td>
                <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                  {scanData.ph
                    ? scanData.ph < 6
                      ? "Acidic - Consider lime application"
                      : scanData.ph > 7.5
                      ? "Alkaline - Consider sulfur application"
                      : "Optimal range"
                    : "—"}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-semibold">Organic Matter</td>
                <td className="border border-gray-300 p-2 text-center">
                  {scanData.organic_matter ?? analysis?.extractedData?.organicMatter ?? "N/A"}%
                </td>
                <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                  {scanData.organic_matter
                    ? scanData.organic_matter < 3
                      ? "Low - Add compost or organic matter"
                      : scanData.organic_matter > 5
                      ? "High - Excellent soil health"
                      : "Good level"
                    : "—"}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 p-2 font-semibold">Moisture</td>
                <td className="border border-gray-300 p-2 text-center">
                  {scanData.moisture ?? analysis?.extractedData?.moisture ?? "N/A"}%
                </td>
                <td className="border border-gray-300 p-2 text-center" colSpan={2}>
                  {scanData.moisture
                    ? scanData.moisture < 20
                      ? "Dry - Irrigation recommended"
                      : scanData.moisture > 60
                      ? "Wet - Improve drainage"
                      : "Adequate moisture"
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recommended Crops */}
        {analysis?.recommendedCrops && analysis.recommendedCrops.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
              <Wheat className="w-5 h-5" /> Recommended Crops
            </h2>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedCrops.map((crop, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm border border-yellow-300"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Techniques */}
        {analysis?.improvementTechniques && analysis.improvementTechniques.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Improvement Techniques
            </h2>
            <div className="space-y-3">
              {analysis.improvementTechniques.map((technique, i) => (
                <div 
                  key={i} 
                  className="bg-gray-50 rounded-lg p-3 border-l-4" 
                  style={{ borderColor: priorityColors[technique.priority || "medium"] || "#22c55e" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{technique.title}</span>
                    {technique.priority && (
                      <span
                        className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: priorityColors[technique.priority] + "20",
                          color: priorityColors[technique.priority],
                        }}
                      >
                        {technique.priority} priority
                      </span>
                    )}
                  </div>
                  {technique.description && (
                    <p className="text-sm text-gray-700">{technique.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Recommendations */}
        {analysis?.seasonalRecommendations && (
          <div className="mb-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
            <h2 className="text-lg font-bold text-blue-800 mb-2">Seasonal Tips</h2>
            <p className="text-gray-700">{analysis.seasonalRecommendations}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-green-600 pt-4 mt-8 text-center text-sm text-gray-500">
          <p>Generated by KISAAN - AI Agricultural Analysis System</p>
          <p>This report is based on AI analysis and should be used as guidance alongside expert consultation.</p>
          <p className="mt-2 text-xs">Create an account at kisaan.app to save and track your soil health over time.</p>
        </div>
      </div>
    );
  }
);

EmergencyScanPrintableReport.displayName = "EmergencyScanPrintableReport";