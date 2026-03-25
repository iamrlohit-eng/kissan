import { useState, useRef } from "react";
import { Upload, Camera, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  cameraType: "file" | "camera";
}

interface ImageUploaderProps {
  onImageSelect: (imageBase64: string, metadata: ImageMetadata) => void;
  fieldId: string;
  isLoading?: boolean;
}

export const ImageUploader = ({
  onImageSelect,
  fieldId,
  isLoading = false,
}: ImageUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          () => reject(new Error("Location access denied"))
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  const processImage = async (file: File) => {
    try {
      setError("");
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);

        let metadata: ImageMetadata;
        try {
          const location = await getLocation();
          metadata = {
            latitude: location.lat,
            longitude: location.lng,
            timestamp: new Date().toISOString(),
            cameraType: "file",
          };
        } catch {
          metadata = {
            latitude: null,
            longitude: null,
            timestamp: new Date().toISOString(),
            cameraType: "file",
          };
        }
        onImageSelect(base64, metadata);
      };

      reader.onerror = () => setError("Failed to read image");
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      if (!files[0].type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }
      processImage(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed transition-all duration-300 ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
          className="hidden"
        />

        {!preview && !isLoading && (
          <div
            className="p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              Drop your field image here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse • JPG, PNG supported
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="p-8 text-center">
            <Loader className="mx-auto h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-semibold text-foreground">
              Analyzing your field image...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              AI is detecting pests and diseases
            </p>
          </div>
        )}

        {preview && !isLoading && (
          <div className="p-6">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            <div className="flex items-center gap-2 text-primary mb-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Image ready for analysis</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Image
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};
