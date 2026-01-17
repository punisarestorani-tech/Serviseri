import { Card } from "@/components/ui/card";
import { Mail, Phone, Wrench, User } from "lucide-react";
import { useTranslation } from "@/i18n";

interface ClientCardProps {
  clientId: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  applianceCount: number;
  onClick?: () => void;
}

export default function ClientCard({
  clientId,
  name,
  contactName,
  contactEmail,
  contactPhone,
  applianceCount,
  onClick,
}: ClientCardProps) {
  const t = useTranslation();
  return (
    <Card
      className="p-5 cursor-pointer overflow-visible transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/30 group"
      onClick={onClick}
      data-testid={`card-client-${clientId}`}
    >
      <h3 className="text-lg font-bold mb-4 group-hover:text-primary transition-colors" data-testid={`text-client-name-${clientId}`}>
        {name}
      </h3>
      <div className="space-y-2 mb-4">
        {contactName && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" data-testid={`text-contact-name-${clientId}`}>
              {contactName}
            </span>
          </div>
        )}
        {contactPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" data-testid={`text-contact-phone-${clientId}`}>
              {contactPhone}
            </span>
          </div>
        )}
        {contactEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground" data-testid={`text-contact-email-${clientId}`}>
              {contactEmail}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm font-medium pt-3 mt-2 border-t border-primary/10">
        <Wrench className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
        <span data-testid={`text-appliance-count-${clientId}`}>
          {applianceCount} {applianceCount === 1 ? t.appliances.applianceSingular : t.appliances.appliancePlural}
        </span>
      </div>
    </Card>
  );
}
