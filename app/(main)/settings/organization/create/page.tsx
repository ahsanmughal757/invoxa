"use client";

import { useInvoiceContext } from "@/context/InvoiceContext";
import { useAuth } from "@clerk/nextjs";
import { CompanySettings } from "@/components/settings/company-settings";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Organization, Company } from "@/types/invoice";
import { useOrganization } from "@/hooks/use-organization";
import { useEffect } from "react";

export const dynamic = "force-dynamic";
// Helper function to convert Organization to Company
const organizationToCompany = (org: Organization | null): Company | null => {
  if (!org) return null;
  return {
    id: org.id,
    name: org.name,
    // email: "", // Organization doesn't have email
    // phone: "", // Organization doesn't have phone
    // address: "", // Organization doesn't have address
    // website: "", // Organization doesn't have website
    // taxId: "", // Organization doesn't have taxId
    email: org.branding?.email || "", // Organization doesn't have email
    phone: org.branding?.phone || "", // Organization doesn't have phone
    address: org.branding?.address || "", // Organization doesn't have address
    website: org.branding?.website || "", // Organization doesn't have website
    taxId: "", // Organization doesn't have taxId
    logo: org.logo_url,
    paymentInstructions: "", // Organization doesn't have this
    bankDetails: org.branding?.bankDetails || undefined, // Organization doesn't have bank details,
    branding: org.branding,
  };
};

// Helper function to convert Company to Organization
const companyToOrganization = (company: Company): Organization => {
  return {
    id: company.id || "",
    owner_user_id: company.owner_user_id || "", // This would need to be obtained from auth context
    name: company.name,
    logo_url: company.logo,
    email: company.email,
    branding: {
      // Extract relevant branding info from company data
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

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const { selectedOrganization: organization, createOrganization } =
    useOrganization();

  const cleanedCompany = organization
    ? organizationToCompany(organization)
    : null;

  useEffect(() => {
    if (userId) {
      router.refresh();
    }
  }, []);

  const handleSaveCompany = async (companyData: Company) => {
    const orgData = companyToOrganization({
      ...companyData,
      owner_user_id: userId || "",
    });

    if (userId) createOrganization(orgData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your company information to appear on all invoices
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/settings")}>
          Back to Settings
        </Button>
      </div>
      {/*<CompanySettings company={cleanedCompany} onSave={handleSaveCompany} />*/}
      <CompanySettings company={null} onSave={handleSaveCompany} />
    </div>
  );
}
