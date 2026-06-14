'use client';

import React from 'react';
import {
  ReportTemplateId,
  REPORT_TEMPLATE_METADATA,
  getAllReportTemplates,
} from './template-registry';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FileText, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportTemplateSelectorProps {
  selectedTemplate: ReportTemplateId;
  onTemplateChange: (templateId: ReportTemplateId) => void;
}

export function ReportTemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: ReportTemplateSelectorProps) {
  const templates = getAllReportTemplates();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Template:</span>
          <span className="font-medium">
            {REPORT_TEMPLATE_METADATA[selectedTemplate]?.name || 'Professional'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">
            Select PDF Template
          </h4>
          <div className="space-y-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onTemplateChange(template.id as ReportTemplateId)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedTemplate === template.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900">
                        {template.name}
                      </p>
                      {selectedTemplate === template.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
