"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationsForUserAction,
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
  OrganizationData,
} from "@/lib/actions/organization.actions";
import {
  getMembersForOrganizationAction,
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  MemberRole,
} from "@/lib/actions/members.actions";

export function useOrganizationsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["organizations", userId],
    queryFn: () => getOrganizationsForUserAction(),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    select: (data) => {
      if (!data.success) return [];
      return data.data || [];
    },
  });
}

export function useOrganizationMembersQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["members", orgId],
    queryFn: () => getMembersForOrganizationAction(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
    select: (data) => {
      if (!data.success) return [];
      return data.data || [];
    },
  });
}

export function useCreateOrganizationMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrganizationData) => createOrganizationAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", userId] });
    },
  });
}

export function useUpdateOrganizationMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      data,
    }: {
      orgId: string;
      data: Partial<OrganizationData>;
    }) => updateOrganizationAction(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", userId] });
    },
  });
}

export function useAddMemberMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: MemberRole;
    }) => addMemberAction(orgId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useRemoveMemberMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMemberAction(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}

export function useUpdateMemberRoleMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetUserId,
      role,
    }: {
      targetUserId: string;
      role: MemberRole;
    }) => updateMemberRoleAction(orgId, targetUserId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", orgId] });
    },
  });
}
