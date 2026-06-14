"use client"

import { useInvoiceContext } from '@/context/InvoiceContext';
import { TemplateSettings } from '@/components/settings/template-settings';
import { SubscriptionGuard } from '@/components/subscription/subscription-guard';
import { FEATURES } from '@/hooks/use-subscription-access';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function TemplateSettingsPage() {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useInvoiceContext();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Templates</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/settings')}
        >
          Back to Settings
        </Button>
      </div>
      <SubscriptionGuard feature={FEATURES.CUSTOM_TEMPLATES}>
        <TemplateSettings
          templates={templates}
          onCreateTemplate={createTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={deleteTemplate}
        />
      </SubscriptionGuard>
    </div>
  );
}
