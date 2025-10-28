import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import StatusBadge from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Wrench, Calendar, Package, Hash, Repeat, Clock, Printer } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getRecurrencePatternLabel, type RecurrencePattern } from "@/lib/recurringUtils";
import type { Task, Client, Appliance } from "@shared/schema";

export default function TaskDetailsPage() {
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

  const task = tasks.find(t => t.id === taskId);
  const client = task ? clients.find(c => c.id === task.clientId) : null;
  const appliance = task?.applianceId ? appliances.find(a => a.id === task.applianceId) : null;

  const isLoading = tasksLoading || clientsLoading || appliancesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <BackButton to="/tasks" label="Back to Tasks" />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            Loading task details...
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
            <BackButton to="/tasks" label="Back to Tasks" />
          </div>
          <div className="text-center py-12 text-muted-foreground">
            Task not found
          </div>
        </main>
      </div>
    );
  }

  const applianceLabel = appliance 
    ? [appliance.maker, appliance.type, appliance.model].filter(Boolean).join(' - ') || 'Appliance'
    : 'No appliance assigned';

  return (
    <div className="min-h-screen bg-background">
      <Header username="Technician" onLogout={() => setLocation('/')} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton to="/tasks" label="Back to Tasks" />
        </div>

        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-3xl font-bold" data-testid="text-task-description">{task.description}</h2>
              {task.taskType === "recurring" && (
                <Badge variant="secondary" className="gap-1">
                  <Repeat className="h-3 w-3" />
                  Recurring
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Created {task.createdAt ? format(new Date(task.createdAt), "MMMM d, yyyy") : 'Unknown date'}
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
                Print Report
              </Button>
            )}
          </div>
        </div>

        {task.taskType === "recurring" && task.recurrencePattern !== "none" && (
          <Card className="p-4 mb-6 bg-muted">
            <div className="flex items-start gap-3">
              <Repeat className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Recurring Schedule</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-recurrence-info">
                  {getRecurrencePatternLabel((task.recurrencePattern || "none") as RecurrencePattern, task.recurrenceInterval || 1)}
                </p>
                {task.nextOccurrenceDate && typeof task.nextOccurrenceDate === 'string' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Next occurrence:</span>{" "}
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
              Client Details
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
              <p className="text-sm text-muted-foreground">Client information not available</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
              Appliance Details
            </h3>
            {appliance ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-lg" data-testid="text-appliance-name">{applianceLabel}</p>
                </div>
                {appliance.maker && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Maker:</span>
                    <span data-testid="text-appliance-maker">{appliance.maker}</span>
                  </div>
                )}
                {appliance.type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Type:</span>
                    <span data-testid="text-appliance-type">{appliance.type}</span>
                  </div>
                )}
                {appliance.serial && (
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Serial:</span>
                    <span data-testid="text-appliance-serial">{appliance.serial}</span>
                  </div>
                )}
                {(appliance.city || appliance.building || appliance.room) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Location:</span>
                      <span data-testid="text-appliance-location">
                        {[appliance.city, appliance.building, appliance.room].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No appliance assigned to this task</p>
            )}
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h3 className="text-sm uppercase tracking-wide font-semibold mb-4 text-muted-foreground">
            Task Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {task.priority && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant={task.priority === "high" ? "destructive" : "secondary"} data-testid="badge-priority">
                  {task.priority}
                </Badge>
              </div>
            )}
            {task.dueDate && typeof task.dueDate === 'string' && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due Date:</span>
                <span data-testid="text-due-date">{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
              </div>
            )}
          </div>
        </Card>

        {task.status !== "completed" && (
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setLocation(`/tasks/${task.id}/report`)}
            data-testid="button-make-report"
          >
            Make Report
          </Button>
        )}
      </main>
    </div>
  );
}
