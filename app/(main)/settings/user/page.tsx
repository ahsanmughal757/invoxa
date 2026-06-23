"use client"

import { useInvoiceContext } from '@/context/InvoiceContext';
import { UserSettingsComponent } from '@/components/settings/user-settings';
import { BackButton } from '@/components/ui/back-button';

export default function UserSettingsPage() {
  const { settings, updateSettings } = useInvoiceContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">User Settings</h1>
        <BackButton href="/settings">Back to Settings</BackButton>
      </div>
      <UserSettingsComponent
        settings={settings}
        onSave={updateSettings}
      />
    </div>
  );
}
