"use client";

import { useClients } from '@/hooks/use-clients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NoClientStateProps {
  onClientCreated?: () => void;
}

export function NoClientState({ onClientCreated }: NoClientStateProps) {
  const { clients, createClient } = useClients();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClient = async () => {
    setIsCreating(true);
    try {
      router.push('/clients');
      onClientCreated?.();
    } finally {
      setIsCreating(false);
    }
  };

  if (clients && clients.length > 0) {
    // If clients exist, don't show this component
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-4 rounded-full">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl mt-4">No Clients</CardTitle>
          <CardDescription>
            You don't have any clients yet. Add your first client to start creating invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600">
            Clients are the recipients of your invoices. Add client details like name, email, 
            company, and billing address to streamline your invoicing process.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleCreateClient} className="w-full" disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Client
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
