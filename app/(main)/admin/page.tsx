"use client"

import { useState } from 'react';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { SystemAdministration } from '@/components/admin/system-administration';
import { SuperuserLogin } from '@/components/admin/superuser-login';
import { Shield } from 'lucide-react';
import { SystemSettings, LicenseInfo, SupportContact, ClientSubscription } from '@/types/invoice';

export default function AdminPage() {
  const { settings, updateSettings } = useInvoiceContext();
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [showSuperuserLogin, setShowSuperuserLogin] = useState(false);

  // Mock system settings - in a real implementation, these would come from a context or API
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>({
    id: 'system-settings-1',
    appName: 'Invoxa',
    appVersion: '1.0.0',
    companyName: 'Invoxa Inc.',
    companyWebsite: 'https://invoxa.example.com',
    supportContacts: [],
    licenseInfo: {
      id: 'license-1',
      companyName: 'Invoxa Inc.',
      licensedTo: 'Admin User',
      licenseKey: 'XXXX-XXXX-XXXX-XXXX',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      maxUsers: 10,
      features: [],
      supportLevel: 'premium',
      isActive: true
    },
    maintenanceMode: false,
    allowRegistration: true,
    maxInvoicesPerUser: 100,
    backupFrequency: 'daily',
    subscriptions: [],
    trialSettings: {
      defaultTrialDays: 14,
      maxTrialsPerClient: 1,
      trialFeatures: [],
      autoConvertToFree: true
    },
    updatedAt: new Date()
  });

  const isSuperUserMode = settings?.isSuperUser || isSuperuser;

  if (!isSuperUserMode) {
    return (
      <div className="text-center py-8">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need superuser privileges to access this area.</p>
        <button
          onClick={() => setShowSuperuserLogin(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Login as Superuser
        </button>

        <SuperuserLogin
          isOpen={showSuperuserLogin}
          onClose={() => setShowSuperuserLogin(false)}
          onLogin={(success) => {
            if (success) {
              setIsSuperuser(true);
              setShowSuperuserLogin(false);
            }
          }}
        />
      </div>
    );
  }

  // Mock functions for system administration - in a real implementation, these would interact with an API
  const handleUpdateSystemSettings = (updates: Partial<SystemSettings>) => {
    if (!systemSettings) return;
    setSystemSettings({ ...systemSettings, ...updates });
  };

  const handleUpdateLicenseInfo = (updates: Partial<LicenseInfo>) => {
    if (!systemSettings) return;
    setSystemSettings({
      ...systemSettings,
      licenseInfo: { ...systemSettings.licenseInfo, ...updates }
    });
  };

  const handleUpdateSupportContact = (id: string, updates: Partial<SupportContact>) => {
    if (!systemSettings) return;
    const updatedContacts = systemSettings.supportContacts.map(contact =>
      contact.id === id ? { ...contact, ...updates } : contact
    );
    setSystemSettings({
      ...systemSettings,
      supportContacts: updatedContacts
    });
  };

  const handleAddSupportContact = (contact: Partial<SupportContact>) => {
    if (!systemSettings) return;
    const newContact: SupportContact = {
      id: `contact-${Date.now()}`,
      type: 'general',
      name: '',
      email: '',
      department: '',
      isActive: true,
      ...contact
    };
    setSystemSettings({
      ...systemSettings,
      supportContacts: [...systemSettings.supportContacts, newContact]
    });
  };

  const handleRemoveSupportContact = (id: string) => {
    if (!systemSettings) return;
    setSystemSettings({
      ...systemSettings,
      supportContacts: systemSettings.supportContacts.filter(contact => contact.id !== id)
    });
  };

  // Mock subscription data and functions
  const [subscriptions] = useState<ClientSubscription[]>([]);

  const handleCreateSubscription = (subscription: any) => {
    console.log('Create subscription:', subscription);
    // In a real implementation, this would create a subscription via an API
  };

  const handleUpdateSubscription = (id: string, updates: any) => {
    console.log('Update subscription:', id, updates);
    // In a real implementation, this would update a subscription via an API
  };

  const handleCancelSubscription = (id: string) => {
    console.log('Cancel subscription:', id);
    // In a real implementation, this would cancel a subscription via an API
  };

  const handleCreateTrial = (clientData: any) => {
    console.log('Create trial:', clientData);
    // In a real implementation, this would create a trial via an API
  };

  const handleUpdateTrialSettings = (settings: any) => {
    console.log('Update trial settings:', settings);
    // In a real implementation, this would update trial settings via an API
  };

  return (
    <SystemAdministration
      systemSettings={systemSettings}
      onUpdateSystemSettings={handleUpdateSystemSettings}
      onUpdateLicenseInfo={handleUpdateLicenseInfo}
      onUpdateSupportContact={handleUpdateSupportContact}
      onAddSupportContact={handleAddSupportContact}
      onRemoveSupportContact={handleRemoveSupportContact}
      subscriptions={subscriptions}
      onCreateSubscription={handleCreateSubscription}
      onUpdateSubscription={handleUpdateSubscription}
      onCancelSubscription={handleCancelSubscription}
      onCreateTrial={handleCreateTrial}
      onUpdateTrialSettings={handleUpdateTrialSettings}
    />
  );
}
