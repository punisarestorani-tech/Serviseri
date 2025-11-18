import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Wrench, Calendar, Building2, FileText, Hash, Plus } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "@/i18n";
import type { Client, Appliance } from "@shared/schema";
import AddApplianceDialog from "@/components/AddApplianceDialog";

export default function ClientDetailsPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/clients/:id");
  const clientId = params?.id;
  const [isAddApplianceOpen, setIsAddApplianceOpen] = useState(false);

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: appliances = [], isLoading: appliancesLoading } = useQuery<Appliance[]>({
    queryKey: ["/api/appliances"],
  });

  const client = clients.find(c => c.id === clientId);
  const clientAppliances = appliances.filter(a => a.clientId === clientId);
  const isLoading = clientsLoading || appliancesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header username="Technician" onLogout={() => setLocation('/')} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton to="/clients" label={`${t.common.back} ${t.clients.title}`} />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {t.common.loading}
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {t.clients.clientNotFound}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <h2 className="text-3xl font-bold mb-6" data-testid="text-client-name">{client.name}</h2>

        <Card className="p-6 mb-6">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
            {t.clients.contactInfo}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {client.contact && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.clients.phone}:</span>
                <span data-testid="text-phone">{client.contact}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2 text-sm sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{t.clients.address}:</span>
                <span data-testid="text-address">{client.address}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
            {t.clients.businessDetails}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {client.pib && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.clients.pib}:</span>
                <span data-testid="text-pib">{client.pib}</span>
              </div>
            )}
            {client.pdv && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.clients.pdv}:</span>
                <span data-testid="text-pdv">{client.pdv}</span>
              </div>
            )}
            {client.account && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.clients.account}:</span>
                <span data-testid="text-account">{client.account}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm uppercase tracking-wide font-semibold text-muted-foreground">
              {t.appliances.title} ({clientAppliances.length})
            </h3>
            <Button
              size="sm"
              onClick={() => setIsAddApplianceOpen(true)}
              data-testid="button-add-appliance"
            >
              <Plus className="h-4 w-4 mr-1" />
              {t.appliances.addAppliance}
            </Button>
          </div>
          {clientAppliances.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.appliances.noAppliances}</p>
          ) : (
            <div className="space-y-4">
              {clientAppliances.map((appliance) => {
                const applianceLabel = [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || t.appliances.title;
                return (
                  <div
                    key={appliance.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-md hover-elevate active-elevate-2 cursor-pointer overflow-visible"
                    onClick={() => setLocation(`/appliances/${appliance.id}`)}
                    data-testid={`appliance-item-${appliance.id}`}
                  >
                    <div>
                      <p className="font-medium">{applianceLabel}</p>
                      {appliance.lastServiceDate && typeof appliance.lastServiceDate === 'string' && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {t.appliances.lastServiceDate}: {format(new Date(appliance.lastServiceDate), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>

      <AddApplianceDialog
        open={isAddApplianceOpen}
        onOpenChange={setIsAddApplianceOpen}
        clientId={clientId}
        onSuccess={(applianceId) => {
          setLocation(`/appliances/${applianceId}`);
        }}
      />
    </div>
  );
}
