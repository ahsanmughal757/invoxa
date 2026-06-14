"use client"

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { InvoiceTemplate } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Palette } from 'lucide-react'

// Zod schema for template form
const templateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Invalid color format" }),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: "Invalid color format" }),
  fontFamily: z.string(),
  showLogo: z.boolean(),
  showCompanyDetails: z.boolean(),
  showClientDetails: z.boolean(),
  showInvoiceNumber: z.boolean(),
  showDates: z.boolean(),
  showNotes: z.boolean(),
  showTerms: z.boolean(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateSettingsProps {
  templates: InvoiceTemplate[]
  onCreateTemplate: (template: Partial<InvoiceTemplate>) => void
  onUpdateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void
  onDeleteTemplate: (id: string) => void
}

export function TemplateSettings({ 
  templates, 
  onCreateTemplate, 
  onUpdateTemplate, 
  onDeleteTemplate 
}: TemplateSettingsProps) {
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSaveTemplate = (templateData: Partial<InvoiceTemplate>) => {
    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, templateData)
    } else {
      onCreateTemplate(templateData)
    }
    setIsDialogOpen(false)
    setEditingTemplate(null)
  }

  const openEditDialog = (template?: InvoiceTemplate) => {
    setEditingTemplate(template || null)
    setIsDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Invoice Templates
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{template.name}</h3>
                {template.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: template.primaryColor }}
                />
                <span className="text-sm text-gray-600">Primary</span>
                <div 
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: template.secondaryColor }}
                />
                <span className="text-sm text-gray-600">Secondary</span>
              </div>

              <div className="text-sm text-gray-600">
                Font: {template.fontFamily}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface TemplateFormProps {
  template: InvoiceTemplate | null
  onSave: (template: Partial<InvoiceTemplate>) => void
  onCancel: () => void
}

function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: template?.name || 'New Template',
      primaryColor: template?.primaryColor || '#000000',
      secondaryColor: template?.secondaryColor || '#666666',
      fontFamily: template?.fontFamily || 'Inter',
      showLogo: template?.showLogo ?? true,
      showCompanyDetails: template?.showCompanyDetails ?? true,
      showClientDetails: template?.showClientDetails ?? true,
      showInvoiceNumber: template?.showInvoiceNumber ?? true,
      showDates: template?.showDates ?? true,
      showNotes: template?.showNotes ?? true,
      showTerms: template?.showTerms ?? true,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <Label htmlFor="templateName">Template Name</Label>
        <Input id="templateName" {...register("name")} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <Input id="primaryColor" type="color" {...register("primaryColor")} />
        </div>
        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <Input id="secondaryColor" type="color" {...register("secondaryColor")} />
        </div>
      </div>

      <div>
        <Label htmlFor="fontFamily">Font Family</Label>
        <Controller
          name="fontFamily"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Visible Sections</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'showLogo', label: 'Company Logo' },
            { key: 'showCompanyDetails', label: 'Company Details' },
            { key: 'showClientDetails', label: 'Client Details' },
            { key: 'showInvoiceNumber', label: 'Invoice Number' },
            { key: 'showDates', label: 'Dates' },
            { key: 'showNotes', label: 'Notes' },
            { key: 'showTerms', label: 'Terms' },
          ].map(({ key, label }) => (
            <Controller
              key={key}
              name={key as keyof TemplateFormData}
              control={control}
              render={({ field }) => (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value as boolean}
                    onChange={field.onChange}
                    className="rounded"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Template
        </Button>
      </div>
    </form>
  )
}