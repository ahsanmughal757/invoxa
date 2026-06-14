"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { OrganizationSettings } from "@/components/settings/organization-settings";
import { useOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import { Organization } from "@/types/invoice";
import toast from "react-hot-toast";

import { getOrganizationByOwnerId } from "@/lib/queries/organizations";
import { useAuth } from "@clerk/nextjs";

export default function OrganizationEditPage() {
  const { userId } = useAuth();

  const {
    selectedOrganization: organization,
    updateOrganization,
  } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();


  // const fetchOrganization = async () => { 
  //   try {
  //     const fetchedOrg = await getOrganizationByOwnerId(userId);
  //     console.log("Fetched organization -->:", fetchedOrg);
  //     if (fetchedOrg) {

  //       // updateOrganization(fetchedOrg);
  //     } else {
  //       throw new Error('No organization found');
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }


  // useEffect(() => {
  //   (async () => {
  //     await fetchOrganization();
  //   })()
  // }, [userId])

  const handleSave = async (data: Partial<Organization>) => {
    if (!organization?.id) {
      toast.error("Organization ID is missing");
      return;
    }

    setIsLoading(true);
    try {
      // Call the actual updateOrganization function
      await updateOrganization({ ...data, id: organization.id });
      toast.success("Organization details updated successfully!");
      router.push("/settings/company"); // Navigate back to company settings
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading while hook is loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Organization
            </h1>
            <p className="text-gray-600 mt-1">
              Update your organization information
            </p>
          </div>
          <Button variant="outline" onClick={handleCancel} disabled>
            Cancel
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <p>Loading organization details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Edit Organization
          </h1>
          <p className="text-gray-600 mt-1">
            Update your organization information
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      <OrganizationSettings
        organization={organization}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={isLoading}
      />
    </div>
  );
}
