import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import type { Report } from "@shared/schema";

interface EditReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report;
}

export default function EditReportDialog({
  open,
  onOpenChange,
  report,
}: EditReportDialogProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [description, setDescription] = useState(report.description || "");
  const [workDuration, setWorkDuration] = useState(report.workDuration?.toString() || "");
  const [sparePartsUsed, setSparePartsUsed] = useState(report.sparePartsUsed || "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    Array.isArray(report.photos) ? report.photos : []
  );

  useEffect(() => {
    if (open && report) {
      setDescription(report.description || "");
      setWorkDuration(report.workDuration?.toString() || "");
      setSparePartsUsed(report.sparePartsUsed || "");
      setPhotoUrls(Array.isArray(report.photos) ? report.photos : []);
    }
  }, [open, report]);

  const updateReportMutation = useMutation({
    mutationFn: async (reportData: Partial<Report>) => {
      return await apiRequest("PATCH", `/api/reports/${report.id}`, reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        description: t.reports.updateSuccess || "Izveštaj uspešno ažuriran",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        description: error.message || t.reports.updateError || "Greška pri ažuriranju izveštaja",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({
        description: t.common.required,
        variant: "destructive",
      });
      return;
    }

    const reportData = {
      description: description.trim(),
      workDuration: parseInt(workDuration) || null,
      sparePartsUsed: sparePartsUsed.trim() || null,
      photos: photoUrls.length > 0 ? photoUrls : null,
    };

    updateReportMutation.mutate(reportData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.reports.editReport || "Izmeni Izveštaj"}</DialogTitle>
          <DialogDescription>
            {t.reports.editReportDescription || "Izmenite detalje servisnog izveštaja"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-report-description">
              {t.reports.workDescription} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-report-description"
              placeholder={t.reports.workDescriptionPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32"
              data-testid="textarea-edit-report-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-work-duration">
              {t.reports.workDuration}
            </Label>
            <Input
              id="edit-work-duration"
              type="number"
              min="1"
              placeholder={t.reports.workDurationPlaceholder}
              value={workDuration}
              onChange={(e) => setWorkDuration(e.target.value)}
              data-testid="input-edit-work-duration"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-spare-parts">{t.reports.sparePartsUsed}</Label>
            <Textarea
              id="edit-spare-parts"
              placeholder={t.reports.sparePartsPlaceholder}
              value={sparePartsUsed}
              onChange={(e) => setSparePartsUsed(e.target.value)}
              className="min-h-24"
              data-testid="textarea-edit-spare-parts"
            />
          </div>

          <div className="space-y-2">
            <Label>{t.reports.repairPhotos}</Label>
            <ImageUpload
              bucket="report-photos"
              maxImages={10}
              value={photoUrls}
              onChange={setPhotoUrls}
              disabled={updateReportMutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateReportMutation.isPending}
            data-testid="button-cancel-edit-report"
          >
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateReportMutation.isPending}
            data-testid="button-save-edit-report"
          >
            {updateReportMutation.isPending ? t.common.loading : t.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
