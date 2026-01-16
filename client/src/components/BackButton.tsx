import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useLocation } from "wouter";

interface BackButtonProps {
  label?: string;
  fallbackPath?: string;
}

export default function BackButton({ label, fallbackPath = "/tasks" }: BackButtonProps) {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation(fallbackPath);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleBack}
      data-testid="button-back"
      className="gap-2 bg-secondary/50"
    >
      <ArrowLeft className="h-5 w-5" />
      {label || t.common.back}
    </Button>
  );
}
