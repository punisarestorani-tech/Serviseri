import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Wrench, Calendar, Package, Hash, Repeat, Clock, Printer, FileText, Image } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "@/i18n";
import { getRecurrencePatternLabel, type RecurrencePattern } from "@/lib/recurringUtils";
import type { Task, Client, Appliance, Report } from "@shared/schema";

export default function TaskDetailsPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/tasks/:id");
  const taskId = params?.id;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton to="/tasks" label={`${t.common.back} ${t.tasks.title}`} />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {t.common.loading}
          </div>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton to="/tasks" label={`${t.common.back} ${t.tasks.title}`} />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            {t.tasks.taskNotFound}
          </div>
        </main>
      </div>
    );
  }

  const applianceLabel = appliance 
    ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || t.appliances.title
    : t.appliances.noApplianceAssigned;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton to="/tasks" label={`${t.common.back} ${t.tasks.title}`} />
        </div>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-3xl font-bold" data-testid="text-task-description">{task.description}</h2>
              {task.taskType === "recurring" && (
                <Badge variant="secondary" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  {t.tasks.types.recurring}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t.tasks.created} {task.createdAt ? format(new Date(task.createdAt), "MMMM d, yyyy") : t.common.unknownDate}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusBadge status={task.status as "pending" | "in_progress" | "completed"} />
            {task.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.print()}
                data-testid="button-print-report"
              >
                <Printer className="h-4 w-4" />
                {t.tasks.printReport}
              </Button>
            )}
          </div>
        </div>

        {task.taskType === "recurring" && task.recurrencePattern !== "none" && (
          <Card className="p-4 mb-6 bg-muted">
            <div className="flex items-start gap-3">
              <Repeat className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">{t.tasks.recurringSchedule}</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-recurrence-info">
                  {getRecurrencePatternLabel((task.recurrencePattern || "none") as RecurrencePattern, task.recurrenceInterval || 1)}
                </p>
                {task.nextOccurrenceDate && typeof task.nextOccurrenceDate === 'string' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">{t.tasks.nextOccurrence}:</span>{" "}
                    {format(new Date(task.nextOccurrenceDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="p-6">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
              {t.clients.clientDetails}
            </h3>
            {client ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-lg" data-testid="text-client-name">{client.name}</p>
                </div>
                {client.contact && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span data-testid="text-client-contact">{client.contact}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span data-testid="text-client-address">{client.address}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.clients.clientInfoNotAvailable}</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
              {t.appliances.applianceDetails}
            </h3>
            {appliance ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-lg" data-testid="text-appliance-name">{applianceLabel}</p>
                </div>
                {appliance.maker && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.appliances.maker}:</span>
                    <span data-testid="text-appliance-maker">{appliance.maker}</span>
                  </div>
                )}
                {appliance.type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.appliances.type}:</span>
                    <span data-testid="text-appliance-type">{appliance.type}</span>
                  </div>
                )}
                {appliance.serial && (
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.appliances.serial}:</span>
                    <span data-testid="text-appliance-serial">{appliance.serial}</span>
                  </div>
                )}
                {(appliance.city || appliance.building || appliance.room) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">{t.appliances.location}:</span>
                      <span data-testid="text-appliance-location">
                        {[appliance.city, appliance.building, appliance.room].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.appliances.noApplianceAssigned}</p>
            )}
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
            {t.tasks.taskInfo}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {task.priority && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t.tasks.priority}:</span>
                <Badge variant={task.priority === "high" ? "destructive" : "secondary"} data-testid="badge-priority">
                  {t.tasks.priorities[task.priority as keyof typeof t.tasks.priorities]}
                </Badge>
              </div>
            )}
            {task.dueDate && typeof task.dueDate === 'string' && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t.tasks.dueDate}:</span>
                <span data-testid="text-due-date">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </Card>

        {task.status === "completed" && report && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t.reports.reportDetails}
            </h3>
            <div className="space-y-4">
              {report.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{t.reports.workDescription}</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-report-description">{report.description}</p>
                </div>
              )}
              
              {report.workDuration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.reports.workDuration}:</span>
                  <span data-testid="text-work-duration">{report.workDuration} {t.tasks.intervalUnits.minutes || 'min'}</span>
                </div>
              )}

              {report.sparePartsUsed && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{t.reports.sparePartsUsed}</p>
                  <div className="text-sm bg-muted p-3 rounded-md">
                    {report.sparePartsUsed}
                  </div>
                </div>
              )}

              {report.photos && Array.isArray(report.photos) && report.photos.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    {t.reports.repairPhotos}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {report.photos.map((photoUrl, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-md overflow-hidden bg-muted group cursor-pointer"
                        onClick={() => window.open(photoUrl, '_blank')}
                        data-testid={`img-repair-${index}`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Repair photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
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
      </main>
    </div>
  );
}
