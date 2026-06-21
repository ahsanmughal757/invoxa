import { createAdminClient } from '@/lib/supabase/server';
import { Logger } from '@/lib/utils/logger';

export type EntityType = 'invoice' | 'expense' | 'client' | 'payment' | 'organization' | 'user';
export type Action = 'created' | 'updated' | 'deleted' | 'viewed' | 'sent' | 'paid';

export interface ActivityMeta {
  [key: string]: any;
}

export interface ActivityLogEntry {
  org_id: string;
  actor_user_id: string;
  entity_type: EntityType;
  entity_id: string;
  action: Action;
  meta?: ActivityMeta;
}

export const logActivity = async (logEntry: ActivityLogEntry) => {
  const supabase = await createAdminClient();

  try {
    const { error } = await supabase
      .from('activity_log')
      .insert([{
        org_id: logEntry.org_id,
        actor_user_id: logEntry.actor_user_id,
        entity_type: logEntry.entity_type,
        entity_id: logEntry.entity_id,
        action: logEntry.action,
        meta: logEntry.meta || {}
      }]);

    if (error) {
      Logger.error('LOG_ACTIVITY', 'Error logging activity', error, {
        details: {
          orgId: logEntry.org_id,
          actorUserId: logEntry.actor_user_id,
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
        actorUserId: logEntry.actor_user_id,
        entityType: logEntry.entity_type,
        entityId: logEntry.entity_id,
        action: logEntry.action
      }
    });
  } catch (error) {
    Logger.error('LOG_ACTIVITY', 'Unexpected error logging activity', error, {
      details: {
        orgId: logEntry.org_id,
        actorUserId: logEntry.actor_user_id,
        entityType: logEntry.entity_type,
        entityId: logEntry.entity_id,
        action: logEntry.action
      }
    });
    throw error;
  }
};

export const logActivityWithMeta = async (
  orgId: string,
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: Action,
  meta?: ActivityMeta
) => {
  await logActivity({
    org_id: orgId,
    actor_user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    meta
  });
};

export const logInvoiceActivity = async (
  orgId: string,
  userId: string,
  invoiceId: string,
  action: Action,
  meta?: ActivityMeta
) => {
  await logActivity({
    org_id: orgId,
    actor_user_id: userId,
    entity_type: 'invoice',
    entity_id: invoiceId,
    action,
    meta
  });
};

export const logExpenseActivity = async (
  orgId: string,
  userId: string,
  expenseId: string,
  action: Action,
  meta?: ActivityMeta
) => {
  await logActivity({
    org_id: orgId,
    actor_user_id: userId,
    entity_type: 'expense',
    entity_id: expenseId,
    action,
    meta
  });
};

export const logClientActivity = async (
  orgId: string,
  userId: string,
  clientId: string,
  action: Action,
  meta?: ActivityMeta
) => {
  await logActivity({
    org_id: orgId,
    actor_user_id: userId,
    entity_type: 'client',
    entity_id: clientId,
    action,
    meta
  });
};

export const logPaymentActivity = async (
  orgId: string,
  userId: string,
  paymentId: string,
  action: Action,
  meta?: ActivityMeta
) => {
  await logActivity({
    org_id: orgId,
    actor_user_id: userId,
    entity_type: 'payment',
    entity_id: paymentId,
    action,
    meta
  });
};
