"use client";

import { useAuth } from "@clerk/nextjs";
import { CompanySettings } from "@/components/settings/company-settings";
import { BackButton } from "@/components/ui/back-button";
import { Company } from "@/types/invoice";
import { useOrganization } from "@/hooks/use-organization";
import { PageHeader } from "@/components/ui/page-header";

// Helper function to convert Company to Organization
const companyToOrganization = (company: Company) => {
  return {
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
  };
};

export default function CreateOrganizationPage() {
  const { userId } = useAuth();
  const { createOrganization } = useOrganization();

  const handleSaveCompany = async (companyData: Company) => {
    if (!userId) {
      throw new Error("You must be signed in to create an organization");
    }

    const orgData = companyToOrganization({
      ...companyData,
      owner_user_id: userId,
    });

    await createOrganization(orgData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Create Organization"
          description="Set up your company information to appear on all invoices"
        />
        <BackButton href="/settings">Back to Settings</BackButton>
      </div>
      <CompanySettings company={null} onSave={handleSaveCompany} />
    </div>
  );
}