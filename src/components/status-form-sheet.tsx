"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Status } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus } from 'lucide-react';
import { IconPicker } from './icon-picker';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { TwitterPicker } from 'react-color';
import { addStatus, updateStatus } from '@/lib/data';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';

const statusSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    order: z.number().min(0, 'A ordem deve ser um número positivo.'),
    color: z.string().min(1, 'A cor é obrigatória.'),
    icon: z.string().min(1, 'O ícone é obrigatório.'),
    isFinal: z.boolean().default(false),
    isInitial: z.boolean().default(false),
    isPickupStatus: z.boolean().default(false),
    triggersEmail: z.boolean().default(false),
    triggersWhatsapp: z.boolean().default(false),
});

type StatusFormValues = z.infer<typeof statusSchema>;

interface StatusFormSheetProps {
  status?: Status | null;
  onStatusChange: () => void;
  allStatuses: Status[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusFormSheet({ open, onOpenChange, status, onStatusChange, allStatuses }: StatusFormSheetProps) {
  const { toast } = useToast();

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
  });
  
  const { reset, control, handleSubmit } = form;

  useEffect(() => {
    if (open) {
      const defaultValues = status ? {
        ...status,
        order: status.order ?? 0,
      } : {
        name: '',
        order: (allStatuses.length > 0 ? Math.max(...allStatuses.map(s => s.order)) + 1 : 1),
        color: '#4A90E2',
        icon: 'Package',
        isFinal: false,
        isInitial: false,
        isPickupStatus: false,
        triggersEmail: false,
        triggersWhatsapp: false,
      };
      reset(defaultValues);
    }
  }, [open, status, allStatuses, reset]);

  const onSubmit = async (values: StatusFormValues) => {
    try {
      if (status) {
        await updateStatus(status.id, values);
        toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' });
      } else {
        await addStatus(values);
        toast({ title: 'Sucesso', description: 'Status adicionado com sucesso.' });
      }
      onStatusChange();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save status', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar o status.', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{status ? 'Editar Status' : 'Adicionar Status'}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="order" render={({ field }) => (
                <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={control} name="color" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Cor</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="outline" className="w-full justify-start">
                           <div className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: field.value }} />
                           {field.value}
                           </Button>
                        </PopoverTrigger>
                        <PopoverContent><TwitterPicker color={field.value} onChangeComplete={(color) => field.onChange(color.hex)} /></PopoverContent>
                     </Popover>
                  </FormItem>
               )} />
               <FormField control={control} name="icon" render={({ field }) => (
                  <FormItem>
                     <FormLabel>Ícone</FormLabel>
                     <Controller
                        control={control}
                        name="icon"
                        render={({ field: { onChange, value } }) => (<IconPicker value={value} onChange={onChange} />)}
                      />
                  </FormItem>
               )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={control} name="isInitial" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><FormLabel>Status Inicial?</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="isFinal" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><FormLabel>Status Final?</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                    <FormField control={control} name="isPickupStatus" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><FormLabel>Pronto p/ Retirada?</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <FormField control={control} name="triggersEmail" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between"><FormLabel>Notificar por E-mail?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                    <FormField control={control} name="triggersWhatsapp" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between"><FormLabel>Notificar por WhatsApp?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                    )} />
                </div>


              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface EditStatusButtonProps {
    status: Status;
    onStatusChange: () => void;
    allStatuses: Status[];
}

export function EditStatusButton({ status, onStatusChange, allStatuses }: EditStatusButtonProps) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
                <Pencil className="h-4 w-4" />
            </Button>
            <StatusFormSheet open={open} onOpenChange={setOpen} status={status} onStatusChange={onStatusChange} allStatuses={allStatuses} />
        </>
    )
}

interface AddStatusButtonProps {
    onStatusChange: () => void;
    allStatuses: Status[];
}

export function AddStatusButton({ onStatusChange, allStatuses }: AddStatusButtonProps) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Status
            </Button>
            <StatusFormSheet open={open} onOpenChange={setOpen} onStatusChange={onStatusChange} allStatuses={allStatuses} />
        </>
    )
}
