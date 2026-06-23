"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Invoice,
  InvoiceItem,
  Organization,
  Client,
  InvoiceStructure,
} from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TemplateSelector } from "./templates/template-selector";
import { TemplateId } from "./templates/template-registry";
import { usePathname } from "next/navigation";

// Zod schema for invoice item, aligned with DB
const invoiceItemSchema = z.object({
  id: z.string().optional(),
  invoice_id: z.string().optional(),
  description: z.string().min(1, { message: "Description is required" }),
  qty: z.number().min(0.01, { message: "Quantity must be positive" }),
  unit_price: z.number().min(0, { message: "Rate must be non-negative" }),
  line_total: z.number(),
});

// Zod schema for temporary client data
const temporaryClientSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  billing_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

// Zod schema for the main invoice form, aligned with DB
const invoiceSchema = z
  .object({
    client_id: z.string().optional(),
    temporary_client: temporaryClientSchema.nullable().optional(),
    currency: z.string(),
    invoice_items: z
      .array(invoiceItemSchema)
      .min(1, { message: "Invoice must have at least one item" }),
    tax_rate: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    status: z.enum([
      "draft",
      "sent",
      "paid",
      "overdue",
      "void",
      "cancelled",
      "partially_paid",
    ]),
    issue_date: z.string(),
    due_date: z.string(),
    template_id: z.string().optional(), // Added template_id field
  })
  .refine(
    (data) => {
      // Either client_id exists OR temporary_client with name exists
      return !!(
        data.client_id ||
        (data.temporary_client?.name &&
          data.temporary_client.name.trim() !== "")
      );
    },
    {
      message: "Please select a client or provide temporary client information",
      path: ["client_id"],
    },
  );

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  editing?: Boolean;
  organization?: Organization | null;
  clients: Client[];
  onSave: (invoice: InvoiceStructure, temporaryClient?: any) => Promise<void>;
  onPreview: (invoice: Partial<Invoice>, temporaryClient?: any) => void;
}

export function InvoiceForm({
  invoice,
  editing,
  organization,
  clients,
  onSave,
  onPreview,
}: InvoiceFormProps) {
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isTemporaryClient, setIsTemporaryClient] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
    (invoice?.template_id as TemplateId) || "classic_business",
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: invoice?.client_id || "",
      temporary_client: {
        name: "",
        email: "",
        phone: "",
        billing_address: {
          street: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
        },
      },
      currency: invoice?.currency || "USD",
      invoice_items: invoice?.invoice_items || [
        { description: "", qty: 1, unit_price: 0, line_total: 0 },
      ],
      tax_rate: invoice?.tax_rate || 10,
      notes: invoice?.notes || "",
      status: invoice?.status || "draft",
      issue_date: invoice?.issue_date || new Date().toISOString(),
      due_date:
        invoice?.due_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      template_id: invoice?.template_id || "classic_business", // Set default template
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invoice_items",
  });

  const watchedItems = watch("invoice_items");
  const watchedTaxRate = watch("tax_rate");
  const watchedCurrency = watch("currency");
  const watchedClientId = watch("client_id");
  const watchedTemplateId = watch("template_id");

  useEffect(() => {
    if (invoice?.additional_info?.temp_client) {
      const tc = invoice.additional_info.temp_client;
      setValue("client_id", "temporary");
      setValue("temporary_client", {
        name: tc.name || "",
        email: tc.email || "",
        phone: tc.phone || "",
        billing_address: {
          street: tc.billing_address?.street || "",
          city: tc.billing_address?.city || "",
          state: tc.billing_address?.state || "",
          postal_code: tc.billing_address?.postal_code || "",
          country: tc.billing_address?.country || "",
        },
      });
      setIsTemporaryClient(true);
    }
  }, []);

  useEffect(() => {
    if (watchedClientId === "temporary") {
      setIsTemporaryClient(true);
      setSelectedClient(null);
    } else {
      setIsTemporaryClient(false);
      const client = clients.find((c) => c.id === watchedClientId);
      setSelectedClient(client || null);

      // Clear temporary client data when selecting an existing client
      if (watchedClientId && watchedClientId !== "temporary") {
        setValue("temporary_client", {
          name: "",
          email: "",
          phone: "",
          billing_address: {
            street: "",
            city: "",
            state: "",
            postal_code: "",
            country: "",
          },
        });
      }
    }
  }, [watchedClientId, clients, setValue]);

  useEffect(() => {
    // Update selected template when form value changes
    setSelectedTemplate(
      (watchedTemplateId as TemplateId) || "classic_business",
    );
  }, [watchedTemplateId]);

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + item.qty * item.unit_price,
    0,
  );
  const taxAmount = (subtotal * (watchedTaxRate || 0)) / 100;
  const total = subtotal + taxAmount;

  const handlePreviewInvoice = () => {
    const currentData = watch();
    const processedItems: InvoiceItem[] = currentData.invoice_items.map(
      (item) => ({
        id: item.id ?? "",
        invoice_id: "",
        description: item.description,
        qty: item.qty,
        unit_price: item.unit_price,
        line_total: item.qty * item.unit_price,
      }),
    );

    // Create a complete preview invoice with all required properties
    const previewData: Invoice = {
      id: "preview",
      org_id: "preview",
      client_id: currentData.client_id || "temp",
      number: "PREVIEW",
      issue_date: currentData.issue_date,
      due_date: currentData.due_date,
      status: "draft",
      subtotal,
      tax_rate: currentData.tax_rate,
      tax_amount: taxAmount,
      total,
      currency: currentData.currency,
      notes: currentData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      invoice_items: processedItems,
      template_id: currentData.template_id, // Include template_id in preview
    };

    const temporaryClient = currentData.temporary_client?.name
      ? currentData.temporary_client
      : undefined;
    onPreview(previewData, temporaryClient);
  };

  const processSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);

    const processedItems: InvoiceItem[] = data.invoice_items.map((item) => ({
      id: item.id ?? "",
      invoice_id: item.invoice_id || "", // will be set when creating in DB
      description: item.description,
      qty: item.qty,
      unit_price: item.unit_price,
      line_total: item.qty * item.unit_price,
    }));

    // Create complete invoice data with all required properties for draft
    // Exclude temporary_client as it's not part of the database schema
    const { temporary_client, ...invoiceDataWithoutTempClient } = data;
    const fullInvoiceData: Partial<InvoiceStructure> = {
      ...invoiceDataWithoutTempClient,
      invoice_items: processedItems,
      subtotal,
      tax_amount: taxAmount,
      total,
      status: "draft", // Explicitly set status for draft
      // Let the API/backend generate: id, org_id, number, created_at, updated_at
    };

    // Pass temporary client data to parent component for handling
    const temporaryClient = data.temporary_client?.name
      ? data.temporary_client
      : undefined;

    await onSave(fullInvoiceData as InvoiceStructure, temporaryClient);
    setIsSubmitting(false);
  };
  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="client_id">Select Client *</Label>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id!} value={client.id!}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                    <SelectItem key="temporary" value="temporary">
                      + Add Temporary Client
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.client_id && (
              <p className="text-red-500 text-xs mt-1">
                {errors.client_id.message}
              </p>
            )}
          </div>

          {isTemporaryClient && (
            <>
              <div>
                <Label htmlFor="temp_client_name">Client Name *</Label>
                <Input
                  id="temp_client_name"
                  {...register("temporary_client.name")}
                  placeholder="Enter client name"
                />
                {errors.temporary_client?.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.temporary_client.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="temp_client_email">Email</Label>
                <Input
                  id="temp_client_email"
                  type="email"
                  {...register("temporary_client.email")}
                  placeholder="Enter email address"
                />
                {errors.temporary_client?.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.temporary_client.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="temp_client_phone">Phone</Label>
                <Input
                  id="temp_client_phone"
                  {...register("temporary_client.phone")}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="temp_client_street">Billing Address</Label>
                <Input
                  id="temp_client_street"
                  {...register("temporary_client.billing_address.street")}
                  placeholder="Street address"
                  className="mb-2"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input
                    {...register("temporary_client.billing_address.city")}
                    placeholder="City"
                  />
                  <Input
                    {...register("temporary_client.billing_address.state")}
                    placeholder="State"
                  />
                  <Input
                    {...register(
                      "temporary_client.billing_address.postal_code",
                    )}
                    placeholder="ZIP/Postal"
                  />
                  <Input
                    {...register("temporary_client.billing_address.country")}
                    placeholder="Country"
                  />
                </div>
              </div>
            </>
          )}

          {selectedClient && !isTemporaryClient && (
            <>
              <div className="text-sm">
                <p className="font-medium">{selectedClient.name}</p>
                <p className="text-muted-foreground">{selectedClient.email}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{selectedClient.billing_address?.street}</p>
                <p>{`${selectedClient.billing_address?.city || ""} ${selectedClient.billing_address?.state || ""}`}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice Items</CardTitle>
          <Button
            type="button"
            onClick={() =>
              append({ description: "", qty: 1, unit_price: 0, line_total: 0 })
            }
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Qty</TableHead>
                <TableHead className="w-32">Rate</TableHead>
                <TableHead className="w-32">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      {...register(`invoice_items.${index}.description`)}
                      placeholder="Item description"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      {...register(`invoice_items.${index}.qty`, {
                        valueAsNumber: true,
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      {...register(`invoice_items.${index}.unit_price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(
                      (watch(`invoice_items.${index}.qty`) || 0) *
                        (watch(`invoice_items.${index}.unit_price`) || 0),
                      watchedCurrency,
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-6 space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal, watchedCurrency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tax Rate:</span>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  {...register("tax_rate", { valueAsNumber: true })}
                  className="w-20"
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Tax Amount:</span>
              <span>{formatCurrency(taxAmount, watchedCurrency)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(total, watchedCurrency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Template Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="template_id"
            control={control}
            render={({ field }) => (
              <TemplateSelector
                currentTemplateId={
                  (field.value as TemplateId) || "classic_business"
                }
                onTemplateChange={(templateId) => {
                  field.onChange(templateId);
                  setSelectedTemplate(templateId);
                }}
              />
            )}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePreviewInvoice}
          className="flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {editing ? "Save Edits" : "Save Draft"}
        </Button>
      </div>
    </form>
  );
}
