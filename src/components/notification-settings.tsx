"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getStatuses, updateStatus } from "@/lib/data";
import { Status } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";

const notificationSettingsSchema = z.object({
  statusId: z.string().min(1, "Selecione um status."),
  emailBody: z.string().optional(),
  whatsappBody: z.string().optional(),
});

type NotificationSettingsFormValues = z.infer<
  typeof notificationSettingsSchema
>;

const templateVariables = [
  { name: "Nome do Cliente", value: "{{clientName}}" },
  { name: "Número da OS", value: "{{osNumber}}" },
  { name: "Equipamento", value: "{{equipment}}" },
  { name: "Status", value: "{{statusName}}" },
  { name: "Data de Entrada", value: "{{entryDate}}" },
  { name: "Data de Saída", value: "{{pickupDate}}" },
];

export function NotificationSettings() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const { toast } = useToast();

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      statusId: "",
      emailBody: "",
      whatsappBody: "",
    },
  });

  const { control, handleSubmit, reset, watch } = form;
  const statusId = watch("statusId");

  useEffect(() => {
    async function fetchStatuses() {
      const allStatuses = await getStatuses();
      setStatuses(allStatuses);
    }
    fetchStatuses();
  }, []);

  useEffect(() => {
    const status = statuses.find((s) => s.id === statusId);
    if (status) {
      setSelectedStatus(status);
      reset({
        statusId: status.id,
        emailBody: status.emailBody || "",
        whatsappBody: status.whatsappBody || "",
      });
    }
  }, [statusId, statuses, reset]);

  const onSubmit = async (values: NotificationSettingsFormValues) => {
    if (!selectedStatus) return;
    try {
      await updateStatus(selectedStatus.id, {
        ...selectedStatus,
        emailBody: values.emailBody,
        whatsappBody: values.whatsappBody,
      });
      toast({
        title: "Sucesso",
        description: "Templates de notificação atualizados.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os templates.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `"${text}" copiado para a área de transferência.`});
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Templates de Notificação</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={control}
                            name="statusId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Selecione um Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione um status para editar" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {statuses.map((status) => (
                                    <SelectItem key={status.id} value={status.id}>
                                        {status.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        {selectedStatus && (
                            <>
                            <FormField
                                control={control}
                                name="emailBody"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Corpo do E-mail</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        {...field}
                                        rows={5}
                                        placeholder="Insira o template para o corpo do e-mail."
                                        disabled={!selectedStatus.triggersEmail}
                                    />
                                    </FormControl>
                                    {!selectedStatus.triggersEmail && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Este status não está configurado para enviar e-mails.
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="whatsappBody"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mensagem do WhatsApp</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        {...field}
                                        rows={5}
                                        placeholder="Insira o template para a mensagem do WhatsApp."
                                        disabled={!selectedStatus.triggersWhatsapp}
                                    />
                                    </FormControl>
                                     {!selectedStatus.triggersWhatsapp && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Este status não está configurado para enviar mensagens no WhatsApp.
                                        </p>
                                    )}
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </>
                        )}
                        <Button type="submit" disabled={!selectedStatus}>Salvar Alterações</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Variáveis Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {templateVariables.map(variable => (
                        <div key={variable.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
                           <div>
                            <p className="font-semibold">{variable.name}</p>
                            <p className="text-sm text-muted-foreground">{variable.value}</p>
                           </div>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(variable.value)}>
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
