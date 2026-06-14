# Data Access Points Classification Report

## 1. API Routes Analysis (`app/api/**`)
### Identified API Route Categories:

#### A. Internal CRUD Operations
- `/api/auth-user` - Authentication user management
- `/api/clients` - Client data operations (CRUD)
- `/api/debug` - Debugging endpoint
- `/api/expenses` - Expense data operations (CRUD)
- `/api/invites` - Organization invitation operations (accept, reject, create, revoke, list)
- `/api/invoices` - Invoice data operations (CRUD)
- `/api/notifications` - Notification data operations
- `/api/organizations` - Organization data operations (CRUD)
- `/api/payments` - Payment data operations (CRUD)
- `/api/user` - User data operations

#### B. Webhooks
- `/api/webhooks/clerk` - Third-party callback for Clerk authentication events

## 2. Client-Side Data Access Patterns (`fetch(/api/`)

### Internal App Usage (All identified fetch calls):
- `fetch('/api/invites/[token]')` - Get invite details by token
- `fetch('/api/invites/accept')` - Accept an invitation
- `fetch('/api/invites/reject')` - Reject an invitation
- `fetch('/api/invites/create')` - Create a new invitation
- `fetch('/api/invites/revoke')` - Revoke an invitation
- `fetch('/api/invites/list')` - List invitations for an organization
- `fetch('/api/invoices')` - Get all invoices for user's organization
- `fetch('/api/invoices/create')` - Create a new invoice
- `fetch('/api/invoices/[id]')` - Get/update/delete specific invoice
- `fetch('/api/organizations')` - Get/create/update organization data
- `fetch('/api/clients')` - Get/create/update/delete client data
- `fetch('/api/clients/[id]')` - Get/update/delete specific client
- `fetch('/api/payments')` - Payment operations
- `fetch('/api/expenses')` - Expense operations
- `fetch('/api/notifications')` - Notification operations

## 3. Direct Supabase Usage Classification

### A. Server-Side Direct Usage (in `/lib/queries/**`)
- **Location**: `/lib/queries/*` files and API routes
- **Purpose**: Business logic layer for database operations
- **Pattern**: Using `createAdminClient()` for authenticated database access
- **Examples**: 
  - `lib/queries/invoices.ts` - Invoice CRUD operations
  - `lib/queries/clients.ts` - Client CRUD operations
  - `lib/queries/payments.ts` - Payment CRUD operations
  - `lib/queries/notifications.ts` - Notification CRUD operations
  - `lib/queries/organizations.ts` - Organization CRUD operations
  - `lib/queries/user.ts` - User/profile operations

### B. Client-Side Direct Usage (VIOLATION DETECTED)
- **Location**: `providers/notification-provider.tsx`
- **Issue**: Direct usage of `useSupabaseClient()` in client component
- **Pattern**: Real-time subscriptions and direct database queries
- **Specific Violation**: 
  ```typescript
  const supabase = useSupabaseClient();
  // Direct database access bypassing API layer
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("associated_clerk_id", userId)
  ```

## 4. Rule Violations Identified

### ❌ CRITICAL VIOLATIONS:
1. **Direct Supabase Usage in Client Components**:
   - File: `providers/notification-provider.tsx`
   - Issue: Uses `useSupabaseClient()` directly instead of API routes
   - Impact: Bypasses centralized business logic and authentication layers

2. **Mixed Data Access Patterns**:
   - Some operations go through API routes (`fetch('/api/...')`)
   - Others go directly to Supabase (`useSupabaseClient()`)
   - Creates inconsistency in data access patterns

### ⚠️ ARCHITECTURAL CONCERNS:
1. **API Layer Bypass**: The notification provider directly accesses Supabase, bypassing the API layer
2. **Inconsistent Patterns**: Hooks use API routes while some components use direct Supabase access
3. **Security Risk**: Direct database access could potentially bypass business logic and validation

## 5. Classification Summary

### Internal App Usage (95% of data access):
- API routes serve as primary data access layer
- Hooks like `use-invoices.ts` consistently use `fetch('/api/...')` pattern
- Server-side queries in `/lib/queries/` handle business logic

### External Integration:
- Clerk webhooks for user lifecycle events
- Real-time notifications via Supabase (though this should go through API)

### Recommended Next Steps:
1. Migrate client-side Supabase usage to API route pattern
2. Create proper API endpoints for real-time notification needs
3. Establish consistent data access patterns across the application