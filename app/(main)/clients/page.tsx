"use client";

import toast from "react-hot-toast";
import {
  ClientFormData,
  ClientManagement,
} from "@/components/clients/client-management";
import { FEATURES } from "@/hooks/use-subscription-access";
import { SubscriptionGuard } from "@/components/subscription/subscription-guard";
import { Client } from "@/types/invoice";
import { Users } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useOrganization } from "@/hooks/use-organization";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";
import { NoOrganizationState } from "@/components/empty-states/no-organization-state";

export default function ClientsPage() {
  // const { organization } = useInvoices();
  const { selectedOrganization: organization, isEmpty: orgIsEmpty } =
    useOrganization();
  const {
    clients,
    updateClient,
    deleteClient,
    createClientForOrg,
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
  } = useClients();
  // Wrap functions to match ClientManagement component's expected prop types
  const handleCreateClient = async (clientFormData: ClientFormData) => {
    // await createClientByMemberOfOrg(client, selectedOrganization?.id || "");
    if (!organization?.id) {
      toast.error(
        "No organization to create the client for. Create an Organization first.",
      );
      return;
    }

    const cleanedClient: Client = {
      ...clientFormData,
      org_id: organization.id,
    };
    await createClientForOrg(cleanedClient, organization);
    return Promise.resolve();
  };

  const handleUpdateClient = async (
    id: string,
    orgId: string,
    updates: Partial<Client>,
  ) => {
    await updateClient(id, orgId, updates);
    // Return void to match expected prop  type
    return Promise.resolve();
  };

  // No Organization State
  if (orgIsEmpty) {
    return <NoOrganizationState />;
  }

  // Loading State
  if (isLoading) {
    return <LoadingState message="Loading your clients..." size="large" />;
  }

  // Error State
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Clients"
        description={
          errorMessage ||
          "There was an issue retrieving your clients. Please try again later."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <SubscriptionGuard feature={FEATURES.CLIENT_MANAGEMENT}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-blue-600" />
                Organization Clients
              </h1>
              <p className="text-gray-600 mt-1">
                All clients belonging to{" "}
                {organization?.name || "your organization"}
              </p>
            </div>
          </div>

          <ClientManagement
            clients={[]}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={deleteClient}
          />
        </div>
      </SubscriptionGuard>
    );
  }

  // Ready State
  if (isReady) {
    return (
      <SubscriptionGuard feature={FEATURES.CLIENT_MANAGEMENT}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-blue-600" />
                Organization Clients
              </h1>
              <p className="text-gray-600 mt-1">
                All clients belonging to{" "}
                {organization?.name || "your organization"}
              </p>
            </div>
          </div>

          <ClientManagement
            clients={clients || []}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={deleteClient}
          />
        </div>
      </SubscriptionGuard>
    );
  }

  // Fallback for any other state
  return <LoadingState message="Preparing clients..." size="large" />;
}
