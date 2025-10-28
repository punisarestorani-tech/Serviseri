import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, Hash, Upload, Printer, Package } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Appliance, Client } from "@shared/schema";
import { format } from "date-fns";

export default function ApplianceDetailsPage() {
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
        <Header username="John Smith" onLogout={() => setLocation('/')} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (!appliance) {
    return (
      <div className="min-h-screen bg-background">
        <Header username="John Smith" onLogout={() => setLocation('/')} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 text-muted-foreground">Appliance not found</div>
        </main>
      </div>
    );
  }

  const applianceLabel = [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || 'Appliance';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header username="John Smith" onLogout={() => setLocation('/')} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 print:hidden">
          <BackButton to={`/clients/${appliance.clientId}`} label="Back to Client" />
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
              Upload Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              data-testid="button-print"
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
            Appliance Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {appliance.maker && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Maker:</span>
                <span data-testid="text-maker">{appliance.maker}</span>
              </div>
            )}
            {appliance.type && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span data-testid="text-type">{appliance.type}</span>
              </div>
            )}
            {appliance.model && (
              <div className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Model:</span>
                <span data-testid="text-model">{appliance.model}</span>
              </div>
            )}
            {appliance.serial && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Serial:</span>
                <span data-testid="text-serial">{appliance.serial}</span>
              </div>
            )}
            {appliance.iga && (
              <div className="flex items-center gap-2 text-sm font-mono">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">IGA:</span>
                <span data-testid="text-iga">{appliance.iga}</span>
              </div>
            )}
            {appliance.lastServiceDate && typeof appliance.lastServiceDate === 'string' && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Service:</span>
                <span data-testid="text-last-service">
                  {format(new Date(appliance.lastServiceDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
            {appliance.nextServiceDate && typeof appliance.nextServiceDate === 'string' && (
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Next Service:</span>
                <span data-testid="text-next-service">
                  {format(new Date(appliance.nextServiceDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
        </Card>

        <h3 className="text-xl font-semibold mb-4">Service History</h3>
        <div className="text-center py-12 text-muted-foreground">
          No service history available yet
        </div>
      </main>
    </div>
  );
}
