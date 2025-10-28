import { useState } from "react";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import FileUpload from "@/components/FileUpload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SparePartUsed {
  sparePartId: string;
  quantity: number;
}

export default function CreateReportPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/tasks/:id/report");
  const [description, setDescription] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [partsUsed, setPartsUsed] = useState<SparePartUsed[]>([]);
  const { toast } = useToast();

  const addSparePartRow = () => {
    setPartsUsed([...partsUsed, { sparePartId: "", quantity: 1 }]);
  };

  const removeSparePartRow = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  const updateSparePart = (index: number, field: keyof SparePartUsed, value: string | number) => {
    const updated = [...partsUsed];
    updated[index] = { ...updated[index], [field]: value };
    setPartsUsed(updated);
  };

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const report = await apiRequest("POST", "/api/reports", reportData);
      await apiRequest("PATCH", `/api/tasks/${params?.id}`, { status: "completed" });
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Success",
        description: "Report submitted and task marked as completed",
      });
      setLocation('/tasks');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
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
      sparePartsUsed: partsUsed.length > 0 ? JSON.stringify(partsUsed) : null,
      photos: null,
    };
    
    createReportMutation.mutate(reportData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <BackButton to={`/tasks/${params?.id}`} label="Back to Task" />
        </div>

        <h2 className="text-3xl font-bold mb-6">Create Service Report</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">
                  Work Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the work performed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="min-h-32"
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-duration">
                  Work Duration (minutes) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  placeholder="e.g., 120"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(e.target.value)}
                  required
                  data-testid="input-work-duration"
                />
              </div>

              <div className="space-y-2">
                <Label>Photos</Label>
                <FileUpload
                  onChange={(files) => console.log('Photos uploaded:', files)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base">Spare Parts Used</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSparePartRow}
                data-testid="button-add-spare-part"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </Button>
            </div>

            <div className="space-y-3">
              {partsUsed.map((part, index) => (
                <div key={index} className="flex gap-3" data-testid={`row-spare-part-${index}`}>
                  <Select
                    value={part.sparePartId}
                    onValueChange={(value) => updateSparePart(index, 'sparePartId', value)}
                  >
                    <SelectTrigger className="flex-1" data-testid={`select-spare-part-${index}`}>
                      <SelectValue placeholder="Select spare part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temp">No spare parts available</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={part.quantity}
                    onChange={(e) => updateSparePart(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20"
                    data-testid={`input-quantity-${index}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSparePartRow(index)}
                    data-testid={`button-remove-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {partsUsed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No spare parts added yet
                </p>
              )}
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(`/tasks/${params?.id}`)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createReportMutation.isPending}
              className="flex-1"
              data-testid="button-submit-report"
            >
              {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
