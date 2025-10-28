import { Card } from "@/components/ui/card";
import { Mail, Phone, Wrench } from "lucide-react";
import { useTranslation } from "@/i18n";

interface ClientCardProps {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  applianceCount: number;
  onClick?: () => void;
}

export default function ClientCard({
  clientId,
  name,
  email,
  phone,
  applianceCount,
  onClick,
}: ClientCardProps) {
  const t = useTranslation();
  return (
    <Card
      className="p-5 hover-elevate active-elevate-2 cursor-pointer overflow-visible"
      onClick={onClick}
      data-testid={`card-client-${clientId}`}
    >
      <h3 className="text-lg font-bold mb-4" data-testid={`text-client-name-${clientId}`}>
        {name}
      </h3>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground" data-testid={`text-email-${clientId}`}>
            {email}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground" data-testid={`text-phone-${clientId}`}>
            {phone}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-medium pt-2 border-t">
        <Wrench className="h-4 w-4 text-primary" />
        <span data-testid={`text-appliance-count-${clientId}`}>
          {applianceCount} {applianceCount === 1 ? t.appliances.applianceSingular : t.appliances.appliancePlural}
        </span>
      </div>
    </Card>
  );
}
