"use client";

import { useState } from "react";
import { useOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import { Building, ChevronDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { Organization } from "@/types/invoice";

export function OrganizationSwitcher() {
  const { selectedOrganization: organization, memberOrganizations: organizations, switchOrganization } = useOrganization();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (orgId: string | null) => {
    if (orgId === organization?.id) return;

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

  const handleCreateNew = () => {
    router.push("/organization/create");
  };

  const currentOrg = organization;
  const hasOrganizations = organizations && organizations.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-[200px] justify-between"
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 truncate">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="truncate">
              {currentOrg?.name || "No Organization"}
            </span>
          </div>
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        {hasOrganizations ? (
          <>
            {organizations.map((org: Partial<Organization>) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitch(org.id || null)}
                disabled={isSwitching || org.id === currentOrg?.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{org.name}</span>
                </div>
                {org.id === currentOrg?.id && (
                  <Badge variant="secondary" className="ml-2">
                    Current
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Organization
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Organization
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
