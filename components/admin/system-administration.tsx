"use client"

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { SystemSettings, LicenseInfo, SupportContact } from '@/types/invoice'
import { SubscriptionManagement } from './subscription-management'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { 
  Shield, 
  Settings, 
  Users, 
  Mail, 
  Key, 
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

// Zod Schema for SupportContactForm
const supportContactSchema = z.object({
  type: z.enum(['general', 'technical', 'billing', 'emergency']),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  isActive: z.boolean(),
});

interface SystemAdministrationProps {
  systemSettings: SystemSettings | null
  onUpdateSystemSettings: (updates: Partial<SystemSettings>) => void
  onUpdateLicenseInfo: (updates: Partial<LicenseInfo>) => void
  onUpdateSupportContact: (id: string, updates: Partial<SupportContact>) => void
  onAddSupportContact: (contact: Partial<SupportContact>) => void
  onRemoveSupportContact: (id: string) => void
  subscriptions: any[]
  onCreateSubscription: (subscription: any) => void
  onUpdateSubscription: (id: string, updates: any) => void
  onCancelSubscription: (id: string) => void
  onCreateTrial: (clientData: any) => void
  onUpdateTrialSettings: (settings: any) => void
}

export function SystemAdministration({
  systemSettings,
  onUpdateSystemSettings,
  onUpdateLicenseInfo,
  onUpdateSupportContact,
  onAddSupportContact,
  onRemoveSupportContact,
  subscriptions,
  onCreateSubscription,
  onUpdateSubscription,
  onCancelSubscription,
  onCreateTrial,
  onUpdateTrialSettings
}: SystemAdministrationProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'license' | 'support' | 'subscriptions' | 'maintenance'>('general')
  const [editingContact, setEditingContact] = useState<SupportContact | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  if (!systemSettings) {
    return <div>Loading system settings...</div>
  }

  const openContactDialog = (contact?: SupportContact) => {
    setEditingContact(contact || null)
    setIsContactDialogOpen(true)
  }

  const handleSaveContact = (contactData: Partial<SupportContact>) => {
    if (editingContact) {
      onUpdateSupportContact(editingContact.id, contactData)
    } else {
      onAddSupportContact(contactData)
    }
    setIsContactDialogOpen(false)
    setEditingContact(null)
  }

  const renderSupportSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Support Contacts
          </CardTitle>
          <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openContactDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? 'Edit Support Contact' : 'Add Support Contact'}
                </DialogTitle>
              </DialogHeader>
              <SupportContactForm
                contact={editingContact}
                onSave={handleSaveContact}
                onCancel={() => setIsContactDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systemSettings.supportContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.department}</TableCell>
                  <TableCell>
                    <Badge className={contact.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openContactDialog(contact)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveSupportContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderMaintenanceSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            System Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-900">Maintenance Mode</h3>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              When enabled, the application will show a maintenance message to users.
            </p>
            <div className="mt-3">
              <Button
                variant={systemSettings.maintenanceMode ? "destructive" : "default"}
                onClick={() => onUpdateSystemSettings({ maintenanceMode: !systemSettings.maintenanceMode })}
              >
                {systemSettings.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{formatDate(systemSettings.updatedAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-lg font-medium">Operational</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="h-8 w-8 mr-3 text-red-600" />
          System Administration
        </h1>
        <Badge className="bg-red-100 text-red-800">
          Superuser Access
        </Badge>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'license', label: 'License', icon: Key },
            { id: 'support', label: 'Support', icon: Mail },
            { id: 'subscriptions', label: 'Subscriptions', icon: Users },
            { id: 'maintenance', label: 'Maintenance', icon: AlertTriangle }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralSettingsForm settings={systemSettings} onSave={onUpdateSystemSettings} />}
      {activeTab === 'license' && <LicenseSettingsForm license={systemSettings.licenseInfo} onSave={onUpdateLicenseInfo} />}
      {activeTab === 'support' && renderSupportSettings()}
      {activeTab === 'subscriptions' && (
        <SubscriptionManagement
          subscriptions={subscriptions}
          trialSettings={systemSettings.trialSettings}
          onCreateSubscription={onCreateSubscription}
          onUpdateSubscription={onUpdateSubscription}
          onCancelSubscription={onCancelSubscription}
          onCreateTrial={onCreateTrial}
          onUpdateTrialSettings={onUpdateTrialSettings}
        />
      )}
      {activeTab === 'maintenance' && renderMaintenanceSettings()}
    </div>
  )
}

interface SupportContactFormProps {
  contact: SupportContact | null
  onSave: (contact: Partial<SupportContact>) => void
  onCancel: () => void
}

function SupportContactForm({ contact, onSave, onCancel }: SupportContactFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<z.infer<typeof supportContactSchema>>({
    resolver: zodResolver(supportContactSchema),
    defaultValues: {
      type: contact?.type || 'general',
      name: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      department: contact?.department || '',
      isActive: contact?.isActive ?? true,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactType">Contact Type</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Support</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing Support</SelectItem>
                  <SelectItem value="emergency">Emergency Contact</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="contactName">Name</Label>
          <Input id="contactName" {...register("name")} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" type="email" {...register("email")} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="contactPhone">Phone</Label>
          <Input id="contactPhone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input id="department" {...register("department")} />
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                id="isActive"
                checked={field.value}
                onChange={field.onChange}
                className="rounded"
              />
            )}
          />
          <Label htmlFor="isActive">Active Contact</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {contact ? 'Update Contact' : 'Add Contact'}
        </Button>
      </div>
    </form>
  )
}

// General Settings Form Component
interface GeneralSettingsFormProps {
  settings: SystemSettings
  onSave: (updates: Partial<SystemSettings>) => void
}

function GeneralSettingsForm({ settings, onSave }: GeneralSettingsFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      appName: settings.appName,
      companyName: settings.companyName,
      companyWebsite: settings.companyWebsite,
      allowRegistration: settings.allowRegistration,
      maxInvoicesPerUser: settings.maxInvoicesPerUser,
      backupFrequency: settings.backupFrequency,
    }
  });

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appName">Application Name</Label>
                <Input id="appName" {...register("appName", { required: "App name is required" })} />
                {errors.appName && <p className="text-red-500 text-xs mt-1">{errors.appName.message}</p>}
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" {...register("companyName", { required: "Company name is required" })} />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input id="companyWebsite" type="url" {...register("companyWebsite")} />
              </div>
              <div>
                <Label htmlFor="maxInvoicesPerUser">Max Invoices Per User</Label>
                <Input 
                  id="maxInvoicesPerUser" 
                  type="number" 
                  {...register("maxInvoicesPerUser", { 
                    required: "Max invoices is required",
                    min: { value: 1, message: "Must be at least 1" }
                  })} 
                />
                {errors.maxInvoicesPerUser && <p className="text-red-500 text-xs mt-1">{errors.maxInvoicesPerUser.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowRegistration"
                  {...register("allowRegistration")}
                  className="rounded"
                />
                <Label htmlFor="allowRegistration">Allow New User Registration</Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                Save General Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// License Settings Form Component
interface LicenseSettingsFormProps {
  license: LicenseInfo
  onSave: (updates: Partial<LicenseInfo>) => void
}

function LicenseSettingsForm({ license, onSave }: LicenseSettingsFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      companyName: license.companyName,
      licensedTo: license.licensedTo,
      licenseKey: license.licenseKey,
      maxUsers: license.maxUsers,
      supportLevel: license.supportLevel,
      isActive: license.isActive,
    }
  });

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            License Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseCompanyName">Company Name</Label>
                <Input id="licenseCompanyName" {...register("companyName", { required: "Company name is required" })} />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <Label htmlFor="licensedTo">Licensed To</Label>
                <Input id="licensedTo" {...register("licensedTo", { required: "Licensed to is required" })} />
                {errors.licensedTo && <p className="text-red-500 text-xs mt-1">{errors.licensedTo.message}</p>}
              </div>
              <div>
                <Label htmlFor="licenseKey">License Key</Label>
                <Input id="licenseKey" {...register("licenseKey", { required: "License key is required" })} />
                {errors.licenseKey && <p className="text-red-500 text-xs mt-1">{errors.licenseKey.message}</p>}
              </div>
              <div>
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input 
                  id="maxUsers" 
                  type="number" 
                  {...register("maxUsers", { 
                    required: "Max users is required",
                    min: { value: 1, message: "Must be at least 1" }
                  })} 
                />
                {errors.maxUsers && <p className="text-red-500 text-xs mt-1">{errors.maxUsers.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(license.expiryDate)}
                </p>
              </div>
              <div>
                <Label htmlFor="supportLevel">Support Level</Label>
                <Controller
                  name="supportLevel"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActiveLicense"
                  {...register("isActive")}
                  className="rounded"
                />
                <Label htmlFor="isActiveLicense">License Active</Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                Save License Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}