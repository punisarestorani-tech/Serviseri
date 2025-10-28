import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import AddApplianceDialog from "@/components/AddApplianceDialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, FileText, History as HistoryIcon, Upload, Wrench, Plus, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Appliance, Client, Task, Report } from "@shared/schema";
import { format } from "date-fns";

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

  const { data: reportsWithDetails = [], isLoading: isLoadingReports } = useQuery<Array<Report & { clientName: string; applianceName: string; taskDescription: string }>>({
    queryKey: ["/api/reports/with-details"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
              <HistoryIcon className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              No spare parts in inventory. Add spare parts to track inventory.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 hidden">
              {[].map((part: any) => (
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
                    const locationParts = [appliance.city, appliance.building, appliance.room].filter(Boolean);
                    const locationLabel = locationParts.length > 0 ? locationParts.join(' • ') : null;
                    
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
                          {locationLabel && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1" data-testid={`location-${appliance.id}`}>
                              <MapPin className="h-3 w-3" />
                              {locationLabel}
                            </p>
                          )}
                        </div>
                        {appliance.serial && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">S/N:</span> {appliance.serial}
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

            <div className="text-center py-12 text-muted-foreground">
              No documents available yet. Upload documents to get started.
            </div>
            <div className="space-y-3 hidden">
              {[].map((doc: any) => (
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
            {isLoadingReports ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-5 border-l-4 border-l-primary">
                    <div className="animate-pulse">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : reportsWithDetails.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No service history available yet. Complete service reports to build history.
              </div>
            ) : (
              <div className="space-y-4">
                {reportsWithDetails.map((report) => (
                  <Card
                    key={report.id}
                    className="p-5 border-l-4 border-l-primary"
                    data-testid={`card-report-${report.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-medium text-lg" data-testid={`text-client-${report.id}`}>
                          {report.clientName}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-appliance-${report.id}`}>
                          {report.applianceName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Task: {report.taskDescription}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {report.createdAt ? format(new Date(report.createdAt), "MMM d, yyyy") : 'N/A'}
                        </p>
                        {report.workDuration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {report.workDuration} min
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm" data-testid={`text-description-${report.id}`}>
                      {report.description}
                    </p>
                    {report.sparePartsUsed && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Spare parts used: {report.sparePartsUsed}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
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
