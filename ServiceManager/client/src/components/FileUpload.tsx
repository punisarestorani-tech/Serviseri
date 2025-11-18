import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onChange?: (files: File[]) => void;
  className?: string;
}

export default function FileUpload({
  accept = "image/*",
  multiple = true,
  maxSize = 5242880,
  onChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((file) => file.size <= maxSize);
    
    setFiles(validFiles);
    onChange?.(validFiles);

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(previews[index]);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange?.(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <label
        htmlFor="file-upload"
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate block"
        data-testid="label-file-upload"
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground">
          {accept === "image/*" ? "Images" : "Files"} up to {maxSize / 1024 / 1024}MB
        </p>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          data-testid="input-file"
        />
      </label>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border"
              data-testid={`preview-image-${index}`}
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeFile(index)}
                data-testid={`button-remove-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
