import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import AddApplianceDialog from "@/components/AddApplianceDialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, FileText, History as HistoryIcon, Upload, Wrench, Plus, MapPin, Search, Repeat } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import type { Appliance, Client, Task } from "@shared/schema";
import { format } from "date-fns";

export default function StoragePage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  
  // Get tab from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') || 'parts';
  
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isAddApplianceOpen, setIsAddApplianceOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  
  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newUrl = `/storage?tab=${newTab}`;
    window.history.pushState({}, '', newUrl);
  };

  const { data: appliances = [] } = useQuery<Appliance[]>({
    queryKey: ["/api/appliances"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const completedTasks = tasks
    .filter(task => task.status === "completed")
    .map(task => {
      const client = clients.find(c => c.id === task.clientId);
      const appliance = task.applianceId ? appliances.find(a => a.id === task.applianceId) : null;
      
      const applianceName = appliance 
        ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') 
        : t.appliances.noApplianceAssigned;
      
      return {
        ...task,
        clientName: client?.name || t.clients.unknownClient,
        applianceName,
      };
    });

  const filteredCompletedTasks = completedTasks
    .filter(task => {
      if (!historySearchQuery) return true;
      return task.clientName.toLowerCase().includes(historySearchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort by due date, newest first (descending)
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <h2 className="text-3xl font-bold mb-6">{t.storage.title}</h2>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="parts" data-testid="tab-parts" className="gap-2">
              <Package className="h-4 w-4" />
              {t.storage.spareParts}
            </TabsTrigger>
            <TabsTrigger value="appliances" data-testid="tab-appliances" className="gap-2">
              <Wrench className="h-4 w-4" />
              {t.appliances.title}
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents" className="gap-2">
              <FileText className="h-4 w-4" />
              {t.storage.documents}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history" className="gap-2">
              <HistoryIcon className="h-4 w-4" />
              {t.storage.history}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              {t.storage.noSpareParts}
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
                  <SelectValue placeholder={t.storage.filterByClient} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.storage.allClients}</SelectItem>
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
                {t.appliances.addAppliance}
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
                      ? t.storage.noAppliancesSelectClient
                      : selectedClientId && selectedClientId !== "all"
                        ? t.storage.noAppliancesForClient
                        : t.appliances.noAppliances}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAppliances.map((appliance) => {
                    const client = clients.find(c => c.id === appliance.clientId);
                    const applianceLabel = [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || t.appliances.title;
                    const locationParts = [appliance.city, appliance.building, appliance.room].filter(Boolean);
                    const locationLabel = locationParts.length > 0 ? locationParts.join(' • ') : null;
                    
                    return (
                      <Card 
                        key={appliance.id} 
                        className="p-5 hover-elevate active-elevate-2 cursor-pointer overflow-visible" 
                        data-testid={`card-appliance-${appliance.id}`}
                        onClick={() => setLocation(`/appliances/${appliance.id}?from=storage&tab=appliances`)}
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
                            <span className="font-medium">{t.appliances.serial}:</span> {appliance.serial}
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
                {t.storage.uploadDocument}
              </Button>
            </div>

            <div className="text-center py-12 text-muted-foreground">
              {t.storage.noDocuments}
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
                          {t.storage.uploaded} {format(doc.uploadedDate, "MMM d, yyyy")}
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
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t.storage.searchByClient}
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-history"
              />
            </div>

            {isLoadingTasks ? (
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
            ) : filteredCompletedTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {historySearchQuery 
                  ? t.storage.noCompletedTasksSearch
                  : t.storage.noCompletedTasks}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCompletedTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-5 border-l-4 border-l-primary hover-elevate cursor-pointer"
                    data-testid={`card-task-${task.id}`}
                    onClick={() => setLocation(`/tasks/${task.id}?from=storage&tab=history`)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-medium text-lg" data-testid={`text-client-${task.id}`}>
                          {task.clientName}
                        </h3>
                        <p className="text-sm text-muted-foreground" data-testid={`text-appliance-${task.id}`}>
                          {task.applianceName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">{t.tasks.statuses.completed}</Badge>
                        {task.dueDate && (
                          <p className="text-sm font-medium">
                            {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm" data-testid={`text-description-${task.id}`}>
                      {task.description}
                    </p>
                    {task.taskType === "recurring" && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {t.tasks.types.recurring}
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
