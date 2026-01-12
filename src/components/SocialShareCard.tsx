import { forwardRef } from "react";
import { Sprout, Leaf, MapPin } from "lucide-react";

interface SocialShareCardProps {
  guestName: string | null;
  location: string | null;
  scanDate: string;
  recommendedCrops: string[];
  summary: string | null;
  nutrientData: {
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    ph: number | null;
  };
}

export const SocialShareCard = forwardRef<HTMLDivElement, SocialShareCardProps>(
  ({ guestName, location, scanDate, recommendedCrops, summary, nutrientData }, ref) => {
    const formattedDate = new Date(scanDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div
        ref={ref}
        className="w-[1200px] h-[630px] bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-12 flex flex-col"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">KISAAN</h1>
              <p className="text-white/80 text-lg">AI Soil Analysis</p>
            </div>
          </div>
          <div className="text-right text-white/80">
            <p className="text-lg">{formattedDate}</p>
            {location && (
              <p className="flex items-center justify-end gap-1 text-sm">
                <MapPin className="w-4 h-4" /> {location}
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-8">
          {/* Left - NPK Values */}
          <div className="flex-1 bg-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-white text-xl font-semibold mb-6 flex items-center gap-2">
              <Leaf className="w-6 h-6" /> Soil Nutrients
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {nutrientData.nitrogen != null && (
                <div className="bg-white/20 rounded-2xl p-5 text-center">
                  <p className="text-white/70 text-sm mb-1">Nitrogen (N)</p>
                  <p className="text-white text-4xl font-bold">{nutrientData.nitrogen}</p>
                  <p className="text-white/60 text-sm">ppm</p>
                </div>
              )}
              {nutrientData.phosphorus != null && (
                <div className="bg-white/20 rounded-2xl p-5 text-center">
                  <p className="text-white/70 text-sm mb-1">Phosphorus (P)</p>
                  <p className="text-white text-4xl font-bold">{nutrientData.phosphorus}</p>
                  <p className="text-white/60 text-sm">ppm</p>
                </div>
              )}
              {nutrientData.potassium != null && (
                <div className="bg-white/20 rounded-2xl p-5 text-center">
                  <p className="text-white/70 text-sm mb-1">Potassium (K)</p>
                  <p className="text-white text-4xl font-bold">{nutrientData.potassium}</p>
                  <p className="text-white/60 text-sm">ppm</p>
                </div>
              )}
              {nutrientData.ph != null && (
                <div className="bg-white/20 rounded-2xl p-5 text-center">
                  <p className="text-white/70 text-sm mb-1">pH Level</p>
                  <p className="text-white text-4xl font-bold">{nutrientData.ph}</p>
                  <p className="text-white/60 text-sm">scale</p>
                </div>
              )}
            </div>
          </div>

          {/* Right - Recommendations */}
          <div className="flex-1 flex flex-col">
            {summary && (
              <div className="bg-white/10 rounded-3xl p-8 backdrop-blur-sm mb-6 flex-1">
                <h2 className="text-white text-xl font-semibold mb-4">AI Analysis</h2>
                <p className="text-white/90 text-lg leading-relaxed line-clamp-4">{summary}</p>
              </div>
            )}
            
            {recommendedCrops.length > 0 && (
              <div className="bg-yellow-400/20 rounded-3xl p-6 backdrop-blur-sm">
                <h2 className="text-white text-lg font-semibold mb-4">🌾 Recommended Crops</h2>
                <div className="flex flex-wrap gap-3">
                  {recommendedCrops.slice(0, 5).map((crop, i) => (
                    <span
                      key={i}
                      className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-semibold text-sm"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-white/60 text-sm">
            Scanned for: <span className="text-white font-medium">{guestName || "Anonymous"}</span>
          </p>
          <p className="text-white/80 text-lg font-medium">
            kisaan.app • Free Soil Analysis
          </p>
        </div>
      </div>
    );
  }
);

SocialShareCard.displayName = "SocialShareCard";