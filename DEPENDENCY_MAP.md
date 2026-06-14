# InvoicePro Dependency Map

This document provides a comprehensive overview of the dependencies and prerequisites within the InvoicePro application. Use this to understand what components depend on others and the prerequisites required to implement specific features.

## Authentication & User Management

### Dependencies
- **Clerk Authentication** → **Supabase Profiles** → **Organizations**
  - User authentication via Clerk
  - Clerk user ID linked to Supabase profile
  - Profile required to create organizations

### Prerequisites
- User must be registered and authenticated via Clerk
- Profile must be created in Supabase with Clerk user ID for any organization creation

## Core Data Model Dependencies

### Organizations
- **Depends on**: Authenticated User Profile
- **Prerequisites**: 
  - User must be authenticated
  - Profile must exist in Supabase profiles table with clerk_user_id
- **Owned by**: Single user (owner_user_id)
- **Relationships**:
  - One-to-many with: Clients
  - One-to-many with: Invoices  
  - One-to-many with: Expenses
  - One-to-many with: Payments

### Clients
- **Depends on**: Organization
- **Prerequisites**:
  - Organization must exist
  - Organization ID (org_id) required for creation
- **Relationships**:
  - Many-to-many with: Invoices (via client_id)

### Invoices
- **Depends on**: Organization AND Client
- **Prerequisites**:
  - Organization must exist (org_id)
  - Client must exist (client_id)
- **Relationships**:
  - One-to-many with: Invoice Items
  - One-to-many with: Payments

### Invoice Items
- **Depends on**: Invoice
- **Prerequisites**:
  - Invoice must be created first
  - Invoice ID (invoice_id) required for creation
- **Relationships**:
  - Belongs to: One Invoice

### Payments
- **Depends on**: Invoice
- **Prerequisites**:
  - Invoice must exist
  - Invoice ID (invoice_id) required for creation
- **Relationships**:
  - Belongs to: One Invoice

### Expenses
- **Depends on**: Organization
- **Prerequisites**:
  - Organization must exist (org_id)
- **Relationships**:
  - Belongs to: One Organization

## Feature Implementation Prerequisites

### Creating Invoices
1. User must be authenticated
2. User must have a profile in Supabase
3. Organization must exist (user must be owner of organization)
4. At least one client must exist within the same organization
5. Optional: Invoice template may be available for styling

### Managing Invoices
1. Organization must exist (to fetch all invoices for that org)
2. Permissions: User must have access to the organization

### Creating Clients
1. Organization must exist
2. User must have access to the organization
3. Organization ID required for client creation

### Processing Payments
1. Invoice must exist
2. Invoice must have an outstanding balance
3. Invoice must belong to user's organization

### Adding Expenses
1. Organization must exist
2. User must have access to the organization

### Generating Reports
1. Organization must exist
2. Data (invoices, payments, expenses) must exist for the organization
3. Time range for report must be specified

### Managing Organization Settings
1. User must be the organization owner
2. Organization must exist
3. User must have profile with appropriate permissions

## API Layer Dependencies

### Query Functions in `/lib/queries/`
- `invoices.ts`: Requires `orgId` and `clientId` for invoice creation
- `clients.ts`: Requires `orgId` for client creation
- `organizations.ts`: Requires `userId` for organization creation
- `payments.ts`: Requires `invoiceId` for payment creation
- `expenses.ts`: Requires `orgId` for expense creation

## UI Flow Dependencies

### Navigation Prerequisites
- **Dashboard**: Requires organization to display relevant data
- **Invoices**: Requires organization to show invoices list
- **Clients**: Requires organization to show clients list
- **Settings**: Requires organization to modify settings
- **Reports**: Requires organization to generate reports

### Form Dependencies
- **Invoice Creation Form**: Requires existing clients in the same organization
- **Payment Creation**: Requires existing unpaid invoices
- **Expense Creation**: Requires access to an organization

## Database Schema Dependencies

### Foreign Key Relationships
- `invoices.org_id` → `organizations.id`
- `invoices.client_id` → `clients.id`
- `invoice_items.invoice_id` → `invoices.id`
- `payments.invoice_id` → `invoices.id`
- `clients.org_id` → `organizations.id`
- `expenses.org_id` → `organizations.id`
- `organizations.owner_user_id` → `profiles.id` (via clerk_user_id)

## Complete Implementation Sequence

### For a New User:
1. User registers via Clerk authentication
2. Profile is created in Supabase (automated or manual)
3. User creates an organization (requires profile)
4. User adds clients to organization (requires organization)
5. User creates invoices for clients (requires organization + client)
6. User can manage payments, expenses, reports (requires organization + relevant data)

### For New Invoice Flow:
1. Verify organization exists (from user context)
2. Verify client exists in the same organization
3. Create invoice with organization and client references
4. Optionally add invoice items to the created invoice
5. Invoice is ready for processing (send, payment tracking, etc.)

### For Data Migration/Backup:
1. Export organizations first (top level dependency)
2. Export clients by organization
3. Export invoices by organization/client
4. Export invoice items by invoice
5. Export payments by invoice
6. Export expenses by organization

## Context Dependencies

### InvoiceContext
- Requires organization data to function
- Provides access to: invoices, clients, payments, expenses, organization, settings
- Used by: Layout components, various feature pages

### Component Dependencies
- Dashboard: Depends on all data types (invoices, clients, payments, expenses)
- Settings pages: Depend on organization and user permissions
- Reports: Depend on organization data aggregation