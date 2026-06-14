import { createAdminClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/utils/logger';

// Define types for activity logging
export type EntityType = 'invoice' | 'expense' | 'client' | 'payment' | 'organization' | 'user';
export type Action = 'created' | 'updated' | 'deleted' | 'viewed' | 'sent' | 'paid';

export interface ActivityDetails {
  [key: string]: any;
}

export interface ActivityLogEntry {
  org_id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  action: Action;
  details?: ActivityDetails;
}

/**
 * Logs an activity to the activity_log table
 * @param logEntry - The activity log entry to insert
 */
export const logActivity = async (logEntry: ActivityLogEntry) => {
  const supabase = await createAdminClient();

  try {
    const { error } = await supabase
      .from('activity_log')
      .insert([{
        org_id: logEntry.org_id,
        // actor_user_id: logEntry.user_id,
        entity_type: logEntry.entity_type,
        entity_id: logEntry.entity_id,
        action: logEntry.action,
        details: logEntry.details || {}
      }]);

    if (error) {
      Logger.error('LOG_ACTIVITY', 'Error logging activity', error, {
        details: {
          orgId: logEntry.org_id,
          userId: logEntry.user_id,
          entityType: logEntry.entity_type,
          entityId: logEntry.entity_id,
          action: logEntry.action
        }
      });
      throw error;
    }

    Logger.info('LOG_ACTIVITY', 'Activity logged successfully', {
      details: {
        orgId: logEntry.org_id,
        userId: logEntry.user_id,
        entityType: logEntry.entity_type,
        entityId: logEntry.entity_id,
        action: logEntry.action
      }
    });
  } catch (error) {
    Logger.error('LOG_ACTIVITY', 'Unexpected error logging activity', error, {
      details: {
        orgId: logEntry.org_id,
        userId: logEntry.user_id,
        entityType: logEntry.entity_type,
        entityId: logEntry.entity_id,
        action: logEntry.action
      }
    });
    throw error;
  }
};

/**
 * Logs an activity with additional metadata
 * @param orgId - The organization ID
 * @param userId - The user ID performing the action
 * @param entityType - The type of entity being acted upon
 * @param entityId - The ID of the entity
 * @param action - The action being performed
 * @param meta - Additional metadata to store with the activity
 */
export const logActivityWithMeta = async (
  orgId: string,
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: Action,
  details?: ActivityDetails
) => {
  await logActivity({
    org_id: orgId,
    user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    details
  });
};

/**
 * Logs an invoice-related activity
 * @param orgId - The organization ID
 * @param userId - The user ID performing the action
 * @param invoiceId - The invoice ID
 * @param action - The action being performed
 * @param meta - Additional metadata
 */
export const logInvoiceActivity = async (
  orgId: string,
  userId: string,
  invoiceId: string,
  action: Action,
  details?: ActivityDetails
) => {
  await logActivity({
    org_id: orgId,
    user_id: userId,
    entity_type: 'invoice',
    entity_id: invoiceId,
    action,
    details
  });
};

/**
 * Logs an expense-related activity
 * @param orgId - The organization ID
 * @param userId - The user ID performing the action
 * @param expenseId - The expense ID
 * @param action - The action being performed
 * @param meta - Additional metadata
 */
export const logExpenseActivity = async (
  orgId: string,
  userId: string,
  expenseId: string,
  action: Action,
  details?: ActivityDetails
) => {
  await logActivity({
    org_id: orgId,
    user_id: userId,
    entity_type: 'expense',
    entity_id: expenseId,
    action,
    details
  });
};

/**
 * Logs a client-related activity
 * @param orgId - The organization ID
 * @param userId - The user ID performing the action
 * @param clientId - The client ID
 * @param action - The action being performed
 * @param meta - Additional metadata
 */
export const logClientActivity = async (
  orgId: string,
  userId: string,
  clientId: string,
  action: Action,
  details?: ActivityDetails
) => {
  await logActivity({
    org_id: orgId,
    user_id: userId,
    entity_type: 'client',
    entity_id: clientId,
    action,
    details
  });
};

/**
 * Logs a payment-related activity
 * @param orgId - The organization ID
 * @param userId - The user ID performing the action
 * @param paymentId - The payment ID
 * @param action - The action being performed
 * @param meta - Additional metadata
 */
export const logPaymentActivity = async (
  orgId: string,
  userId: string,
  paymentId: string,
  action: Action,
  details?: ActivityDetails
) => {
  await logActivity({
    org_id: orgId,
    user_id: userId,
    entity_type: 'payment',
    entity_id: paymentId,
    action,
    details
  });
};