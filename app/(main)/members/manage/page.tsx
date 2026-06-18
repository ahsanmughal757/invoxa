"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteMemberModal } from "@/components/members/invite-member-modal";
import { RemoveMemberModal } from "@/components/members/remove-member-modal";
import { RoleIndicator } from "@/components/ui/role-indicator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  MoreVertical,
  UserX,
  Shield,
  Loader2,
  Building,
  Mail,
} from "lucide-react";
import toast from "react-hot-toast";
import { createInviteAction } from "@/lib/actions/invite.actions";
import { createInviteNotification } from "@/lib/actions/notification.actions";

type MemberRole = "owner" | "admin" | "member";

interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  profile: {
    id: string;
    clerk_user_id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export default function MembersManagementPage() {
  const { userId } = useAuth();
  const {
    selectedOrganization: organization,
    getMembers,
    addMember,
    removeMember,
    updateMemberRole,
  } = useOrganization();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isSelfRemoval, setIsSelfRemoval] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch members on mount
  useEffect(() => {
    if (organization?.id && userId) {
      loadMembers();
    }
  }, [organization?.id, userId]);

  const loadMembers = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const result = await getMembers(organization.id);

      console.log("members: ", result);
      setMembers(result.data || []);
    } catch (error) {
      console.error("Failed to load members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string, role: "admin" | "member") => {
    if (!organization?.id) {
      throw new Error("Organization not found");
    }

    setActionLoading("invite");
    try {
      // Create invite using existing invite system
      const result = await createInviteAction(organization.id, email);

      if (!result.success) {
        throw new Error(result.error || "Failed to create invite");
      }

      await createInviteNotification({
        senderId: userId!,
        recipientEmail: email,
        senderOrganizationId: organization.id,
        link: result.data?.inviteLink, // Pass the invite token to the notification
      });

      toast.success(`Invitation sent to ${email}`);

      // Note: In a full implementation, you would send the invite link via email
      // For now, we just create the invite record
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!organization?.id || !selectedMember) return;

    setActionLoading(`remove-${selectedMember.user_id}`);
    try {
      await removeMember(organization.id, selectedMember.user_id);
      toast.success(
        isSelfRemoval
          ? "Left organization successfully"
          : "Member removed successfully",
      );
      await loadMembers();
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    } finally {
      setActionLoading(null);
      setRemoveModalOpen(false);
      setSelectedMember(null);
      setIsSelfRemoval(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    if (!organization?.id) return;

    setActionLoading(`role-${memberId}`);
    try {
      await updateMemberRole(organization.id, memberId, newRole);
      toast.success("Member role updated");
      await loadMembers();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update member role");
    } finally {
      setActionLoading(null);
    }
  };

  const openRemoveModal = (member: Member, isSelf: boolean) => {
    setSelectedMember(member);
    setIsSelfRemoval(isSelf);
    setRemoveModalOpen(true);
  };

  // const currentUserMemberId = members.find(m => m.user_id === userId)?.id;

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
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentUserId = userId;
  const isOwner = members.some(
    (m) => m.user_id === currentUserId && m.role === "owner",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Members</h1>
          <p className="text-gray-600 mt-1">
            Invite team members and manage their roles
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Members
          </CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? "member" : "members"} in{" "}
            {organization.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No members yet
              </h3>
              <p className="text-gray-600 mt-2 mb-4">
                Invite your first team member to collaborate
              </p>
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.user_id === currentUserId;
                  const isLastOwner =
                    member.role === "owner" &&
                    members.filter((m) => m.role === "owner").length === 1;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {(
                                member.profile?.name ||
                                member.profile?.email ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.profile?.name || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.profile?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isSelf ? (
                          <RoleIndicator role={member.role} size="sm" />
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value: MemberRole) =>
                              handleRoleChange(member.user_id, value)
                            }
                            disabled={
                              actionLoading?.startsWith(
                                `role-${member.user_id}`,
                              ) ||
                              !isOwner ||
                              member.role === "owner"
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {isOwner && (
                                <SelectItem value="owner">Owner</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                        {actionLoading?.startsWith(
                          `role-${member.user_id}`,
                        ) && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2 inline" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading?.startsWith(
                                `remove-${member.user_id}`,
                              )}
                            >
                              {actionLoading?.startsWith(
                                `remove-${member.user_id}`,
                              ) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isSelf && isOwner && member.role !== "owner" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRoleChange(member.user_id, "admin")
                                  }
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => openRemoveModal(member, isSelf)}
                              className="text-destructive focus:text-destructive"
                              disabled={isLastOwner}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              {isSelf ? "Leave Organization" : "Remove Member"}
                            </DropdownMenuItem>
                            {isLastOwner && (
                              <p className="text-xs text-gray-500 px-2 py-1">
                                Cannot remove last owner
                              </p>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
        organizationName={organization.name}
      />

      <RemoveMemberModal
        open={removeModalOpen}
        onOpenChange={setRemoveModalOpen}
        onRemove={handleRemoveMember}
        memberName={selectedMember?.profile?.name || undefined}
        memberRole={selectedMember?.role || undefined}
        isSelf={isSelfRemoval}
        isLastOwner={
          selectedMember
            ? members.filter((m) => m.role === "owner").length === 1 &&
              selectedMember.role === "owner"
            : false
        }
      />
    </div>
  );
}
