"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllClientsAction,
  createClientAction,
  updateClientAction,
  deleteClientAction,
  ClientData,
} from "@/lib/actions/client.actions";
import { Client } from "@/types/invoice";

export function useClientsQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["clients", orgId],
    queryFn: () => getAllClientsAction(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
    select: (data) => {
      if (!data.success) return [];
      return data.data || [];
    },
  });
}

export function useCreateClientMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientData) => createClientAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", orgId] });
    },
  });
}

export function useUpdateClientMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      orgId: string;
      updates: Partial<ClientData>;
    }) => updateClientAction(id, orgId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", orgId] });
    },
  });
}

export function useDeleteClientMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClientAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", orgId] });
    },
  });
}
