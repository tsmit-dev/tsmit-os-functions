"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ServiceOrder, Client } from '@/lib/types';
import { getClients, updateServiceOrderDetails } from '@/lib/data';
import { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { sanitizePhoneNumberForStorage } from '@/lib/phone-utils';

const formSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório.'),
  collaboratorName: z.string().min(1, 'Nome do contato é obrigatório.'),
  collaboratorEmail: z.string().email('Email inválido.').optional().or(z.literal('')),
  collaboratorPhone: z.string().optional(),
  equipmentType: z.string().min(1, 'Tipo do equipamento é obrigatório.'),
  equipmentBrand: z.string().min(1, 'Marca é obrigatória.'),
  equipmentModel: z.string().min(1, 'Modelo é obrigatório.'),
  equipmentSerialNumber: z.string().min(1, 'Número de série é obrigatório.'),
  reportedProblem: z.string().min(1, 'Problema relatado é obrigatório.'),
});

type EditOsFormValues = z.infer<typeof formSchema>;

interface EditOsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrder: ServiceOrder;
  onSaveSuccess: () => void;
}

export function EditOsDialog({ isOpen, onClose, serviceOrder, onSaveSuccess }: EditOsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditOsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: serviceOrder.clientId,
      collaboratorName: serviceOrder.collaborator.name,
      collaboratorEmail: serviceOrder.collaborator.email || '',
      collaboratorPhone: serviceOrder.collaborator.phone || '',
      equipmentType: serviceOrder.equipment.type,
      equipmentBrand: serviceOrder.equipment.brand,
      equipmentModel: serviceOrder.equipment.model,
      equipmentSerialNumber: serviceOrder.equipment.serialNumber,
      reportedProblem: serviceOrder.reportedProblem,
    },
  });

  useEffect(() => {
    async function fetchClients() {
      const clientData = await getClients();
      setClients(clientData);
    }
    fetchClients();
  }, []);

  const handleSave = async (values: EditOsFormValues) => {
    if (!user) {
      toast({ title: 'Erro', description: 'Você não está autenticado.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedPhone = values.collaboratorPhone 
        ? sanitizePhoneNumberForStorage(values.collaboratorPhone)
        : '';
        
      await updateServiceOrderDetails(serviceOrder.id, {
        clientId: values.clientId,
        collaborator: {
          name: values.collaboratorName,
          email: values.collaboratorEmail,
          phone: sanitizedPhone,
        },
        equipment: {
          type: values.equipmentType,
          brand: values.equipmentBrand,
          model: values.equipmentModel,
          serialNumber: values.equipmentSerialNumber,
        },
        reportedProblem: values.reportedProblem,
      }, user.name);
      
      toast({ title: 'Sucesso', description: 'Ordem de Serviço atualizada com sucesso!' });
      onSaveSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar a Ordem de Serviço.', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Ordem de Serviço: {serviceOrder.orderNumber}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client and Collaborator */}
              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold">Cliente e Contato</h3>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="collaboratorName" render={({ field }) => (<FormItem><FormLabel>Nome do Contato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="collaboratorEmail" render={({ field }) => (<FormItem><FormLabel>Email do Contato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="collaboratorPhone" render={({ field }) => (<FormItem><FormLabel>Telefone do Contato</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              
              {/* Equipment */}
              <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold">Equipamento</h3>
                <FormField control={form.control} name="equipmentType" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="equipmentBrand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="equipmentModel" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="equipmentSerialNumber" render={({ field }) => (<FormItem><FormLabel>Número de Série</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
            </div>
            
            {/* Reported Problem */}
            <div className="space-y-4 p-4 border rounded-md">
              <h3 className="font-semibold">Problema Relatado</h3>
              <FormField
                control={form.control}
                name="reportedProblem"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
