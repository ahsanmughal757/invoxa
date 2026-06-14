"use client"

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { LicenseInfo } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, CheckCircle } from 'lucide-react'

const licenseSchema = z.object({
  licensedTo: z.string().min(1, "Licensed to is required"),
  licenseKey: z.string().min(1, "License key is required"),
  maxUsers: z.number().min(1, "Max users must be at least 1"),
  expiryDate: z.date(),
  supportLevel: z.enum(['basic', 'premium', 'enterprise']),
  isActive: z.boolean(),
  features: z.array(z.string()).optional(),
});

interface LicenseSettingsFormProps {
  license: LicenseInfo
  onSave: (updates: Partial<LicenseInfo>) => void
}

export function LicenseSettingsForm({ license, onSave }: LicenseSettingsFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<z.infer<typeof licenseSchema>>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
        ...license,
        expiryDate: new Date(license.expiryDate),
    },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            License Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licensedTo">Licensed To</Label>
              <Input id="licensedTo" {...register("licensedTo")} />
              {errors.licensedTo && <p className="text-red-500 text-xs mt-1">{errors.licensedTo.message}</p>}
            </div>
            <div>
              <Label htmlFor="licenseKey">License Key</Label>
              <Input id="licenseKey" {...register("licenseKey")} />
              {errors.licenseKey && <p className="text-red-500 text-xs mt-1">{errors.licenseKey.message}</p>}
            </div>
            <div>
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input id="maxUsers" type="number" {...register("maxUsers", { valueAsNumber: true })} />
              {errors.maxUsers && <p className="text-red-500 text-xs mt-1">{errors.maxUsers.message}</p>}
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <Input
                    type="date"
                    value={new Date(field.value).toISOString().split('T')[0]}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                )}
              />
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
              <Label htmlFor="isActive" className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                License Active
              </Label>
            </div>
          </div>

          <div>
            <Label>License Features</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {license.features.map((feature, index) => (
                <Badge key={index} variant="outline">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
          <Button type="submit">Save License Information</Button>
        </CardContent>
      </Card>
    </form>
  )
}
