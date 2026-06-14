'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Organization } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Building, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Define the branding schema
const brandingSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  taxId: z.string().optional(),
  paymentInstructions: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    iban: z.string().optional(),
    swift: z.string().optional(),
  }).optional(),
}).optional();

// Zod schema for validation
const organizationSchema = z.object({
  name: z.string().min(1, { message: "Organization name is required" }),
  logo_url: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  branding: brandingSchema,
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface OrganizationSettingsProps {
  organization: Organization | null;
  onSave: (data: Partial<Organization>) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Helper function to sanitize organization data for form
const sanitizeOrganizationForForm = (org: Organization | null): Partial<OrganizationFormData> => {
  if (!org) return {};

  // Create a clean object with only serializable properties
  return {
    name: org.name || '',
    logo_url: org.logo_url || '',
    branding: org.branding ? {
      email: org.branding.email || '',
      phone: org.branding.phone || '',
      address: org.branding.address || '',
      website: org.branding.website || '',
      taxId: org.branding.taxId || '',
      paymentInstructions: org.branding.paymentInstructions || '',
      bankDetails: org.branding.bankDetails ? {
        bankName: org.branding.bankDetails?.bankName || '',
        accountNumber: org.branding.bankDetails?.accountNumber || '',
        routingNumber: org.branding.bankDetails?.routingNumber || '',
        iban: org.branding.bankDetails?.iban || '',
        swift: org.branding.bankDetails?.swift || '',
      } : {
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        iban: '',
        swift: ''
      }
    } : {
      email: '',
      phone: '',
      address: '',
      website: '',
      taxId: '',
      paymentInstructions: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        iban: '',
        swift: ''
      }
    }
  };
};

export function OrganizationSettings({ organization, onSave, onCancel, loading = false }: OrganizationSettingsProps) {
  const sanitizedOrg = sanitizeOrganizationForForm(organization);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, setError, getValues } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      logo_url: '',
      branding: {
        email: '',
        phone: '',
        address: '',
        website: '',
        taxId: '',
        paymentInstructions: '',
        bankDetails: {
          bankName: '',
          accountNumber: '',
          routingNumber: '',
          iban: '',
          swift: ''
        }
      },
      ...sanitizedOrg
    }
  });

  // Watch for logo changes to update preview
  const logoValue = watch("logo_url");
  const [logoPreview, setLogoPreview] = useState<string>(logoValue || '');
  useEffect(() => {
    setLogoPreview(logoValue || '');
  }, [logoValue]);

  const [showBankDetails, setShowBankDetails] = useState(false);

  const handleFormSubmit = (data: OrganizationFormData) => {
    // Restructure the data to match the Organization interface
    const organizationData: Partial<Organization> = {
      name: data.name,
      logo_url: data.logo_url || undefined,
      branding: data.branding || undefined,
    };

    try {
      onSave(organizationData);
      toast.success("Organization details saved successfully");
    } catch (error) {
      console.error("Error saving organization data: ", error);
      toast.error("Failed to save organization details");
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("logo_url", { message: "Please select an image file" });
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setValue("logo_url", result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setValue("logo_url", "", { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Organization Information
          </CardTitle>
          <CardDescription>Update your organization information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {logoPreview ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={logoPreview}
                          alt="Organization Logo"
                          className="max-h-24 max-w-48 object-contain mx-auto"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <div className="text-sm text-gray-600">
                        Upload your organization logo
                      </div>
                      <div className="text-xs text-gray-500">
                        PNG, JPG, SVG up to 2MB
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Your logo will appear on all invoices and documents. Recommended size: 200x80 pixels.
                </div>
                {errors.logo_url && <p className="text-red-500 text-xs mt-1">{errors.logo_url.message}</p>}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                {...register("name")}
                placeholder="Your Organization Name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                {...register("branding.email")}
                placeholder="organization@example.com"
              />
              {errors.branding?.email && <p className="text-red-500 text-xs mt-1">{errors.branding.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("branding.phone")}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register("branding.website")}
                placeholder="https://yourorganization.com"
              />
              {errors.branding?.website && <p className="text-red-500 text-xs mt-1">{errors.branding.website.message}</p>}
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID / Business Registration</Label>
              <Input
                id="taxId"
                {...register("branding.taxId")}
                placeholder="Tax identification number"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              {...register("branding.address")}
              placeholder="Street Address&#10;City, State, ZIP Code&#10;Country"
              rows={4}
            />
          </div>

          {/* Payment Instructions */}
          <div>
            <Label htmlFor="paymentInstructions">Payment Instructions</Label>
            <Textarea
              id="paymentInstructions"
              {...register("branding.paymentInstructions")}
              placeholder="Please include invoice number in payment reference.&#10;Payment is due within 30 days of invoice date."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Banking Information
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBankDetails(!showBankDetails)}
            >
              {showBankDetails ? 'Hide' : 'Show'} Bank Details
            </Button>
          </div>
        </CardHeader>
        {showBankDetails && (
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Add your banking information to include payment details on invoices.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    {...register("branding.bankDetails.bankName")}
                    placeholder="Your Bank Name"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    {...register("branding.bankDetails.accountNumber")}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    {...register("branding.bankDetails.routingNumber")}
                    placeholder="Routing number"
                  />
                </div>
                <div>
                  <Label htmlFor="iban">IBAN (International)</Label>
                  <Input
                    id="iban"
                    {...register("branding.bankDetails.iban")}
                    placeholder="International Bank Account Number"
                  />
                </div>
                <div>
                  <Label htmlFor="swift">SWIFT Code</Label>
                  <Input
                    id="swift"
                    {...register("branding.bankDetails.swift")}
                    placeholder="SWIFT/BIC code"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}