import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TemplateRenderer,
  TEMPLATE_METADATA,
  getAllTemplates,
  TemplateId,
  isValidTemplateId,
} from "./templates/template-registry";
import { Invoice, Client, Organization } from "@/types/invoice";

// Sample data for preview purposes
const SAMPLE_INVOICE: Invoice = {
  id: "sample",
  org_id: "sample-org",
  client_id: "sample-client",
  number: "INV-001",
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: "draft",
  subtotal: 1000,
  total: 1000,
  currency: "USD",
  invoice_items: [
    {
      id: "item-1",
      invoice_id: "sample",
      description: "Web Development Services",
      qty: 10,
      unit_price: 100,
      line_total: 1000,
    },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SAMPLE_CLIENT: Client = {
  id: "sample-client",
  org_id: "sample-org",
  name: "Acme Corporation",
  email: "contact@acme.com",
  phone: "+1 (555) 123-4567",
  billing_address: {
    street: "123 Business Ave",
    city: "New York",
    state: "NY",
    postal_code: "10001",
    country: "USA",
  },
  created_at: new Date().toISOString(),
};

const SAMPLE_ORGANIZATION: Organization = {
  id: "sample-org",
  email: "exampleorganization@email.com",
  name: "Sample Business Inc.",
  created_at: new Date().toISOString(),
};

interface TemplateSelectionUIProps {
  currentTemplateId?: TemplateId;
  onTemplateSelect?: (templateId: TemplateId) => void;
}

export const TemplateSelectionUI: React.FC<TemplateSelectionUIProps> = ({
  currentTemplateId = "classic_business",
  onTemplateSelect,
}) => {
  // Validate the initial template ID and fall back to default if invalid
  const initialValidTemplateId = isValidTemplateId(currentTemplateId)
    ? currentTemplateId
    : "classic_business";
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
    initialValidTemplateId,
  );
  const [activeTab, setActiveTab] = useState<"grid" | "preview">("grid");
  const templates = getAllTemplates();

  const handleTemplateClick = (templateId: TemplateId) => {
    // Validate template ID before setting
    if (isValidTemplateId(templateId)) {
      setSelectedTemplate(templateId);
      if (onTemplateSelect) {
        onTemplateSelect(templateId);
      }
    } else {
      // Fallback to default template if invalid ID is provided
      setSelectedTemplate("classic_business");
      if (onTemplateSelect) {
        onTemplateSelect("classic_business");
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Choose Invoice Template</span>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("grid")}
            >
              Browse
            </Button>
            <Button
              variant={activeTab === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "grid" | "preview")}
        >
          <TabsList className="hidden">
            {" "}
            {/* Hidden since we're controlling via buttons */}
          </TabsList>

          <TabsContent value="grid" className="m-0 p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id
                      ? "ring-2 ring-primary border-primary"
                      : "border-gray-200"
                  }`}
                  onClick={() => handleTemplateClick(template.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    {selectedTemplate === template.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>

                  {/* Mini preview of the template */}
                  <div className="border rounded bg-gray-50 p-3 h-40 overflow-hidden">
                    <TemplateRenderer
                      templateId={template.id}
                      invoice={SAMPLE_INVOICE}
                      client={SAMPLE_CLIENT}
                      organization={SAMPLE_ORGANIZATION}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="m-0 p-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Preview:{" "}
                  {TEMPLATE_METADATA[selectedTemplate]?.name ||
                    "Selected Template"}
                </h3>
                <Button variant="outline" onClick={() => setActiveTab("grid")}>
                  Back to Selection
                </Button>
              </div>

              <div className="border rounded-lg p-4 bg-white min-h-[500px]">
                <TemplateRenderer
                  templateId={selectedTemplate}
                  invoice={SAMPLE_INVOICE}
                  client={SAMPLE_CLIENT}
                  organization={SAMPLE_ORGANIZATION}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setActiveTab("grid")}>
                  Back to Selection
                </Button>
                <Button
                  onClick={() => {
                    if (onTemplateSelect) {
                      onTemplateSelect(selectedTemplate);
                    }
                  }}
                >
                  Use This Template
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
