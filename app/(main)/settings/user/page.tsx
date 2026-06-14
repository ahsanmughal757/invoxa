"use client"

import { useInvoiceContext } from '@/context/InvoiceContext';
import { UserSettingsComponent } from '@/components/settings/user-settings';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UserSettingsPage() {
  const { settings, updateSettings } = useInvoiceContext();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/settings')}
        >
          Back to Settings
        </Button>
      </div>
      <UserSettingsComponent
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
