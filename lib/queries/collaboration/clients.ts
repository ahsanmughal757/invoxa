"use server";

import { createAdminClient } from '@/lib/supabase/server';
import { Client } from '@/types/invoice';
import { Logger } from '@/lib/utils/logger';

// Get clients for an organization (accessible by members)
export const getClientsForOrg = async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', orgId);

  if (error) {
    Logger.error('GET_CLIENTS_FOR_ORG', 'Error fetching clients for organization', error, { orgId });
    throw error;
  }

  Logger.info('GET_CLIENTS_FOR_ORG', 'Clients fetched successfully for organization', { orgId, entityType: 'clients', details: { count: data.length } });
  return data as Client[];
}

// Create client for an organization (accessible by members)
export const createClientForOrg = async (
  clientData: Partial<Omit<Client, 'id' | 'created_at' | 'org_id'>>,
  orgId: string,
  userId: string
) => {
  if (!orgId) {
    const error = new Error("Organization ID not found");
    Logger.error('CREATE_CLIENT_FOR_ORG', 'Organization ID not found', error, { orgId });
    throw error;
  }

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('clients')
    .insert([{ ...clientData, org_id: orgId }])
    .select()
    .single();

  if (error) {
    Logger.error('CREATE_CLIENT_FOR_ORG', 'Error creating client', error, { orgId });
    throw error;
  }

  Logger.info('CREATE_CLIENT_FOR_ORG', 'Client created successfully for organization', {
    entityId: data.id,
    entityType: 'client',
    orgId,
    details: {
      name: data.name,
      email: data.email
    }
  });
  return data as Client;
};

// Update client for an organization (accessible by members)
export const updateClientForOrg = async (id: string, updates: Partial<Client>, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current client to get the org_id for validation
  const { data: currentClient, error: fetchError } = await supabase
    .from('clients')
    .select('org_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    Logger.error('FETCH_CLIENT_FOR_UPDATE', 'Error fetching client for update', fetchError, { entityId: id });
    throw fetchError;
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    Logger.error('UPDATE_CLIENT_FOR_ORG', 'Error updating client', error, { entityId: id });
    throw error;
  }

  Logger.info('UPDATE_CLIENT_FOR_ORG', 'Client updated successfully for organization', {
    entityId: id,
    entityType: 'client',
    details: { updatedFields: Object.keys(updates) }
  });
  return data as Client;
};

// Delete client for an organization (accessible by members)
export const deleteClientForOrg = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current client to get the org_id for validation
  const { data: currentClient, error: fetchError } = await supabase
    .from('clients')
    .select('org_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    Logger.error('FETCH_CLIENT_FOR_DELETE', 'Error fetching client for deletion', fetchError, { entityId: id });
    throw fetchError;
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    Logger.error('DELETE_CLIENT_FOR_ORG', 'Error deleting client', error, { entityId: id });
    throw error;
  }

  Logger.info('DELETE_CLIENT_FOR_ORG', 'Client deleted successfully from organization', { entityId: id, entityType: 'client' });
  return { success: true };
};