"use client";

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';
import { EmailSettingsForm } from '@/components/email-settings-form';
import { WhatsappSettingsForm } from '@/components/whatsapp-settings-form';
import { usePermissions } from '@/context/PermissionsContext';
import { Mail, MessageCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function IntegrationsSettingsPage() {
    const router = useRouter();
    const { hasPermission, loadingPermissions } = usePermissions();

    const canAccess = hasPermission('adminSettings');

    useEffect(() => {
        if (!loadingPermissions && !canAccess) {
            router.replace('/dashboard');
        }
    }, [loadingPermissions, canAccess, router]);

    return (
        <PageLayout
            title="Integrações"
            description="Gerencie as integrações e configurações de serviços externos, como e-mails e WhatsApp."
            icon={<Mail className="w-8 h-8 text-primary" />}
            isLoading={loadingPermissions}
            canAccess={canAccess}
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Configurações de E-mail
                        </CardTitle>
                        <CardDescription>
                            Configure o serviço de envio de e-mails para notificações automáticas do sistema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EmailSettingsForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Configurações do WhatsApp
                        </CardTitle>
                        <CardDescription>
                            Configure a integração com a API do WhatsApp para o envio de mensagens automáticas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WhatsappSettingsForm />
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
