"use client";

import { useAuth } from "@clerk/nextjs";
import { CompanySettings } from "@/components/settings/company-settings";
import { BackButton } from "@/components/ui/back-button";
import { Organization, Company } from "@/types/invoice";
import { useOrganization } from "@/hooks/use-organization";
import { PageHeader } from "@/components/ui/page-header";

// Helper function to convert Organization to Company
const organizationToCompany = (org: Organization | null): Company | null => {
  if (!org) return null;
  return {
    id: org.id,
    name: org.name,
    email: org.branding?.email || "",
    phone: org.branding?.phone || "",
    address: org.branding?.address || "",
    website: org.branding?.website || "",
    taxId: "",
    logo: org.logo_url,
    paymentInstructions: "",
    bankDetails: org.branding?.bankDetails || undefined,
    branding: org.branding,
  };
};

// Helper function to convert Company to Organization
const companyToOrganization = (company: Company): Organization => {
  return {
    id: company.id || "",
    owner_user_id: company.owner_user_id || "",
    name: company.name,
    logo_url: company.logo,
    email: company.email,
    branding: {
      email: company.email,
      phone: company.phone,
      address: company.address,
      website: company.website,
      taxId: company.taxId,
      paymentInstructions: company.paymentInstructions,
      bankDetails: company.bankDetails,
    },
    created_at: new Date().toISOString(),
  };
};

export default function CompanySettingsPage() {
  const { userId } = useAuth();
  const {
    selectedOrganization: organization,
    updateOrganization,
    createOrganization,
  } = useOrganization();

  const cleanedCompany = organization
    ? organizationToCompany(organization)
    : null;

  const handleSaveCompany = async (companyData: Company) => {
    if (!userId) {
      throw new Error("You must be signed in to save company information");
    }

    const orgData = companyToOrganization({
      ...companyData,
      owner_user_id: userId,
    });

    if (organization) {
      await updateOrganization(orgData);
    } else {
      await createOrganization({
        ...orgData,
        owner_user_id: userId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Company Settings"
          description="Configure your company information to appear on all invoices"
        />
        <BackButton href="/settings">Back to Settings</BackButton>
      </div>
      <CompanySettings company={cleanedCompany} onSave={handleSaveCompany} />
    </div>
  );
}