"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Status } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus } from 'lucide-react';
import { IconPicker } from './icon-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { TwitterPicker } from 'react-color';
import { Textarea } from './ui/textarea';
import { addStatus, updateStatus } from '@/lib/data';
import { Switch } from './ui/switch';

const statusSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    order: z.number().min(0, 'A ordem deve ser um número positivo.'),
    color: z.string().min(1, 'A cor é obrigatória.'),
    icon: z.string().min(1, 'O ícone é obrigatório.'),
    isFinal: z.boolean().default(false),
    isInitial: z.boolean().default(false),
    isPickupStatus: z.boolean().default(false),
    triggersEmail: z.boolean().default(false),
    emailBody: z.string().optional(),
    triggersWhatsapp: z.boolean().default(false),
    whatsappBody: z.string().optional(),
});

interface StatusFormSheetProps {
  children: React.ReactNode;
  status?: Status;
  onStatusChange: () => void;
  allStatuses: Status[];
}

export function StatusFormSheet({ children, status, onStatusChange, allStatuses }: StatusFormSheetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: status ? {
        ...status,
        order: status.order ?? 0,
        emailBody: status.emailBody || '',
        triggersWhatsapp: status.triggersWhatsapp || false,
        whatsappBody: status.whatsappBody || '',
    } : {
        name: '',
        order: (allStatuses.length > 0 ? Math.max(...allStatuses.map(s => s.order)) + 1 : 1),
        color: '#4A90E2',
        icon: 'Package',
        isFinal: false,
        isInitial: false,
        isPickupStatus: false,
        triggersEmail: false,
        emailBody: '',
        triggersWhatsapp: false,
        whatsappBody: '',
    },
  });

  const triggersEmail = form.watch('triggersEmail');
  const triggersWhatsapp = form.watch('triggersWhatsapp');

  const onSubmit = async (values: z.infer<typeof statusSchema>) => {
    try {
      if (status) {
        await updateStatus(status.id, values);
        toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' });
      } else {
        await addStatus(values);
        toast({ title: 'Sucesso', description: 'Status adicionado com sucesso.' });
      }
      onStatusChange();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Failed to save status', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o status.', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <div onClick={() => setIsOpen(true)}>{children}</div>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{status ? 'Editar Status' : 'Adicionar Status'}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="order" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordem</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
               <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Cor</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start">
                           <div className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: field.value }} />
                           {field.value}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                           <TwitterPicker color={field.value} onChangeComplete={(color) => field.onChange(color.hex)} />
                        </PopoverContent>
                     </Popover>
                  </FormItem>
               )} />
               <FormField control={form.control} name="icon" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Ícone</FormLabel>
                     <Controller
                        control={form.control}
                        name="icon"
                        render={({ field: { onChange, value } }) => (
                           <IconPicker value={value} onChange={onChange} />
                        )}
                        />
                  </FormItem>
               )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="isInitial" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel>Status Inicial?</FormLabel>
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="isFinal" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel>Status Final?</FormLabel>
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="isPickupStatus" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <FormLabel>Pronto p/ Retirada?</FormLabel>
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <FormField control={form.control} name="triggersEmail" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel>Disparar Notificação por E-mail?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    {triggersEmail && (
                        <FormField control={form.control} name="emailBody" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Corpo do Email</FormLabel>
                            <FormControl><Textarea {...field} rows={5} placeholder="Ex: Olá {client_name}, a sua Ordem de Serviço nº {os_number} mudou para o status: {status_name}." /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                    )}
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <FormField control={form.control} name="triggersWhatsapp" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel>Disparar Notificação por WhatsApp?</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    {triggersWhatsapp && (
                        <FormField control={form.control} name="whatsappBody" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Corpo da Mensagem do WhatsApp</FormLabel>
                            <FormControl><Textarea {...field} rows={5} placeholder="Ex: Olá {client_name}, a OS {os_number} foi atualizada para: {status_name}." /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )} />
                    )}
                </div>


              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface EditStatusSheetProps {
    status: Status;
    onStatusChange: () => void;
    allStatuses: Status[];
}

export function EditStatusSheet({ status, onStatusChange, allStatuses }: EditStatusSheetProps) {
    return (
        <StatusFormSheet status={status} onStatusChange={onStatusChange} allStatuses={allStatuses}>
            <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
            </Button>
        </StatusFormSheet>
    )
}

interface AddStatusSheetProps {
    onStatusChange: () => void;
    allStatuses: Status[];
}

export function AddStatusSheet({ onStatusChange, allStatuses }: AddStatusSheetProps) {
    return (
        <StatusFormSheet onStatusChange={onStatusChange} allStatuses={allStatuses}>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Status
            </Button>
        </StatusFormSheet>
    )
}
