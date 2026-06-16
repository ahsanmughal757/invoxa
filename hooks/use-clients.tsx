"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { Client, Organization } from "@/types/invoice";
import { useOrganization } from "./use-organization";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import {
  useClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from "@/hooks/queries/use-clients-query";

const ClientsContext = createContext<{
  clients: Client[];
  setClients: (clients: Client[] | any[]) => any;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  createClient: (clientData: Partial<Client>) => any;
  createClientForOrg: (
    clientData: Client,
    orgData: Partial<Organization>,
  ) => Promise<any>;
  createClientByMemberOfOrg: (
    clientData: Partial<Client>,
    selectedOrgId: string,
  ) => void;
  updateClient: (id: string, orgId: string, updates: Partial<Client>) => any;
  deleteClient: (id: string) => any;
} | null>(null);

export const ClientsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const {
    selectedOrganization,
    isEmpty: orgIsEmpty,
    isLoading: orgIsLoading,
  } = useOrganization();
  const orgId = selectedOrganization?.id;

  const {
    data: clients = [],
    isLoading,
    isError,
    error,
    isFetched,
    refetch,
  } = useClientsQuery(orgId);

  const createMutation = useCreateClientMutation(orgId || "");
  const updateMutation = useUpdateClientMutation(orgId || "");
  const deleteMutation = useDeleteClientMutation(orgId || "");

  const invalidateClients = useCallback(() => {
    if (orgId) {
      queryClient.invalidateQueries({ queryKey: ["clients", orgId] });
    }
  }, [queryClient, orgId]);

  const createClient = async (clientData: Partial<Client>) => {
    if (!userId) throw new Error("No owner found for creating client!");
    const result = await createMutation.mutateAsync(clientData as any);
    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to create client");
    }
    return result.data;
  };

  const createClientForOrg = async (
    clientData: Client,
    orgData: Partial<Organization>,
  ) => {
    if (!userId) throw new Error("No owner found for creating client!");
    const { createClientForOrgAction } =
      await import("@/lib/actions/client.actions");
    const result = await createClientForOrgAction(clientData, orgData);
    if (result.success && result.data) {
      invalidateClients();
      return result.data;
    }
    throw new Error(result.error || "Failed to create client");
  };

  const createClientByMemberOfOrg = async (
    clientData: Partial<Client>,
    selectedOrgId: string,
  ) => {
    if (!userId) throw new Error("No owner found for creating client!");
    const { createClientForMemberOrganizationAction } =
      await import("@/lib/actions/client.actions");
    const result = await createClientForMemberOrganizationAction(
      clientData as any,
      selectedOrgId,
    );
    if (result.success && result.data) {
      invalidateClients();
      return result.data;
    }
    throw new Error(result.error || "Failed to create client");
  };

  const updateClient = async (
    id: string,
    orgIdParam: string,
    updates: Partial<Client>,
  ) => {
    if (!userId) throw new Error("User not logged in!");
    const result = await updateMutation.mutateAsync({
      id,
      orgId: orgIdParam,
      updates: updates as any,
    });
    if (!result.success || !result.data) {
      return null;
    }
    return result.data;
  };

  const deleteClient = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const setClients = () => {};

  const contextValue = useMemo(() => {
    const isEmptyState =
      !orgIsLoading && !orgIsEmpty && orgId
        ? isFetched && !isLoading && clients.length === 0
        : !orgIsLoading && (orgIsEmpty || !orgId);

    return {
      clients,
      setClients,
      isLoading: orgId ? isLoading : false,
      isEmpty: isEmptyState,
      isError,
      errorMessage: error?.message || null,
      isReady: isFetched && !isLoading && clients.length > 0,
      createClient,
      createClientByMemberOfOrg,
      createClientForOrg,
      updateClient,
      deleteClient,
    };
  }, [
    clients,
    isLoading,
    isError,
    error,
    isFetched,
    orgId,
    orgIsLoading,
    orgIsEmpty,
  ]);

  return (
    <ClientsContext.Provider value={contextValue}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error("useClients must be used within a ClientsProvider");
  }
  return context;
};
