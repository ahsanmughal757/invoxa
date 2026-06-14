"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOrganization } from "@/hooks/use-organization";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Save,
  LogOut,
  ArrowRightLeft,
  Loader2,
  AlertTriangle,
  Filter,
  Pen,
  Undo2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { OrganizationList } from "@/components/organization/organization-list";
import Link from "next/link";

export default function OrganizationSettingsPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const {
    selectedOrganization: organization,
    // memberOrganizations: organizations,
    organizations,
    updateOrganization,
    leaveOrganization,
    transferOwnership,
    deleteOrganization,
    getMembers,
    switchOrganization: switchOrganizationFn,
  } = useOrganization();

  const [name, setName] = useState(organization?.name || "");
  const [branding, setBranding] = useState({
    email: "",
    phone: "",
    taxId: "",
    address: "",
    website: "",
  });
  const [bankDetails, setBankDetails] = useState({
    iban: "",
    swift: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
  });

  const [editOrg, setEditOrg] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("none");
  // const [orgData, setOrgData] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setIsSaving(true);
    try {
      await updateOrganization({ ...organization, name });
      toast.success("Organization updated successfully");
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!organization) return;

    setIsLeaving(true);
    try {
      await leaveOrganization(organization.id!);
      toast.success("Left organization successfully");
      await switchOrganizationFn(null);
      router.push("/organization/create");
    } catch (error) {
      console.error("Failed to leave organization:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to leave organization",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!organization || !selectedNewOwner) return;

    setIsTransferring(true);
    try {
      await transferOwnership(organization.id!, selectedNewOwner);
      toast.success("Ownership transferred successfully");
      setTransferModalOpen(false);
      setSelectedNewOwner("");
    } catch (error) {
      console.error("Failed to transfer ownership:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to transfer ownership",
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    try {
      await deleteOrganization(orgId);

      return toast.success("Organization Deleted successfully!");
    } catch (error) {
      console.error("Failed to delete organization:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete organization. An Error Occured.",
      );
    }
  };

  const openTransferModal = async () => {
    if (!organization?.id) return;

    // Load members to show in transfer modal
    await getMembers(organization.id);
    setTransferModalOpen(true);
  };

  const onSelectOrganization = (orgId: string) => {
    setSelectedOrg(orgId);
  };

  const filteredOrganizations =
    selectedOrg === "none"
      ? organizations
      : organizations.filter((org) => org.id === selectedOrg);

  const orgData = organizations.find((org) => org.id === selectedOrg);

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">
            No Organization
          </h2>
          <p className="text-gray-600 mt-2">
            Please select or create an organization first.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/organization/create")}
          >
            Create Organization
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = organization.owner_clerk_id === userId;
  // const otherMembers = organizations?.filter(o => o.id !== organization.id) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Organization Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your organization profile and membership
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => router.push("organization/create")}>
          <Plus size={"h-4 w-4 mr-2"} />
          Create New
        </Button>
      </div>

      {/* Your Organization List */}
      <OrganizationList
        organizations={organizations}
        isLoading={false}
        isEmpty={organizations.length === 0}
        isError={false}
        errorMessage={null}
        isReady={true}
        onDelete={handleDeleteOrganization}
      />

      {/* Selected Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Profile
          </CardTitle>
          <CardDescription>
            Update your organization information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-start">
            <div>
              <Label className="mb-2">Select Organization</Label>
              <Select value={selectedOrg} onValueChange={onSelectOrganization}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id || ""}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant={!editOrg ? "destructive" : "default"}
              onClick={() => {
                setEditOrg(true);
                if (editOrg) setEditOrg(false);
              }}
            >
              {editOrg ? (
                <>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo Changes
                </>
              ) : (
                <>
                  <Pen className="h-4 w-4 mr-2" />
                  Edit Organization
                </>
              )}
            </Button>
          </div>

          <form onSubmit={handleSave}>
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  disabled={!editOrg}
                  value={orgData?.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Organization Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Organization ID</Label>
                <Input value={orgData?.id || ""} disabled readOnly />
                <p className="text-xs text-gray-500">
                  This is your unique organization identifier
                </p>
              </div>
              <div className="space-y-2">
                <Label>Branding Email</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.email}
                  onChange={(e) =>
                    setBranding({ ...branding, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Branding Phone</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.phone}
                  onChange={(e) =>
                    setBranding({ ...branding, phone: e.target.value })
                  }
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Branding Tax ID</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.taxId}
                  onChange={(e) =>
                    setBranding({ ...branding, taxId: e.target.value })
                  }
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Branding Address</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.address}
                  onChange={(e) =>
                    setBranding({ ...branding, address: e.target.value })
                  }
                  placeholder="123 Main St, City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label>Branding Website</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.website}
                  onChange={(e) =>
                    setBranding({ ...branding, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank IBAN</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.bankDetails?.iban}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, iban: e.target.value })
                  }
                  placeholder="IBAN"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank SWIFT</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.bankDetails?.swift}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, swift: e.target.value })
                  }
                  placeholder="SWIFT/BIC"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.bankDetails?.bankName}
                  onChange={(e) =>
                    setBankDetails({ ...bankDetails, bankName: e.target.value })
                  }
                  placeholder="Bank Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Account Number</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.bankDetails?.accountNumber}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      accountNumber: e.target.value,
                    })
                  }
                  placeholder="Account Number"
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Routing Number</Label>
                <Input
                  disabled={!editOrg}
                  value={orgData?.branding?.bankDetails?.routingNumber}
                  onChange={(e) =>
                    setBankDetails({
                      ...bankDetails,
                      routingNumber: e.target.value,
                    })
                  }
                  placeholder="Routing Number"
                />
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </>
          </form>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Ownership Zone
            </CardTitle>
            <CardDescription>
              As the owner, you can transfer ownership to another member
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Transfer ownership to another member. This will make them the new
              owner and you will become a regular member.
            </p>
            <Button variant="outline" onClick={openTransferModal}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer Ownership
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Membership Zone
            </CardTitle>
            <CardDescription>Leave this organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              You will lose access to all invoices, clients, and organization
              data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Organization
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transfer Ownership Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Ownership
            </DialogTitle>
            <DialogDescription>
              Select a member to transfer ownership to. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-owner">New Owner</Label>
              <Select
                value={selectedNewOwner}
                onValueChange={setSelectedNewOwner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {/* Members would be loaded here - using members from context */}
                  <SelectItem value="member-1">John Doe</SelectItem>
                  <SelectItem value="member-2">Jane Smith</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                You will become a regular member after transfer
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferModalOpen(false);
                setSelectedNewOwner("");
              }}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTransfer}
              disabled={!selectedNewOwner || isTransferring}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
