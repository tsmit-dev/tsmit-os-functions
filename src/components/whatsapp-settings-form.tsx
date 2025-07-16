'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WhatsappSettings } from '@/lib/types';

const formSchema = z.object({
  endpoint: z.string().url({ message: 'Por favor, insira uma URL válida.' }).optional().or(z.literal('')),
  bearerToken: z.string().optional(),
});

type WhatsappFormValues = z.infer<typeof formSchema>;

export function WhatsappSettingsForm() {
  const { toast } = useToast();

  const form = useForm<WhatsappFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      endpoint: '',
      bearerToken: '',
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'integrations');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().whatsapp) {
          form.reset(docSnap.data().whatsapp);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações do WhatsApp:", error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações do WhatsApp.',
          variant: 'destructive',
        });
      }
    }
    fetchSettings();
  }, [form, toast]);

  async function onSubmit(values: WhatsappFormValues) {
    try {
      const docRef = doc(db, 'settings', 'integrations');
      // Usamos set com merge: true para criar ou atualizar o documento sem sobrescrever outros campos.
      await setDoc(docRef, { whatsapp: values }, { merge: true });
      toast({
        title: 'Sucesso',
        description: 'Configurações do WhatsApp salvas com sucesso!',
      });
    } catch (error) {
      console.error("Erro ao salvar configurações do WhatsApp:", error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações. Tente novamente.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do WhatsApp</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint da API</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.tsmit.digital/api/messages/send" {...field} />
                  </FormControl>
                  <FormDescription>
                    A URL de endpoint fornecida pela sua API do WhatsApp.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bearerToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorization Bearer Token</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Seu token de autorização" {...field} />
                  </FormControl>
                  <FormDescription>
                    Seu token secreto para autenticar na API do WhatsApp.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Salvar Configurações</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
