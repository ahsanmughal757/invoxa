"use client";

import { useClients } from '@/hooks/use-clients';
import { NoClientState } from '@/components/empty-states/no-client-state';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ClientGuardProps {
  children: React.ReactNode;
}

export function ClientGuard({ children }: ClientGuardProps) {
  const { clients } = useClients();

  // If still loading, show a spinner
  if (!clients) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // If no clients exist, show the no client state
  if (clients.length === 0) {
    return <NoClientState />;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
