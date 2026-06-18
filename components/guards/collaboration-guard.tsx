"use client";

import { useOrganization } from "@/hooks/use-organization";
import { LoadingState } from "@/components/ui/state-components";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CollaborationGuardProps {
  children: React.ReactNode;
  orgId: string;
}

export function CollaborationGuard({ children, orgId }: CollaborationGuardProps) {
  const { organizations, memberOrganizations, isLoading } = useOrganization();
  const router = useRouter();

  if (isLoading) {
    return <LoadingState message="Verifying access..." size="large" />;
  }

  const isOwner = organizations.some((org: any) => org.id === orgId);
  const isMember = memberOrganizations.some((m: any) => m.org_id === orgId);

  if (!isOwner && !isMember) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <ShieldAlert className="h-12 w-12 mx-auto text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">
              You do not have access to this organization&apos;s collaboration space.
            </p>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
