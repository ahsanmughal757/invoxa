// lib/utils/logger.ts
// Structured logging utility for server-side operations
import chalk from 'chalk';

interface LogData {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  operation: string;
  userId?: string | null;
  orgId?: string | null;  // Allow null values to match Supabase types
  entityId?: string;
  entityType?: string;
  message: string;
  details?: Record<string, unknown>;
}

export class Logger {
  static info(operation: string, message: string, context?: { userId?: string; orgId?: string | null; entityId?: string; entityType?: string; details?: Record<string, unknown> }) {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      level: 'info',
      operation,
      message,
      userId: context?.userId,
      orgId: context?.orgId ?? undefined,  // Convert null to undefined for JSON
      entityId: context?.entityId,
      entityType: context?.entityType,
      details: context?.details,
    };
    
    console.log(chalk.blue(JSON.stringify(logData)));
  }

  static warn(operation: string, message: string, context?: { userId?: string; orgId?: string | null; entityId?: string; entityType?: string; details?: Record<string, unknown> }) {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      operation,
      message,
      userId: context?.userId,
      orgId: context?.orgId ?? undefined,  // Convert null to undefined for JSON
      entityId: context?.entityId,
      entityType: context?.entityType,
      details: context?.details,
    };
    
    console.warn(chalk.yellow(JSON.stringify(logData)));
  }

  static error(operation: string, message: string, error: any, context?: { userId?: string | null; orgId?: string | null; entityId?: string; entityType?: string; details?: Record<string, unknown> }) {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      level: 'error',
      operation,
      message,
      userId: context?.userId,
      orgId: context?.orgId ?? undefined,  // Convert null to undefined for JSON
      entityId: context?.entityId,
      entityType: context?.entityType,
      details: {
        ...context?.details,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      },
    };
    
    console.error(chalk.red(JSON.stringify(logData)));
  }

  static success(operation: string, message: string, error: any, context?: { userId?: string | null; orgId?: string | null; entityId?: string; entityType?: string; details?: Record<string, unknown> }) {
    const logData: LogData = {
      timestamp: new Date().toISOString(),
      level: 'success',
      operation,
      message,
      userId: context?.userId,
      orgId: context?.orgId ?? undefined,  // Convert null to undefined for JSON
      entityId: context?.entityId,
      entityType: context?.entityType,
      details: {
        ...context?.details,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      },
    };
    
    console.error(chalk.green(JSON.stringify(logData)));
  }
}

// Success logging convenience functions
export const logSuccess = {
  organizationCreated: (orgId: string, userId: string) => {
    Logger.info('CREATE_ORGANIZATION', 'Organization created successfully', {
      userId,
      entityId: orgId,
      entityType: 'organization',
    });
  },

  organizationUpdated: (orgId: string, userId: string) => {
    Logger.info('UPDATE_ORGANIZATION', 'Organization updated successfully', {
      userId,
      entityId: orgId,
      entityType: 'organization',
    });
  },

  clientCreated: (clientId: string, userId: string, orgId: string) => {
    Logger.info('CREATE_CLIENT', 'Client created successfully', {
      userId,
      orgId,
      entityId: clientId,
      entityType: 'client',
    });
  },

  clientUpdated: (clientId: string, userId: string, orgId: string) => {
    Logger.info('UPDATE_CLIENT', 'Client updated successfully', {
      userId,
      orgId,
      entityId: clientId,
      entityType: 'client',
    });
  },

  clientDeleted: (clientId: string, userId: string, orgId: string) => {
    Logger.info('DELETE_CLIENT', 'Client deleted successfully', {
      userId,
      orgId,
      entityId: clientId,
      entityType: 'client',
    });
  },

  invoiceCreated: (invoiceId: string, userId: string, orgId: string) => {
    Logger.info('CREATE_INVOICE', 'Invoice created successfully', {
      userId,
      orgId,
      entityId: invoiceId,
      entityType: 'invoice',
    });
  },

  invoiceUpdated: (invoiceId: string, userId: string, orgId: string) => {
    Logger.info('UPDATE_INVOICE', 'Invoice updated successfully', {
      userId,
      orgId,
      entityId: invoiceId,
      entityType: 'invoice',
    });
  },

  invoiceDeleted: (invoiceId: string, userId: string, orgId: string) => {
    Logger.info('DELETE_INVOICE', 'Invoice deleted successfully', {
      userId,
      orgId,
      entityId: invoiceId,
      entityType: 'invoice',
    });
  },

  expenseCreated: (expenseId: string, userId: string, orgId: string) => {
    Logger.info('CREATE_EXPENSE', 'Expense created successfully', {
      userId,
      orgId,
      entityId: expenseId,
      entityType: 'expense',
    });
  },

  expenseUpdated: (expenseId: string, userId: string, orgId: string) => {
    Logger.info('UPDATE_EXPENSE', 'Expense updated successfully', {
      userId,
      orgId,
      entityId: expenseId,
      entityType: 'expense',
    });
  },

  expenseDeleted: (expenseId: string, userId: string, orgId: string) => {
    Logger.info('DELETE_EXPENSE', 'Expense deleted successfully', {
      userId,
      orgId,
      entityId: expenseId,
      entityType: 'expense',
    });
  },

  paymentRecorded: (paymentId: string, userId: string, orgId: string, invoiceId: string) => {
    Logger.info('RECORD_PAYMENT', 'Payment recorded successfully', {
      userId,
      orgId,
      entityId: paymentId,
      entityType: 'payment',
      details: { invoiceId },
    });
  },
};