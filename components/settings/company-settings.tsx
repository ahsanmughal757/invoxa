"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Company } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Building, Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Zod schema for validation
const companySchema = z.object({
  name: z.string().min(1, { message: "Company name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  address: z.string().min(1, { message: "Business address is required" }),
  website: z
    .string()
    .url({ message: "Invalid URL" })
    .optional()
    .or(z.literal("")),
  taxId: z.string().optional(),
  logo: z.string().optional(),
  paymentInstructions: z.string().optional(),
  bankDetails: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      routingNumber: z.string().optional(),
      iban: z.string().optional(),
      swift: z.string().optional(),
    })
    .optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanySettingsProps {
  company: Company | null;
  onSave: (company: Company) => Promise<void>;
}

export function CompanySettings({ company, onSave }: CompanySettingsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      address: "",
      email: company?.branding?.email || undefined || "",
      phone: "",
      logo: "",
      taxId: "",
      website: "",
      bankDetails: {
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        iban: "",
        swift: "",
      },
      paymentInstructions: "",
      ...(company || {}),
    },
  });

  const [showBankDetails, setShowBankDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch for logo changes to update preview
  const logoValue = watch("logo");
  const [logoPreview, setLogoPreview] = useState<string>(logoValue || "");
  useEffect(() => {
    setLogoPreview(logoValue || "");
  }, [logoValue]);

  const handleFormSubmit = async (data: CompanyFormData) => {
    // Restructure the data to match the Company interface

    const companyData: Company = {
      ...data,
      bankDetails: data.bankDetails,
      email: data.email,
    };

    setIsSubmitting(true);
    try {
      await onSave(companyData);

      toast.success("Company information saved successfully");
      reset(); // Reset form after saving
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save company information. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setValue("logo", result, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setValue("logo", "", { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <img
                            src={logoPreview}
                            alt="Company Logo"
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
                          Upload your company logo
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
                    Your logo will appear on all invoices and documents.
                    Recommended size: 200x80 pixels.
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  {...register("name")}
                  placeholder="Your Company Name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="companyEmail">Email Address *</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  {...register("email")}
                  placeholder="company@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input
                  id="companyPhone"
                  {...register("phone")}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://yourcompany.com"
                />
                {errors.website && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.website.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="taxId">Tax ID / Business Registration</Label>
                <Input
                  id="taxId"
                  {...register("taxId")}
                  placeholder="Tax identification number"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="companyAddress">Business Address *</Label>
              <Textarea
                id="companyAddress"
                {...register("address")}
                placeholder="Street Address&#10;City, State, ZIP Code&#10;Country"
                rows={4}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Payment Instructions */}
            <div>
              <Label htmlFor="paymentInstructions">Payment Instructions</Label>
              <Textarea
                id="paymentInstructions"
                {...register("paymentInstructions")}
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
                {showBankDetails ? "Hide" : "Show"} Bank Details
              </Button>
            </div>
          </CardHeader>
          {showBankDetails && (
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Add your banking information to include payment details on
                  invoices.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      {...register("bankDetails.bankName")}
                      placeholder="Your Bank Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      {...register("bankDetails.accountNumber")}
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      {...register("bankDetails.routingNumber")}
                      placeholder="Routing number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN (International)</Label>
                    <Input
                      id="iban"
                      {...register("bankDetails.iban")}
                      placeholder="International Bank Account Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="swift">SWIFT Code</Label>
                    <Input
                      id="swift"
                      {...register("bankDetails.swift")}
                      placeholder="SWIFT/BIC code"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSubmitting ? "Saving..." : "Save Company Information"}
        </Button>
      </form>
    </div>
  );
}
