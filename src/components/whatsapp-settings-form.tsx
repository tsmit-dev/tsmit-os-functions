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
  n8nWebhookUrl: z.string().url({ message: 'Por favor, insira uma URL válida.' }).optional().or(z.literal('')),
  n8nBearerToken: z.string().optional(),
});

type WhatsappFormValues = z.infer<typeof formSchema>;

export function WhatsappSettingsForm() {
  const { toast } = useToast();

  const form = useForm<WhatsappFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      n8nWebhookUrl: '',
      n8nBearerToken: '',
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'whatsapp');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          form.reset(docSnap.data());
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
      const docRef = doc(db, 'settings', 'whatsapp');
      await setDoc(docRef, values);
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
        <CardTitle>Configurações do WhatsApp com n8n</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="n8nWebhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Webhook n8n</FormLabel>
                  <FormControl>
                    <Input placeholder="https://seu-dominio-n8n.com/webhook/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    A URL do webhook do seu fluxo de trabalho n8n que receberá os dados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="n8nBearerToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorization Bearer Token (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Seu token de autorização" {...field} />
                  </FormControl>
                  <FormDescription>
                    Seu token secreto para autenticar no webhook do n8n.
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
