import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/i18n";

interface BackButtonProps {
  label?: string;
}

export default function BackButton({ label }: BackButtonProps) {
  const t = useTranslation();
  
  return (
    <Button
      variant="outline"
      size="default"
      onClick={() => window.history.back()}
      data-testid="button-back"
      className="gap-2 bg-secondary/50"
    >
      <ArrowLeft className="h-5 w-5" />
      {label || t.common.back}
    </Button>
  );
}
