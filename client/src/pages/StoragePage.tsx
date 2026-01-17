import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import AddApplianceDialog from "@/components/AddApplianceDialog";
import UploadDocumentDialog from "@/components/UploadDocumentDialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, FileText, History as HistoryIcon, Upload, Wrench, Plus, MapPin, Search, Repeat, Trash2, Download, Image, File } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Appliance, Client, Task, Document } from "@shared/schema";
import { format } from "date-fns";

export default function StoragePage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get tab from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') || 'parts';
  
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [isAddApplianceOpen, setIsAddApplianceOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [historyClientFilter, setHistoryClientFilter] = useState<string>("all");
  
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

  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        description: t.documents.deleteSuccess || "Dokument uspešno obrisan",
      });
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.documents.deleteError || "Greška pri brisanju dokumenta",
        variant: "destructive",
      });
    },
  });

  const getDocumentIcon = (type: string | null) => {
    if (!type) return <File className="h-5 w-5 text-gray-500" />;
    if (type === "image" || type.startsWith("image")) return <Image className="h-5 w-5 text-blue-500" />;
    if (type === "pdf") return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

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
      if (historyClientFilter === "all") return true;
      return task.clientId === historyClientFilter;
    })
    .sort((a, b) => {
      // Sort by due date, newest first (descending)
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });

  return (
    <AppLayout title={t.storage.title}>
      <div className="max-w-7xl mx-auto">
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
                onClick={() => setIsUploadDocumentOpen(true)}
                data-testid="button-upload-document"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {t.storage.uploadDocument}
              </Button>
            </div>

            {isLoadingDocuments ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t.storage.noDocuments}
              </div>
            ) : (
              <div className="space-y-3">
                {documents
                  .sort((a, b) => {
                    if (!a.createdAt && !b.createdAt) return 0;
                    if (!a.createdAt) return 1;
                    if (!b.createdAt) return -1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((doc) => (
                  <Card
                    key={doc.id}
                    className="p-4 hover:shadow-md transition-shadow"
                    data-testid={`card-document-${doc.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        {getDocumentIcon(doc.type)}
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {doc.createdAt && format(new Date(doc.createdAt), "MMM d, yyyy")}
                            {doc.type && ` • ${doc.type.toUpperCase()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                          title={t.documents.download || "Preuzmi"}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          title={t.documents.deleteDocument || "Obriši"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="mb-4">
              <Select
                value={historyClientFilter}
                onValueChange={setHistoryClientFilter}
              >
                <SelectTrigger className="w-full" data-testid="select-filter-history">
                  <SelectValue placeholder={t.storage.selectClient} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-all-clients">
                    {t.storage.allClients}
                  </SelectItem>
                  {clients
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((client) => (
                      <SelectItem 
                        key={client.id} 
                        value={client.id}
                        data-testid={`option-client-${client.id}`}
                      >
                        {client.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                {historyClientFilter !== "all"
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

        <AddApplianceDialog
          open={isAddApplianceOpen}
          onOpenChange={setIsAddApplianceOpen}
          clientId={selectedClientId === "all" ? "" : selectedClientId}
          onSuccess={() => {
            setSelectedClientId("");
          }}
        />

        <UploadDocumentDialog
          open={isUploadDocumentOpen}
          onOpenChange={setIsUploadDocumentOpen}
        />
      </div>
    </AppLayout>
  );
}
