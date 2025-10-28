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
import { insertApplianceSchema, type InsertAppliance } from "@shared/schema";
import { z } from "zod";

interface AddApplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onSuccess?: (applianceId: string) => void;
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

export default function AddApplianceDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddApplianceDialogProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string[]>([]);

  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: {
      clientId: clientId || "",
      maker: "",
      type: "",
      model: "",
      serial: "",
      city: "",
      building: "",
      room: "",
      installDate: "",
    },
  });

  useEffect(() => {
    if (clientId) {
      form.setValue("clientId", clientId);
    }
  }, [clientId, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
      setPhotoUrl([]);
    }
  }, [open, form]);

  const createApplianceMutation = useMutation({
    mutationFn: async (applianceData: InsertAppliance) => {
      const response = await apiRequest("POST", "/api/appliances", applianceData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appliances"] });
      toast({
        description: t.appliances.createSuccess,
      });
      form.reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.appliances.createError,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: ApplianceFormValues) => {
    if (!clientId) {
      toast({
        description: t.appliances.selectClientFirst,
        variant: "destructive",
      });
      return;
    }

    const applianceData: InsertAppliance = {
      clientId: values.clientId,
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

    createApplianceMutation.mutate(applianceData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t.appliances.addAppliance}</DialogTitle>
          <DialogDescription>
            {t.appliances.addApplianceDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="maker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.appliances.maker}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t.appliances.makerPlaceholder}
                      data-testid="input-appliance-maker"
                      {...field}
                    />
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
                    <Input
                      placeholder={t.appliances.typePlaceholder}
                      data-testid="input-appliance-type"
                      {...field}
                    />
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
                    <Input
                      placeholder={t.appliances.modelPlaceholder}
                      data-testid="input-appliance-model"
                      {...field}
                    />
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
                    <Input
                      placeholder={t.appliances.serialPlaceholder}
                      data-testid="input-appliance-serial"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 p-4 bg-muted rounded-md">
              <h4 className="font-medium text-sm">{t.appliances.locationDetails}</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.appliances.city}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.appliances.cityPlaceholder}
                          data-testid="input-appliance-city"
                          {...field}
                        />
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
                        <Input
                          placeholder={t.appliances.buildingPlaceholder}
                          data-testid="input-appliance-building"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>{t.appliances.room}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.appliances.roomPlaceholder}
                          data-testid="input-appliance-room"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="installDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.appliances.installDate}</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-appliance-install-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>{t.appliances.picture}</Label>
              <ImageUpload
                bucket="appliance-photos"
                maxImages={1}
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={createApplianceMutation.isPending}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                className="flex-1"
                data-testid="button-cancel-appliance"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={!clientId || createApplianceMutation.isPending}
                className="flex-1"
                data-testid="button-create-appliance"
              >
                {createApplianceMutation.isPending ? t.appliances.creating : t.appliances.addAppliance}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
