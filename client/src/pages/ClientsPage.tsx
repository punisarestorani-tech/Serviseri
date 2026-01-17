import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import ClientCard from "@/components/ClientCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import type { Client, Appliance } from "@shared/schema";

export default function ClientsPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientContactName, setNewClientContactName] = useState("");
  const [newClientContactEmail, setNewClientContactEmail] = useState("");
  const [newClientContactPhone, setNewClientContactPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: appliances = [] } = useQuery<Appliance[]>({
    queryKey: ["/api/appliances"],
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      return await apiRequest("POST", "/api/clients", clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        description: t.clients.createSuccess,
      });
      setNewClientName("");
      setNewClientContactName("");
      setNewClientContactEmail("");
      setNewClientContactPhone("");
      setNewClientAddress("");
      setIsAddClientOpen(false);
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.clients.createError,
        variant: "destructive",
      });
    },
  });

  const handleAddClient = () => {
    createClientMutation.mutate({
      name: newClientName,
      contactName: newClientContactName || null,
      contactEmail: newClientContactEmail || null,
      contactPhone: newClientContactPhone || null,
      address: newClientAddress || null,
    });
  };

  const getApplianceCount = (clientId: string) => {
    return appliances.filter(a => a.clientId === clientId).length;
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <AppLayout title={t.clients.title}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">{t.clients.title}</h2>
          <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-client">
                {t.clients.addClient}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t.clients.addClient}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">
                    {t.clients.name} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="client-name"
                    placeholder={t.clients.namePlaceholder}
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    data-testid="input-client-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-contact-name">
                    {t.clients.contactName}
                  </Label>
                  <Input
                    id="client-contact-name"
                    placeholder={t.clients.contactNamePlaceholder || "Contact person name"}
                    value={newClientContactName}
                    onChange={(e) => setNewClientContactName(e.target.value)}
                    data-testid="input-client-contact-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-contact-email">
                    {t.clients.contactEmail}
                  </Label>
                  <Input
                    id="client-contact-email"
                    type="email"
                    placeholder={t.clients.contactEmailPlaceholder || "contact@example.com"}
                    value={newClientContactEmail}
                    onChange={(e) => setNewClientContactEmail(e.target.value)}
                    data-testid="input-client-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-contact-phone">
                    {t.clients.contactPhone}
                  </Label>
                  <Input
                    id="client-contact-phone"
                    type="tel"
                    placeholder={t.clients.contactPhonePlaceholder || "+382 XX XXX XXX"}
                    value={newClientContactPhone}
                    onChange={(e) => setNewClientContactPhone(e.target.value)}
                    data-testid="input-client-contact-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-address">
                    {t.clients.address}
                  </Label>
                  <Input
                    id="client-address"
                    placeholder={t.clients.addressPlaceholder}
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    data-testid="input-client-address"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddClientOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-client"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    onClick={handleAddClient}
                    disabled={!newClientName || createClientMutation.isPending}
                    className="flex-1"
                    data-testid="button-create-client"
                  >
                    {createClientMutation.isPending ? t.clients.creating : t.clients.addClient}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.clients.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-clients"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client: any) => (
            <ClientCard
              key={client.id || client.clientId}
              clientId={client.id || client.clientId}
              name={client.name}
              contactName={client.contactName}
              contactEmail={client.contactEmail}
              contactPhone={client.contactPhone}
              applianceCount={getApplianceCount(client.id || client.clientId)}
              onClick={() => setLocation(`/clients/${client.id || client.clientId}`)}
            />
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {t.clients.noClients}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
