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
      variant="ghost"
      size="sm"
      onClick={() => window.history.back()}
      data-testid="button-back"
      className="gap-2 -ml-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {label || t.common.back}
    </Button>
  );
}
