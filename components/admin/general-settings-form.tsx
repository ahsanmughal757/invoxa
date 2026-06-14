"use client"

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { SystemSettings } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, AlertTriangle } from 'lucide-react'

const generalSettingsSchema = z.object({
  appName: z.string().min(1, "Application name is required"),
  appVersion: z.string().min(1, "Version is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  maxInvoicesPerUser: z.number().min(1, "Max invoices must be at least 1"),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  allowRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
});

interface GeneralSettingsFormProps {
  settings: SystemSettings
  onSave: (updates: Partial<SystemSettings>) => void
}

export function GeneralSettingsForm({ settings, onSave }: GeneralSettingsFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appName">Application Name</Label>
              <Input id="appName" {...register("appName")} />
              {errors.appName && <p className="text-red-500 text-xs mt-1">{errors.appName.message}</p>}
            </div>
            <div>
              <Label htmlFor="appVersion">Version</Label>
              <Input id="appVersion" {...register("appVersion")} />
              {errors.appVersion && <p className="text-red-500 text-xs mt-1">{errors.appVersion.message}</p>}
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName")} />
              {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input id="companyWebsite" {...register("companyWebsite")} />
              {errors.companyWebsite && <p className="text-red-500 text-xs mt-1">{errors.companyWebsite.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxInvoices">Max Invoices Per User</Label>
              <Input id="maxInvoices" type="number" {...register("maxInvoicesPerUser", { valueAsNumber: true })} />
              {errors.maxInvoicesPerUser && <p className="text-red-500 text-xs mt-1">{errors.maxInvoicesPerUser.message}</p>}
            </div>
            <div>
              <Label htmlFor="backupFreq">Backup Frequency</Label>
              <Controller
                name="backupFrequency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Controller
                name="allowRegistration"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded"
                  />
                )}
              />
              <Label htmlFor="allowRegistration">Allow New Registrations</Label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="maintenanceMode"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={field.value}
                  onChange={field.onChange}
                  className="rounded"
                />
              )}
            />
            <Label htmlFor="maintenanceMode" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
              Maintenance Mode
            </Label>
          </div>
          <Button type="submit">Save General Settings</Button>
        </CardContent>
      </Card>
    </form>
  )
}
