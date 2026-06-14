export const CACHE_TAGS = {
  INVOICES: (orgId: string) => `invoices-${orgId}`,
  CLIENTS: (orgId: string) => `clients-${orgId}`,
  EXPENSES: (orgId: string) => `expenses-${orgId}`,
  PAYMENTS: (orgId: string) => `payments-${orgId}`,
  ORGANIZATIONS: (userId: string) => `organizations-${userId}`,
  MEMBERS: (orgId: string) => `members-${orgId}`,
  DASHBOARD: (orgId: string) => `dashboard-${orgId}`,
  NOTIFICATIONS: (userId: string) => `notifications-${userId}`,
  INVITES: (orgId: string) => `invites-${orgId}`,
  SUBSCRIPTIONS: (userId: string) => `subscriptions-${userId}`,
  PROFILE: (userId: string) => `profile-${userId}`,
} as const;
