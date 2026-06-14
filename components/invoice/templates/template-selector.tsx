import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TemplateId, TEMPLATE_METADATA, getAllTemplates } from './template-registry';

interface TemplateSelectorProps {
  currentTemplateId: TemplateId;
  onTemplateChange: (templateId: TemplateId) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  currentTemplateId,
  onTemplateChange,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(currentTemplateId);

  const handleTemplateChange = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    onTemplateChange(templateId);
  };

  const templates = getAllTemplates();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Select Invoice Template</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedTemplate} 
          onValueChange={(value: TemplateId) => handleTemplateChange(value)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {templates.map((template) => (
            <div 
              key={template.id} 
              className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all hover:bg-accent ${
                selectedTemplate === template.id ? 'ring-2 ring-primary border-primary' : ''
              }`}
            >
              <RadioGroupItem 
                value={template.id} 
                id={`template-${template.id}`} 
                className="mt-0.5"
              />
              <div className="space-y-1 leading-none">
                <Label 
                  htmlFor={`template-${template.id}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {template.name}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};