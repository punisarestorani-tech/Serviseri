import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import ImageUpload from "@/components/ImageUpload";
import VoiceRecordButton from "@/components/VoiceRecordButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import type { Task, Client, Appliance } from "@shared/schema";

export default function CreateReportPage() {
  const t = useTranslation();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/tasks/:id/report");
  const [description, setDescription] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [sparePartsUsed, setSparePartsUsed] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch task, client, and appliance data for context
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: appliances = [] } = useQuery<Appliance[]>({
    queryKey: ["/api/appliances"],
  });

  const task = tasks.find(t => t.id === params?.id);
  const client = task ? clients.find(c => c.id === task.clientId) : null;
  const appliance = task?.applianceId ? appliances.find(a => a.id === task.applianceId) : null;

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      return await apiRequest("POST", "/api/reports", reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        description: t.reports.submitSuccess,
      });
      setLocation('/tasks');
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.reports.submitError,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const reportData = {
      taskId: params?.id,
      description,
      workDuration: parseInt(workDuration),
      sparePartsUsed: sparePartsUsed.trim() || null,
      photos: photoUrls.length > 0 ? photoUrls : null,
    };
    
    createReportMutation.mutate(reportData);
  };

  return (
    <AppLayout title={t.reports.createReport}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">{t.reports.createReport}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <VoiceRecordButton
                  onReportGenerated={(reportData) => {
                    setDescription(reportData.description);
                    setWorkDuration(reportData.workDuration.toString());
                    setSparePartsUsed(reportData.sparePartsUsed || "");
                  }}
                  disabled={createReportMutation.isPending}
                  applianceContext={appliance && appliance.maker && appliance.type ? {
                    maker: appliance.maker,
                    type: appliance.type,
                    model: appliance.model || undefined,
                    serialNumber: appliance.serial || undefined,
                  } : undefined}
                  clientContext={client ? {
                    name: client.name,
                  } : undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t.reports.workDescription} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t.reports.workDescriptionPlaceholder}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="min-h-32"
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-duration">
                  {t.reports.workDuration} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  placeholder={t.reports.workDurationPlaceholder}
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  required
                  data-testid="input-work-duration"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.reports.repairPhotos}</Label>
                <ImageUpload
                  bucket="report-photos"
                  maxImages={10}
                  value={photoUrls}
                  onChange={setPhotoUrls}
                  disabled={createReportMutation.isPending}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <Label htmlFor="spare-parts-used">{t.reports.sparePartsUsed}</Label>
              <Textarea
                id="spare-parts-used"
                placeholder={t.reports.sparePartsPlaceholder}
                value={sparePartsUsed}
                onChange={(e) => setSparePartsUsed(e.target.value)}
                className="min-h-24"
                data-testid="textarea-spare-parts"
              />
              <p className="text-xs text-muted-foreground">
                {t.reports.sparePartsHint}
              </p>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/tasks/${params?.id}`)}
              data-testid="button-cancel"
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={createReportMutation.isPending}
              className="flex-1"
              data-testid="button-submit-report"
            >
              {createReportMutation.isPending ? t.reports.submitting : t.reports.submitReport}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
