import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import BackButton from "@/components/BackButton";
import StatusBadge from "@/components/StatusBadge";
import EditTaskDialog from "@/components/EditTaskDialog";
import EditReportDialog from "@/components/EditReportDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, MapPin, Wrench, Calendar, Package, Hash, Repeat, Clock, FileDown, FileText, Image, Edit, Trash2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "@/i18n";
import { getRecurrencePatternLabel, type RecurrencePattern } from "@/lib/recurringUtils";
import type { Task, Client, Appliance, Report } from "@shared/schema";
import { queryClient, apiRequest, HttpError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TaskDetailsPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/tasks/:id");
  const taskId = params?.id;
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteParentDialogOpen, setIsDeleteParentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditReportDialogOpen, setIsEditReportDialogOpen] = useState(false);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!report) return;
    
    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/reports/${report.id}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `izvjestaj-${report.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        description: t.reports.pdfDownloaded || 'PDF uspješno preuzet',
      });
    } catch (error) {
      toast({
        description: t.reports.pdfError || 'Greška pri generisanju PDF-a',
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: appliances = [], isLoading: appliancesLoading } = useQuery<Appliance[]>({
    queryKey: ["/api/appliances"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: [`/api/tasks/${taskId}/reports`],
    enabled: !!taskId,
  });

  const task = tasks.find(t => t.id === taskId);
  const client = task ? clients.find(c => c.id === task.clientId) : null;
  const appliance = task?.applianceId ? appliances.find(a => a.id === task.applianceId) : null;
  const report = reports.length > 0 ? reports[0] : null;

  const isLoading = tasksLoading || clientsLoading || appliancesLoading || reportsLoading;

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        description: t.tasks.deleteSuccess,
      });
      setLocation("/tasks");
    },
    onError: (error: any) => {
      // Show specific error for completed tasks (HTTP 409)
      let errorMessage: string;
      
      if (error instanceof HttpError && error.status === 409) {
        errorMessage = t.tasks.deleteCompletedError;
      } else if (error?.message && error.message.trim() !== '') {
        errorMessage = error.message;
      } else {
        // Fallback to generic error message for network failures or empty errors
        errorMessage = t.common.error;
      }
      
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteRecurringTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}/recurring`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        description: t.tasks.deleteSuccess,
      });
      setLocation("/tasks");
    },
    onError: (error: any) => {
      toast({
        description: error?.message || t.common.error,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (taskId) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleDeleteParent = () => {
    if (task?.parentTaskId) {
      deleteRecurringTaskMutation.mutate(task.parentTaskId);
    }
  };

  // Check if this task has a parent (is a child of a recurring task)
  const hasParentTask = task?.parentTaskId && task?.isAutoGenerated;
  const parentTask = hasParentTask ? tasks.find(t => t.id === task.parentTaskId) : null;

  if (isLoading) {
    return (
      <AppLayout title={t.tasks.title}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <BackButton label={t.common.back} />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {t.common.loading}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout title={t.tasks.title}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {t.tasks.taskNotFound}
          </div>
        </div>
      </AppLayout>
    );
  }

  const applianceLabel = appliance
    ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || t.appliances.title
    : t.appliances.noApplianceAssigned;

  return (
    <AppLayout title={task.description}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold truncate" data-testid="text-task-description">{task.description}</h2>
              <StatusBadge status={task.status as "pending" | "in_progress" | "completed"} />
              {task.taskType === "recurring" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Repeat className="h-3 w-3" />
                  {t.tasks.types.recurring}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t.tasks.created} {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy") : t.common.unknownDate}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              data-testid="button-edit-task"
            >
              <Edit className="h-4 w-4" />
            </Button>
            {task.status === "completed" && report && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                data-testid="button-download-pdf"
              >
                <FileDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="button-delete-task"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {hasParentTask && parentTask && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setIsDeleteParentDialogOpen(true)}
                data-testid="button-delete-parent-task"
                title={t.tasks.deleteRecurringTaskHint}
              >
                <Trash2 className="h-4 w-4" />
                <Repeat className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {task.taskType === "recurring" && task.recurrencePattern !== "none" && (
          <Card className="p-3 mb-4 bg-muted">
            <div className="flex items-center gap-2 text-sm">
              <Repeat className="h-4 w-4 text-primary" />
              <span data-testid="text-recurrence-info">
                {getRecurrencePatternLabel((task.recurrencePattern || "none") as RecurrencePattern, task.recurrenceInterval || 1)}
              </span>
              {task.nextOccurrenceDate && typeof task.nextOccurrenceDate === 'string' && (
                <span className="text-muted-foreground">
                  • {t.tasks.nextOccurrence}: {format(new Date(task.nextOccurrenceDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          {task.priority && (
            <Badge variant={task.priority === "high" || task.priority === "urgent" ? "destructive" : "secondary"} data-testid="badge-priority">
              {t.tasks.priorities[task.priority as keyof typeof t.tasks.priorities]}
            </Badge>
          )}
          {task.dueDate && typeof task.dueDate === 'string' && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span data-testid="text-due-date">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <Card className="p-4">
            <h3 className="text-xs uppercase tracking-wide font-semibold mb-2 text-muted-foreground">
              {t.appliances.applianceDetails}
            </h3>
            {appliance ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {appliance.picture && (
                    <img
                      src={appliance.picture}
                      alt={applianceLabel}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                      data-testid="img-appliance-thumbnail"
                    />
                  )}
                  <div>
                    <p className="font-medium text-sm" data-testid="text-appliance-name">{applianceLabel}</p>
                    {appliance.maker && (
                      <p className="text-xs text-muted-foreground" data-testid="text-appliance-maker">
                        {appliance.maker} {appliance.type && `• ${appliance.type}`}
                      </p>
                    )}
                  </div>
                </div>
                {appliance.serial && (
                  <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span data-testid="text-appliance-serial">{appliance.serial}</span>
                  </div>
                )}
                {(appliance.city || appliance.building || appliance.room) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span data-testid="text-appliance-location">
                      {[appliance.city, appliance.building, appliance.room].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.appliances.noApplianceAssigned}</p>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-xs uppercase tracking-wide font-semibold mb-2 text-muted-foreground">
              {t.clients.clientDetails}
            </h3>
            {client ? (
              <div className="space-y-1">
                <p className="font-medium text-sm" data-testid="text-client-name">{client.name}</p>
                {client.contactPhone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span data-testid="text-client-contact">{client.contactPhone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span data-testid="text-client-address">{client.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.clients.clientInfoNotAvailable}</p>
            )}
          </Card>
        </div>

        {task.status === "completed" && report && (
          <Card 
            className="p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setIsEditReportDialogOpen(true)}
            data-testid="card-report"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs uppercase tracking-wide font-semibold text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t.reports.reportDetails}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditReportDialogOpen(true);
                }}
                data-testid="button-edit-report"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {report.description && (
                <p className="text-sm whitespace-pre-wrap" data-testid="text-report-description">{report.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {report.workDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span data-testid="text-work-duration">{report.workDuration} min</span>
                  </div>
                )}
                {report.sparePartsUsed && (
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{report.sparePartsUsed}</span>
                  </div>
                )}
              </div>

              {report.photos && Array.isArray(report.photos) && report.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {report.photos.map((photoUrl, index) => (
                    <div
                      key={index}
                      className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(photoUrl, '_blank');
                      }}
                      data-testid={`img-repair-${index}`}
                    >
                      <img
                        src={photoUrl}
                        alt={`Repair photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {task.status !== "completed" && (
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setLocation(`/tasks/${task.id}/report`)}
            data-testid="button-make-report"
          >
            {t.tasks.makeReport}
          </Button>
        )}

        <EditTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={task}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-task">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tasks.deleteTask}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tasks.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t.tasks.deleteTask}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteParentDialogOpen} onOpenChange={setIsDeleteParentDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-parent-task">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.tasks.deleteRecurringTask || "Obriši ponavljajući zadatak"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.tasks.deleteRecurringConfirm || "Da li ste sigurni da želite obrisati ovaj ponavljajući zadatak i sve njegove buduće instance? Ova akcija se ne može poništiti."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-parent">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteParent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-parent"
            >
              {t.tasks.deleteRecurringTask || "Obriši ponavljajući zadatak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {report && (
          <EditReportDialog
            open={isEditReportDialogOpen}
            onOpenChange={setIsEditReportDialogOpen}
            report={report}
          />
        )}
      </div>
    </AppLayout>
  );
}
