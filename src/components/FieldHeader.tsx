import { MapPin, Calendar, FileText } from "lucide-react";

interface FieldHeaderProps {
  fieldName: string;
  location: string;
  reportDate: string;
  acres: number;
}

export const FieldHeader = ({ fieldName, location, reportDate, acres }: FieldHeaderProps) => {
  return (
    <div className="bg-gradient-earth rounded-2xl p-6 text-primary-foreground shadow-earth animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">{fieldName}</h1>
          <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {reportDate}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-display font-bold">{acres}</p>
            <p className="text-xs opacity-80">Acres</p>
          </div>
          <button className="flex items-center gap-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm rounded-lg px-4 py-3 transition-colors">
            <FileText className="w-5 h-5" />
            <span className="font-medium">View Full Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
