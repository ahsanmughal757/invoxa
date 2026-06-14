"use client"

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { UserSettings } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Settings, Globe, DollarSign, Calendar, Mail } from 'lucide-react'

// Zod schema for user settings
const userSettingsSchema = z.object({
  defaultCurrency: z.string(),
  defaultPaymentTerms: z.number().min(1).max(365),
  defaultTaxRate: z.number().min(0).max(100),
  autoSendReminders: z.boolean(),
  reminderDays: z.array(z.number().min(1)),
  timeZone: z.string(),
  dateFormat: z.string(),
  numberFormat: z.string(),
  emailSignature: z.string().optional(),
  autoBackup: z.boolean(),
});

type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

interface UserSettingsProps {
  settings: UserSettings | null
  onSave: (settings: UserSettings) => void
}

export function UserSettingsComponent({ settings, onSave }: UserSettingsProps) {
  const { register, handleSubmit, control, formState: { errors }, watch } = useForm<UserSettingsFormData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      defaultCurrency: settings?.defaultCurrency || 'USD',
      defaultPaymentTerms: settings?.defaultPaymentTerms || 30,
      defaultTaxRate: settings?.defaultTaxRate || 10,
      autoSendReminders: settings?.autoSendReminders ?? true,
      reminderDays: settings?.reminderDays || [7, 3, 1],
      timeZone: settings?.timeZone || 'UTC',
      dateFormat: settings?.dateFormat || 'MM/DD/YYYY',
      numberFormat: settings?.numberFormat || 'en-US',
      emailSignature: settings?.emailSignature || '',
      autoBackup: settings?.autoBackup ?? true,
    }
  });

  const autoSendReminders = watch("autoSendReminders");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center">
        <Settings className="h-8 w-8 mr-3 text-gray-600" />
        User Settings
      </h1>

      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Controller
                  name="defaultCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="defaultPaymentTerms">Default Payment Terms (days)</Label>
                <Input id="defaultPaymentTerms" type="number" {...register("defaultPaymentTerms", { valueAsNumber: true })} min="1" max="365" />
                {errors.defaultPaymentTerms && <p className="text-red-500 text-xs mt-1">{errors.defaultPaymentTerms.message}</p>}
              </div>
              <div>
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input id="defaultTaxRate" type="number" {...register("defaultTaxRate", { valueAsNumber: true })} min="0" max="100" step="0.1" />
                {errors.defaultTaxRate && <p className="text-red-500 text-xs mt-1">{errors.defaultTaxRate.message}</p>}
              </div>
              <div>
                <Label htmlFor="timeZone">Time Zone</Label>
                <Controller
                  name="timeZone"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Format Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Format Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Controller
                  name="dateFormat"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM DD, YYYY">MMM DD, YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="numberFormat">Number Format</Label>
                <Controller
                  name="numberFormat"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">1,234.56 (US)</SelectItem>
                        <SelectItem value="en-GB">1,234.56 (UK)</SelectItem>
                        <SelectItem value="de-DE">1.234,56 (German)</SelectItem>
                        <SelectItem value="fr-FR">1 234,56 (French)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminder Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Reminder Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="autoSendReminders"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="autoSendReminders"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded"
                  />
                )}
              />
              <Label htmlFor="autoSendReminders">Automatically send payment reminders</Label>
            </div>
            
            <div>
              <Label htmlFor="reminderDays">Reminder Days (comma-separated)</Label>
              <Controller
                name="reminderDays"
                control={control}
                render={({ field }) => (
                  <Input
                    id="reminderDays"
                    value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                    onChange={(e) => {
                      const days = e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
                      field.onChange(days);
                    }}
                    placeholder="7, 3, 1"
                    disabled={!autoSendReminders}
                  />
                )}
              />
              {errors.reminderDays && <p className="text-red-500 text-xs mt-1">{errors.reminderDays.message}</p>}
              <p className="text-sm text-gray-600 mt-1">
                Send reminders this many days before the due date
              </p>
            </div>

            <div>
              <Label htmlFor="emailSignature">Email Signature</Label>
              <Textarea id="emailSignature" {...register("emailSignature")} placeholder="Your email signature for invoice communications" rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Backup Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Controller
                name="autoBackup"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="autoBackup"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded"
                  />
                )}
              />
              <Label htmlFor="autoBackup">Automatically backup data</Label>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Automatically backup your data to browser storage
            </p>
          </CardContent>
        </Card>

        <Button type="submit" className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </form>
    </div>
  )
}