"use client";

import { NoOrganizationState } from '@/components/empty-states/no-organization-state';
import { LoadingState } from '@/components/ui/state-components';
import { useOrganization } from '@/hooks/use-organization';

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const { selectedOrganization: organization, isLoading, isEmpty } = useOrganization();

  // If still loading, show a spinner
  if (isLoading) {
    return (
      <LoadingState message="Loading organization..." size="large" />
    );
  }

  // If no organization exists, show the no organization state
  if (!organization || isEmpty) {
    return <NoOrganizationState />;
  }

  // Otherwise, render the children
  return <>{children}</>;
}