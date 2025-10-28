import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import AddApplianceDialog from "@/components/AddApplianceDialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, FileText, History, Upload, Wrench, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Appliance, Client } from "@shared/schema";
import { format } from "date-fns";

//todo: remove mock functionality
const mockSpareParts = [
  {
    id: "1",
    name: "Compressor Belt",
    maker: "ThermoKing",
    detail: "Universal replacement belt",
    quantity: 15,
  },
  {
    id: "2",
    name: "Refrigerant R-134a (1kg)",
    maker: "DuPont",
    detail: "Environmentally friendly refrigerant",
    quantity: 3,
  },
  {
    id: "3",
    name: "Thermostat Controller",
    maker: "Honeywell",
    detail: "Digital temperature controller",
    quantity: 8,
  },
  {
    id: "4",
    name: "Door Seal Gasket",
    maker: "Universal",
    detail: "Heavy-duty rubber seal",
    quantity: 22,
  },
];

const mockDocuments = [
  {
    id: "1",
    name: "ThermoKing Service Manual",
    uploadedDate: new Date('2024-01-05'),
    type: "PDF",
  },
  {
    id: "2",
    name: "Safety Guidelines",
    uploadedDate: new Date('2024-01-03'),
    type: "PDF",
  },
  {
    id: "3",
    name: "Warranty Information",
    uploadedDate: new Date('2023-12-28'),
    type: "PDF",
  },
];

const mockHistory = [
  {
    id: "1",
    clientName: "Grand Hotel Plaza",
    applianceName: "Commercial Freezer Unit",
    date: new Date('2024-01-10'),
    technicianName: "John Smith",
    description: "Replaced compressor belt, cleaned condenser coils",
  },
  {
    id: "2",
    clientName: "Riverside Restaurant",
    applianceName: "Ice Maker - Kitchen",
    date: new Date('2024-01-08'),
    technicianName: "Sarah Johnson",
    description: "Repaired water inlet valve",
  },
  {
    id: "3",
    clientName: "Marina Bistro",
    applianceName: "Walk-in Cooler",
    date: new Date('2024-01-05'),
    technicianName: "Mike Davis",
    description: "Annual maintenance, refrigerant check",
  },
];

export default function StoragePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("parts");
  const [isAddApplianceOpen, setIsAddApplianceOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const { data: appliances = [] } = useQuery<Appliance[]>({
    queryKey: ["/api/appliances"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header username="John Smith" onLogout={() => setLocation('/')} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton to="/dashboard" label="Back to Dashboard" />
        </div>

        <h2 className="text-3xl font-bold mb-6">Storage</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parts" data-testid="tab-parts" className="gap-2">
              <Package className="h-4 w-4" />
              Spare Parts
            </TabsTrigger>
            <TabsTrigger value="appliances" data-testid="tab-appliances" className="gap-2">
              <Wrench className="h-4 w-4" />
              Appliances
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockSpareParts.map((part) => (
                <Card key={part.id} className="p-5" data-testid={`card-part-${part.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-lg">{part.name}</h3>
                    <Badge
                      variant="outline"
                      className={
                        part.quantity < 5
                          ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          : ""
                      }
                      data-testid={`badge-quantity-${part.id}`}
                    >
                      {part.quantity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{part.maker}</p>
                  <p className="text-sm text-muted-foreground">{part.detail}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appliances" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-full sm:w-64" data-testid="select-storage-client-filter">
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsAddApplianceOpen(true)}
                disabled={!selectedClientId || selectedClientId === "all"}
                data-testid="button-add-appliance-storage"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Appliance
              </Button>
            </div>

            {(() => {
              const filteredAppliances = appliances.filter(appliance => 
                selectedClientId === "all" || !selectedClientId || appliance.clientId === selectedClientId
              );

              if (filteredAppliances.length === 0) {
                return (
                  <div className="text-center py-12 text-muted-foreground">
                    {appliances.length === 0
                      ? "No appliances found. Select a client and add one to get started."
                      : selectedClientId && selectedClientId !== "all"
                        ? "No appliances found for the selected client."
                        : "No appliances found."}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAppliances.map((appliance) => {
                    const client = clients.find(c => c.id === appliance.clientId);
                    const applianceLabel = [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || 'Appliance';
                    return (
                      <Card 
                        key={appliance.id} 
                        className="p-5 hover-elevate active-elevate-2 cursor-pointer overflow-visible" 
                        data-testid={`card-appliance-${appliance.id}`}
                        onClick={() => setLocation(`/appliances/${appliance.id}`)}
                      >
                        <div className="mb-3">
                          <h3 className="font-medium text-lg mb-1">{applianceLabel}</h3>
                          <p className="text-sm text-primary">{client?.name}</p>
                        </div>
                        {appliance.maker && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Maker:</span> {appliance.maker}
                          </p>
                        )}
                        {appliance.type && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Type:</span> {appliance.type}
                          </p>
                        )}
                        {appliance.serial && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">S/N:</span> {appliance.serial}
                          </p>
                        )}
                        {appliance.iga && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">IGA:</span> {appliance.iga}
                          </p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => console.log('Upload document')}
                data-testid="button-upload-document"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>

            <div className="space-y-3">
              {mockDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-5 hover-elevate active-elevate-2 cursor-pointer overflow-visible"
                  onClick={() => console.log('Download document:', doc.id)}
                  data-testid={`card-document-${doc.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {format(doc.uploadedDate, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{doc.type}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              {mockHistory.map((report) => (
                <Card
                  key={report.id}
                  className="p-5 border-l-4 border-l-primary"
                  data-testid={`card-report-${report.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{report.clientName}</h3>
                      <p className="text-sm text-muted-foreground">{report.applianceName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(report.date, "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">by {report.technicianName}</p>
                    </div>
                  </div>
                  <p className="text-sm">{report.description}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddApplianceDialog
        open={isAddApplianceOpen}
        onOpenChange={setIsAddApplianceOpen}
        clientId={selectedClientId === "all" ? "" : selectedClientId}
        onSuccess={() => {
          setSelectedClientId("");
        }}
      />
    </div>
  );
}
