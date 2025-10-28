import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Hash, Upload, Printer, Package } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import type { Appliance, Client } from "@shared/schema";
import { format } from "date-fns";

export default function ApplianceDetailsPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/appliances/:id");
  
  const { data: appliance, isLoading: isLoadingAppliance } = useQuery<Appliance>({
    queryKey: ["/api/appliances", params?.id],
    enabled: !!params?.id,
  });

  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", appliance?.clientId],
    enabled: !!appliance?.clientId,
  });

  if (isLoadingAppliance) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-muted-foreground">{t.common.loading}</div>
        </main>
      </div>
    );
  }

  if (!appliance) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-muted-foreground">{t.appliances.applianceNotFound}</div>
        </main>
      </div>
    );
  }

  const applianceLabel = [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || t.appliances.title;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header username="John Smith" onLogout={() => setLocation('/')} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 print:hidden">
          <BackButton to={`/clients/${appliance.clientId}`} label={`${t.common.back} ${t.clients.clientDetails}`} />
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">{applianceLabel}</h2>
            <p className="text-muted-foreground">{client?.name}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log('Upload photo')}
              data-testid="button-upload-photo"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {t.appliances.uploadPhoto}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              data-testid="button-print"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              {t.common.print}
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
            {t.appliances.applianceInfo}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {appliance.maker && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.appliances.maker}:</span>
                <span data-testid="text-maker">{appliance.maker}</span>
              </div>
            )}
            {appliance.type && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.appliances.type}:</span>
                <span data-testid="text-type">{appliance.type}</span>
              </div>
            )}
            {appliance.model && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.appliances.model}:</span>
                <span data-testid="text-model">{appliance.model}</span>
              </div>
            )}
            {appliance.serial && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.appliances.serial}:</span>
                <span data-testid="text-serial">{appliance.serial}</span>
              </div>
            )}
            {appliance.lastServiceDate && typeof appliance.lastServiceDate === 'string' && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.appliances.lastServiceDate}:</span>
                <span data-testid="text-last-service">
                  {format(new Date(appliance.lastServiceDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
            {appliance.nextServiceDate && typeof appliance.nextServiceDate === 'string' && (
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.appliances.nextServiceDate}:</span>
                <span data-testid="text-next-service">
                  {format(new Date(appliance.nextServiceDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        </Card>

        {(appliance.city || appliance.building || appliance.room) && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
              {t.appliances.location}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {appliance.city && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.appliances.city}</p>
                  <p className="text-sm font-medium" data-testid="text-city">{appliance.city}</p>
                </div>
              )}
              {appliance.building && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.appliances.building}</p>
                  <p className="text-sm font-medium" data-testid="text-building">{appliance.building}</p>
                </div>
              )}
              {appliance.room && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.appliances.room}</p>
                  <p className="text-sm font-medium" data-testid="text-room">{appliance.room}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        <h3 className="text-xl font-semibold mb-4">{t.appliances.serviceHistory}</h3>
        <div className="text-center py-12 text-muted-foreground">
          {t.appliances.noServiceHistory}
        </div>
      </main>
    </div>
  );
}
