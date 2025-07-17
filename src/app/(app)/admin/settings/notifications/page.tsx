"use client";

import { NotificationSettings } from "@/components/notification-settings";
import { PageLayout } from "@/components/page-layout";
import { usePermissions } from "@/context/PermissionsContext";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotificationSettingsPage() {
  const { hasPermission, loadingPermissions } = usePermissions();
  const router = useRouter();

  const canAccess = hasPermission('adminSettings');

  useEffect(() => {
    if (!loadingPermissions && !canAccess) {
      router.replace('/dashboard');
    }
  }, [loadingPermissions, canAccess, router]);

  return (
    <PageLayout
      title="Configurações de Notificações"
      description="Gerencie os templates de e-mail e WhatsApp para cada status do sistema."
      icon={<Bell className="w-8 h-8 text-primary" />}
      isLoading={loadingPermissions}
      canAccess={canAccess}
    >
      <NotificationSettings />
    </PageLayout>
  );
}
