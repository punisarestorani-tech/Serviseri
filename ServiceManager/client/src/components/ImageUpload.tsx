import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";

interface ImageUploadProps {
  bucket: 'appliance-photos' | 'report-photos' | 'documents' | 'spare-part-photos';
  maxImages?: number;
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export default function ImageUpload({ 
  bucket, 
  maxImages = 10, 
  value = [], 
  onChange,
  disabled = false 
}: ImageUploadProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({
        description: t.reports.maxPhotos,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(file => uploadImage(file, bucket));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      onChange([...value, ...uploadedUrls]);
      
      toast({
        description: t.reports.photoUploaded,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        description: t.reports.photoUploadError,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />

      <Card
        className={`p-8 border-2 border-dashed transition-colors overflow-visible ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover-elevate'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        data-testid="card-upload-zone"
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{t.reports.uploadingPhoto}</p>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Camera className="h-10 w-10 text-muted-foreground" />
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{t.reports.dragDropPhotos}</p>
                <p className="text-xs text-muted-foreground">
                  {value.length} / {maxImages} {t.reports.photos.toLowerCase()}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-md overflow-hidden bg-muted group"
              data-testid={`image-preview-${index}`}
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  disabled={disabled}
                  data-testid={`button-remove-image-${index}`}
                  className="no-default-hover-elevate no-default-active-elevate"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
