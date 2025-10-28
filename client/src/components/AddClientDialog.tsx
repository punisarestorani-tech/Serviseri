import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
}

export default function AddClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddClientDialogProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  useEffect(() => {
    if (!open) {
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientAddress("");
    }
  }, [open]);

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        description: t.clients.createSuccess,
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.clients.createError,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!clientName || !clientEmail || !clientPhone) {
      toast({
        description: t.clients.fillRequired,
        variant: "destructive",
      });
      return;
    }

    createClientMutation.mutate({
      name: clientName,
      contact: clientPhone,
      address: clientAddress || null,
      pib: null,
      pdv: null,
      account: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.clients.addClient}</DialogTitle>
          <DialogDescription>
            {t.clients.addClientDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">
              {t.clients.name} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder={t.clients.namePlaceholder}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              data-testid="input-client-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">
              {t.clients.email} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-email"
              type="email"
              placeholder={t.clients.emailPlaceholder}
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              data-testid="input-client-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">
              {t.clients.phone} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-phone"
              placeholder={t.clients.phonePlaceholder}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              data-testid="input-client-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">{t.clients.address}</Label>
            <Input
              id="client-address"
              placeholder={t.clients.addressPlaceholder}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              data-testid="input-client-address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-client"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!clientName || !clientEmail || !clientPhone || createClientMutation.isPending}
              className="flex-1"
              data-testid="button-create-client"
            >
              {createClientMutation.isPending ? t.clients.creating : t.clients.addClient}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
