"use client";

import { useOrganization } from '@/hooks/use-organization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Plus, Mail, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Organization } from '@/types/invoice';

export function NoOrganizationState() {
  const { selectedOrganization: organization, memberOrganizations: organizations, switchOrganization } = useOrganization();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleCreateOrganization = async () => {
    router.push('/organization/create');
  };

  const handleSwitchToOrganization = async (orgId: string) => {
    if (!switchOrganization) return;
    
    setIsSwitching(true);
    try {
      await switchOrganization(orgId);
      toast.success("Organization switched successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization:", error);
      toast.error("Failed to switch organization");
    } finally {
      setIsSwitching(false);
    }
  };

  if (organization) {
    // If organization exists, don't show this component
    return null;
  }

  const hasOtherOrganizations = organizations && organizations.length > 0;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 p-4 rounded-full">
            <Building className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl mt-4">No Active Organization</CardTitle>
          <CardDescription>
            {hasOtherOrganizations 
              ? "You belong to other organizations. Select one to continue or create a new organization."
              : "You don't have an organization yet. Create one to start managing your invoices and clients."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            An organization is required to use Invoxa. It will contain all your invoices, clients, and settings.
          </p>

          {hasOtherOrganizations && (
            <div className="space-y-2 pt-4">
              <p className="text-sm font-medium text-gray-700">Your Organizations:</p>
              <div className="space-y-2">
                {organizations.map((org: Partial<Organization>) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{org.name}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSwitchToOrganization(org.id!)}
                      disabled={isSwitching}
                    >
                      {isSwitching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleCreateOrganization} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
          {hasOtherOrganizations && (
            <Button variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Accept Invite
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}