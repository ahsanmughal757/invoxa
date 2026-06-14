# InvoicePro™ Enterprise Edition - Knowledge Base

## Project Overview

InvoicePro™ is a comprehensive invoice management system built with:
- **Next.js 15** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components for accessible UI
- **Clerk** for authentication
- **Supabase** for database and backend services
- **Task Master AI** for project management

## Architecture

### Key Directories
- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable UI components organized by feature
- `lib/` - Utility functions and configurations
- `supabase/` - Database migrations and configurations
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks
- `context/` - React context providers

### Authentication
- Uses Clerk for user authentication
- Middleware.ts handles route protection
- Sign-in/sign-up pages in `app/(auth)/`

### Database
- Supabase PostgreSQL database
- Migrations in `supabase/migrations/`
- Combined migrations in `supabase/combined_migrations.sql`
- Tables: users, organizations, clients, invoices, payments, expenses, activity_log

### Key Features
- Invoice creation and management
- Client management
- Payment tracking
- Expense tracking
- Dashboard with analytics
- Reports and insights
- Subscription management
- Multi-tenant organization support

## Development Guidelines

### Styling
- Use Tailwind CSS classes
- Consistent component structure with Radix UI
- Dark/light theme support via next-themes

### State Management
- React Context for global state (InvoiceContext)
- Custom hooks for data fetching (use-invoices, use-subscription-access)
- Local storage for temporary data

### Code Organization
- Components grouped by feature/domain
- Shared UI components in `components/ui/`
- Business logic in custom hooks
- Type definitions centralized in `types/`

### Testing & Quality
- ESLint configuration for code quality
- TypeScript for type checking
- Development server on port 3000

## Common Tasks

### Running the Development Server
```bash
npm run dev
```

### Database Operations
- Migrations are in `supabase/migrations/`
- Use Supabase CLI for database management
- Combined migrations file for reference

### Building for Production
```bash
npm run build
npm start
```

## Important Notes

- The project uses App Router (not Pages Router)
- Authentication is handled by Clerk
- Database operations go through Supabase client
- UI components follow Radix UI patterns
- Responsive design is essential
- Multi-tenant architecture with organizations
