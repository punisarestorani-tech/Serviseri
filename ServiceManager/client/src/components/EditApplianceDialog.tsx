import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ImageUpload from "@/components/ImageUpload";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplianceSchema, type Appliance } from "@shared/schema";
import { z } from "zod";

interface EditApplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appliance: Appliance;
}

const applianceFormSchema = insertApplianceSchema.extend({
  maker: z.string().optional(),
  type: z.string().optional(),
  model: z.string().optional(),
  serial: z.string().optional(),
  city: z.string().optional(),
  building: z.string().optional(),
  room: z.string().optional(),
  installDate: z.string().optional(),
});

type ApplianceFormValues = z.infer<typeof applianceFormSchema>;

export default function EditApplianceDialog({
  open,
  onOpenChange,
  appliance,
}: EditApplianceDialogProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string[]>([]);

  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: {
      clientId: appliance.clientId,
      maker: appliance.maker || "",
      type: appliance.type || "",
      model: appliance.model || "",
      serial: appliance.serial || "",
      city: appliance.city || "",
      building: appliance.building || "",
      room: appliance.room || "",
      installDate: appliance.installDate || "",
    },
  });

  useEffect(() => {
    if (appliance) {
      form.reset({
        clientId: appliance.clientId,
        maker: appliance.maker || "",
        type: appliance.type || "",
        model: appliance.model || "",
        serial: appliance.serial || "",
        city: appliance.city || "",
        building: appliance.building || "",
        room: appliance.room || "",
        installDate: appliance.installDate || "",
      });
      
      if (appliance.picture) {
        setPhotoUrl([appliance.picture]);
      } else {
        setPhotoUrl([]);
      }
    }
  }, [appliance, form]);

  const updateApplianceMutation = useMutation({
    mutationFn: async (applianceData: any) => {
      return await apiRequest("PATCH", `/api/appliances/${appliance.id}`, applianceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appliances"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appliances", appliance.id] });
      toast({
        description: t.appliances.updateSuccess,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.appliances.updateError,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: ApplianceFormValues) => {
    const applianceData = {
      maker: values.maker || null,
      type: values.type || null,
      model: values.model || null,
      serial: values.serial || null,
      picture: photoUrl.length > 0 ? photoUrl[0] : null,
      city: values.city || null,
      building: values.building || null,
      room: values.room || null,
      installDate: values.installDate || null,
    };

    updateApplianceMutation.mutate(applianceData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.appliances.editAppliance}</DialogTitle>
          <DialogDescription>{t.appliances.editApplianceDescription}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>{t.appliances.picture}</Label>
              <ImageUpload
                bucket="appliance-photos"
                maxImages={1}
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={updateApplianceMutation.isPending}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="maker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.appliances.maker}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.appliances.makerPlaceholder} data-testid="input-maker" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.appliances.type}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.appliances.typePlaceholder} data-testid="input-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.appliances.model}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.appliances.modelPlaceholder} data-testid="input-model" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.appliances.serial}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.appliances.serialPlaceholder} data-testid="input-serial" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">{t.appliances.location}</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.appliances.city}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.appliances.cityPlaceholder} data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.appliances.building}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.appliances.buildingPlaceholder} data-testid="input-building" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.appliances.room}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.appliances.roomPlaceholder} data-testid="input-room" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={updateApplianceMutation.isPending}
                className="flex-1"
                data-testid="button-save"
              >
                {updateApplianceMutation.isPending ? t.appliances.updating : t.appliances.saveChanges}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
