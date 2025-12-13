import { Upload, FileUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadReportProps {
  onUpload: () => void;
}

export const UploadReport = ({ onUpload }: UploadReportProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    toast({
      title: "Report Uploaded",
      description: "Your fertilizer report has been analyzed successfully.",
    });
    onUpload();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    toast({
      title: "Report Uploaded",
      description: "Your fertilizer report has been analyzed successfully.",
    });
    onUpload();
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-300 animate-fade-up
        ${isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-card"
        }
      `}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center
          transition-colors duration-300
          ${isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
        `}>
          {isDragging ? (
            <FileUp className="w-8 h-8" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>
        
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">
            Upload Fertilizer Report
          </h3>
          <p className="text-muted-foreground text-sm">
            Drag and drop your PDF or click to browse
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded">PDF</span>
          <span className="px-2 py-1 bg-muted rounded">CSV</span>
          <span className="px-2 py-1 bg-muted rounded">XLS</span>
        </div>
      </div>
    </div>
  );
};
