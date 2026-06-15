"use client";

import { getClientsByOrgId } from "@/lib/repositories/clients.repository.func";
import {
  handleAsyncOperation,
  isEmptyState,
  isError,
} from "@/lib/utils/error-handler";
import { Client, Organization } from "@/types/invoice";
import { createContext, useContext, useEffect, useState } from "react";
import { useOrganization } from "./use-organization";
import toast from "react-hot-toast";
import {
  createClientAction,
  createClientForMemberOrganizationAction,
  createClientForOrgAction,
  deleteClientAction,
  updateClientAction,
} from "@/lib/actions/client.actions";
import { useAuth } from "@clerk/nextjs";

const ClientsContext = createContext<{
  clients: Client[];
  setClients: (clients: Client[] | any[]) => any;
  // Loading state flags
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
  const [clients, setClients] = useState<Client[] | any[]>([]);
  const { selectedOrganization, isEmpty: orgIsEmpty, isLoading: orgIsLoading } = useOrganization();

  // Loading state flags
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (selectedOrganization?.id) {
      fetchClients(selectedOrganization.id);
    } else if (!orgIsLoading && (orgIsEmpty || !selectedOrganization)) {
      // Org loading complete, no org found → show empty state, not infinite loading
      setIsLoading(false);
      setIsEmpty(true);
      setIsReady(false);
    } else {
      // Still loading org
      setIsLoading(true);
    }
  }, [selectedOrganization, orgIsLoading, orgIsEmpty]);

  async function fetchClients(orgId: string) {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const result = await handleAsyncOperation(() => getClientsByOrgId(orgId));

      const clientsData = result.data || [];
      setClients(clientsData);
      setIsLoading(false);
      setIsEmpty(clientsData.length === 0);
      setIsReady(clientsData.length > 0);
      return result.data;
    } catch (error) {
      toast.error("Error fetching clients for selected organization!");
      console.error(error);
      setIsLoading(false);
      setIsEmpty(false);
      setHasError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to fetch clients",
      );
      setIsReady(false);
    }
  }

  // Client operations
  const createClient = async (clientData: Partial<Client>) => {
    if (!userId) {
      throw new Error("No owner found for creating client!");
    }

    const result = await handleAsyncOperation(() =>
      createClientAction(clientData as any),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to create client");
    }

    if (isEmptyState(result) || !result.data) {
      throw new Error("Client creation failed - no data returned");
    }

    setClients((prev) => [...prev, result.data]);
    return result.data;
  };

  // Client operations
  const createClientForOrg = async (
    clientData: Client,
    orgData: Partial<Organization>,
  ) => {
    if (!userId) {
      throw new Error("No owner found for creating client!");
    }

    const result = await handleAsyncOperation(() =>
      createClientForOrgAction(clientData, orgData),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to create client");
    }

    if (isEmptyState(result) || !result.data) {
      throw new Error("Client creation failed - no data returned");
    }

    setClients((prev) => [...prev, result.data]);
    return result.data;
  };

  const createClientByMemberOfOrg = async (
    clientData: Partial<Client>,
    selectedOrgId: string,
  ) => {
    if (!userId) {
      throw new Error("No owner found for creating client!");
    }

    const result = await handleAsyncOperation(() =>
      createClientForMemberOrganizationAction(clientData as any, selectedOrgId),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to create client");
    }

    if (isEmptyState(result) || !result.data) {
      throw new Error("Client creation failed - no data returned");
    }

    setClients((prev) => [...prev, result.data]);
    return result.data;
  };

  const updateClient = async (
    id: string,
    orgId: string,
    updates: Partial<Client>,
  ) => {
    if (!userId) {
      console.error("User not logged in!");
      throw new Error("User not logged in!");
    }

    const result = await handleAsyncOperation(() =>
      updateClientAction(id, orgId, updates),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to update client");
    }

    if (isEmptyState(result) || !result.data) {
      // Handle empty state - client might have been deleted
      setClients((prev) => prev.filter((c) => c.id !== id));
      return null; // Return null to indicate client no longer exists
    }

    // Update local state
    setClients((prev) => prev.map((c) => (c.id === id ? result.data : c)));

    return result.data;
  };

  const deleteClient = async (id: string) => {
    const result = await handleAsyncOperation(() => deleteClientAction(id));

    if (isError(result)) {
      throw new Error(result.error || "Failed to delete client");
    }

    // For empty state or successful deletion, remove from local state
    setClients((prev) => prev.filter((client) => client.id !== id));

    return;
  };

  return (
    <ClientsContext.Provider
      value={{
        clients,
        setClients,
        isLoading,
        isEmpty,
        isError: hasError,
        errorMessage,
        isReady,
        createClient,
        createClientByMemberOfOrg,
        createClientForOrg,
        updateClient,
        deleteClient,
      }}
    >
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
