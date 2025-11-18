import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import EditApplianceDialog from "@/components/EditApplianceDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, Hash, Edit, Printer, Package, FileText } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import type { Appliance, Client, Task, Report } from "@shared/schema";
import { format } from "date-fns";
import { stampajIzvjestaj } from "@/utils/stampajIzvjestaj";

export default function ApplianceDetailsPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/appliances/:id");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: appliance, isLoading: isLoadingAppliance } = useQuery<Appliance>({
    queryKey: ["/api/appliances", params?.id],
    enabled: !!params?.id,
  });

  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", appliance?.clientId],
    enabled: !!appliance?.clientId,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: allReports = [] } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Filter tasks for this appliance that are completed
  const applianceTasks = tasks.filter(
    task => task.applianceId === params?.id && task.status === "completed"
  );

  // Get reports with their corresponding task data
  const serviceHistory = applianceTasks
    .map(task => {
      const report = allReports.find(r => r.taskId === task.id);
      return report ? { task, report } : null;
    })
    .filter((item): item is { task: Task; report: Report } => item !== null)
    .sort((a, b) => {
      // Sort by task due date, newest first
      const dateA = a.task.dueDate ? new Date(a.task.dueDate).getTime() : 0;
      const dateB = b.task.dueDate ? new Date(b.task.dueDate).getTime() : 0;
      return dateB - dateA;
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
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 print:hidden">
          <BackButton />
        </div>

        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            data-testid="button-edit-appliance"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            {t.appliances.editAppliance}
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

        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">{applianceLabel}</h2>
          <p className="text-muted-foreground">{client?.name}</p>
        </div>

        {appliance.picture && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
              {t.appliances.picture}
            </h3>
            <img
              src={appliance.picture}
              alt={applianceLabel}
              className="w-full max-w-md rounded-md object-cover"
              data-testid="img-appliance"
            />
          </Card>
        )}

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
        {serviceHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t.appliances.noServiceHistory}
          </div>
        ) : (
          <div className="space-y-4">
            {serviceHistory.map(({ task, report }) => (
              <Card
                key={task.id}
                className="p-5 border-l-4 border-l-primary hover-elevate cursor-pointer"
                onClick={() => setLocation(`/tasks/${task.id}`)}
                data-testid={`card-service-${task.id}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium" data-testid={`text-task-desc-${task.id}`}>
                        {task.description}
                      </h4>
                    </div>
                    {report.description && (
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-work-desc-${task.id}`}>
                        {report.description}
                      </p>
                    )}
                    {report.sparePartsUsed && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium">{t.reports.sparePartsUsed}:</span> {report.sparePartsUsed}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">{t.tasks.statuses.completed}</Badge>
                    {task.dueDate && (
                      <p className="text-sm font-medium" data-testid={`text-date-${task.id}`}>
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {appliance && (
          <EditApplianceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            appliance={appliance}
          />
        )}
      </main>
    </div>
  );
}
