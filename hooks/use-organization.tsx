"use client";

import { getClientsByOrgId } from "@/lib/repositories/clients.repository.func";
import {
  handleAsyncOperation,
  isEmptyState,
  isError,
} from "@/lib/utils/error-handler";
import {
  Client,
  PaymentRecord,
  Organization,
  OrganizationMember,
} from "@/types/invoice";
import { createContext, useContext, useEffect, useState } from "react";
import { useSelectedOrganization } from "./use-selected-org";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useInvoices } from "./use-invoices";
import { getPaymentsByOrgId } from "@/lib/services/payment.service.func";
import { getPaymentsByInvoiceIds } from "@/lib/queries/payments";
import {
  createOrganizationAction,
  deleteOrganizationAction,
  getOrganizationAction,
  getOrganizationsForUserAction,
  OrganizationData,
  switchActiveOrganizationAction,
  updateOrganizationAction,
} from "@/lib/actions/organization.actions";
import {
  addMemberAction,
  getMembersForOrganizationAction,
  leaveOrganizationAction,
  removeMemberAction,
  transferOwnershipAction,
  updateMemberRoleAction,
} from "@/lib/actions/members.actions";
import { getMemberAssociatedOrganization } from "@/lib/queries/organizations";

const OrganizationContext = createContext<{
  organizations: Organization[];
  memberOrganizations: Partial<Organization>[] | any;
  setMemberOrganizations: (orgs: Partial<Organization>[] | any) => void;
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
  members: OrganizationMember[];
  setOrganizations: (organizations: [] | []) => void;
  setMembers: (members: OrganizationMember[]) => void;
  // Loading state flags
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  addMember: (
    orgId: string,
    targetUserId: string,
    role: "owner" | "admin" | "member",
  ) => any;
  removeMember: (orgId: string, targetUserId: string) => any;
  updateMemberRole: (
    orgId: string,
    targetUserId: string,
    newRole: "owner" | "admin" | "member",
  ) => any;
  leaveOrganization: (orgId: string) => any;
  transferOwnership: (orgId: string, newOwnerId: string) => any;
  switchOrganization: (orgId: string | null) => any;
  createOrganization: (orgData: Partial<Omit<Organization, "id">>) => any;
  updateOrganization: (orgData: Partial<Organization>) => any;
  deleteOrganization: (orgId: string) => any;
  getMembers: (orgId: string) => any;
} | null>(null);

export const OrganizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId, orgId } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[] | []>([]);
  const [members, setMembers] = useState<OrganizationMember[] | []>([]);
  const [memberOrganizations, setMemberOrganizations] = useState<
    Partial<Organization>[] | any
  >([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  // Loading state flags
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Fetch clients from the server when the provider mounts

    // if (invoices && invoices.length > 0) {
    //   const invoiceIds = invoices.map((inv) => inv.id);
    //   fetchOrganizations(invoiceIds);
    // }
    (async () => {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      try {
        const orgs = await getOrganizations();

        // If user is owner of any organization, set the first one as selected by default
        if (orgs && orgs.length > 0) {
          setSelectedOrganization(orgs[0]);
          setOrganizations(orgs);
          setIsLoading(false);
          setIsEmpty(false);
          setIsReady(true);
        } else if (userId) {
          // If not owner then fetch member organizations
          const userMemberOrganizationData =
            await getMemberAssociatedOrganization(userId);

          if (userMemberOrganizationData && userMemberOrganizationData.length > 0) {
            setMemberOrganizations(userMemberOrganizationData);
            setIsLoading(false);
            setIsEmpty(false);
            setIsReady(true);
          } else {
            setIsLoading(false);
            setIsEmpty(true);
            setIsReady(false);
          }
        } else {
          setIsLoading(false);
          setIsEmpty(true);
          setIsReady(false);
        }
      } catch (error) {
        console.error("Error loading organizations:", error);
        setIsLoading(false);
        setIsEmpty(false);
        setHasError(true);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load organizations");
        setIsReady(false);
      }
    })();
  }, [userId]);

  async function getOrganizations() {
    try {
      const result = await getOrganizationsForUserAction();

      if (result.success && result.data) {
        return result.data;
      }
    } catch (error) {
      toast.error("Error fetching Organizations");
      console.error(error);
    }
  }

  const createOrganization = async (
    orgData: Partial<Omit<Organization, "id">>,
  ) => {
    // console.log("orgId: ", orgId);
    console.log("orgData---------:> ", orgData);
    // Ensure required fields are present
    const validatedOrgData: OrganizationData = {
      name: "name" in orgData && orgData.name ? (orgData.name as string) : "",
      email:
        "email" in orgData && orgData.email ? (orgData.email as string) : "",
      phone: "phone" in orgData ? (orgData.phone as string) : undefined,
      address: "address" in orgData ? (orgData.address as string) : undefined,
      city: "city" in orgData ? (orgData.city as string) : undefined,
      state: "state" in orgData ? (orgData.state as string) : undefined,
      zip_code:
        "zip_code" in orgData ? (orgData.zip_code as string) : undefined,
      country: "country" in orgData ? (orgData.country as string) : undefined,
      tax_id: "tax_id" in orgData ? (orgData.tax_id as string) : undefined,
      logo_url:
        "logo_url" in orgData ? (orgData.logo_url as string) : undefined,
      branding: "branding" in orgData ? (orgData.branding as any) : undefined,
    };

    const result = await handleAsyncOperation(() =>
      createOrganizationAction(validatedOrgData),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to create organization");
    }

    if (isEmptyState(result) || !result.data) {
      throw new Error("Organization creation failed - no data returned");
    }

    if (result.data) {
      setSelectedOrganization(result.data as Organization);
    }

    return result.data;
  };

  // Organization operations
  const updateOrganization = async (orgData: Partial<Organization>) => {
    if (!orgId) throw new Error("Organization ID not found");

    const result = await handleAsyncOperation(() =>
      updateOrganizationAction(orgId, orgData),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to update organization");
    }

    if (isEmptyState(result) || !result.data) {
      // For empty state, we might want to handle differently
      // In this case, we'll return null to indicate no organization was found
      setSelectedOrganization(null);
      return null;
    }

    if (result.data) {
      setSelectedOrganization(result.data as Organization);
    }
    return result.data as Organization;
  };

  const switchOrganization = async (orgId: string | null) => {
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const result = await handleAsyncOperation(() =>
      switchActiveOrganizationAction(orgId),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to switch organization");
    }

    if (result.data) {
      // setActiveOrganizationId(orgId);
      // Reload organization data after switching
      const orgResult = await handleAsyncOperation(() =>
        getOrganizationAction(),
      );
      if (!isError(orgResult) && orgResult.data) {
        setSelectedOrganization(orgResult.data || null);
      }
    }

    return result.data;
  };

  // Member management operations
  const getMembers = async (orgId: string) => {
    if (!userId || !orgId) {
      throw new Error("User and organization ID are required");
    }

    const result = await getMembersForOrganizationAction(orgId);

    if (!result.success) {
      throw new Error(result.error || "Failed to fetch members");
    }

    const memberData = Array.isArray(result.data) ? result.data : [];
    setMembers(memberData);
    return memberData;
  };

  const addMember = async (
    orgId: string,
    targetUserId: string,
    role: "owner" | "admin" | "member" = "member",
  ) => {
    if (!userId || !orgId) {
      throw new Error("User and organization ID are required");
    }

    const result = await handleAsyncOperation(() =>
      addMemberAction(orgId, targetUserId, role),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to add member");
    }

    if (result.data) {
      // Refresh members list
      await getMembers(orgId);
    }

    return result.data;
  };

  const removeMember = async (orgId: string, targetUserId: string) => {
    if (!userId || !orgId) {
      throw new Error("User and organization ID are required");
    }

    const result = await handleAsyncOperation(() =>
      removeMemberAction(orgId, targetUserId),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to remove member");
    }

    if (result.data) {
      // Refresh members list
      await getMembers(orgId);
    }

    return result.data;
  };

  const updateMemberRole = async (
    orgId: string,
    targetUserId: string,
    newRole: "owner" | "admin" | "member",
  ) => {
    if (!userId || !orgId) {
      throw new Error("User and organization ID are required");
    }

    const result = await handleAsyncOperation(() =>
      updateMemberRoleAction(orgId, targetUserId, newRole),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to update member role");
    }

    if (result.data) {
      // Refresh members list
      await getMembers(orgId);
    }

    return result.data;
  };

  const leaveOrganization = async (orgId: string) => {
    if (!userId || !orgId) {
      throw new Error("User and organization ID are required");
    }

    const result = await handleAsyncOperation(() =>
      leaveOrganizationAction(orgId),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to leave organization");
    }

    if (result.data) {
      // Refresh organizations list
      await getOrganizations();
    }

    return result.data;
  };

  const transferOwnership = async (orgId: string, newOwnerId: string) => {
    if (!userId || !orgId) {
      throw new Error("User and organization ID are required");
    }

    const result = await handleAsyncOperation(() =>
      transferOwnershipAction(orgId, newOwnerId),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to transfer ownership");
    }

    if (result.data) {
      // Refresh organizations and members lists
      await getOrganizations();
      await getMembers(orgId);
    }

    return result.data;
  };

  const deleteOrganization = async (orgId: string) => {
    if (!orgId || !userId) {
      throw new Error("User and organization ID are required");
    }

    const result = await handleAsyncOperation(() =>
      deleteOrganizationAction(orgId),
    );

    if (isError(result)) {
      throw new Error(result.error || "Error deleting the organization");
    }

    if (result.data) {
      // Refresh organizations and members lists
      await getOrganizations();
      await getMembers(orgId);
    }

    return result.data;
  };

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        memberOrganizations,
        setMemberOrganizations,
        selectedOrganization,
        setSelectedOrganization,
        members,
        setOrganizations,
        setMembers,
        isLoading,
        isEmpty,
        isError: hasError,
        errorMessage,
        isReady,
        getMembers,
        addMember,
        removeMember,
        updateMemberRole,
        leaveOrganization,
        transferOwnership,
        switchOrganization,
        createOrganization,
        updateOrganization,
        deleteOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }

  return context;
};
