# Invoxa

**Billing software for small teams that outgrew spreadsheets.**

Invoxa is a full-featured invoicing and cash-flow platform built around the idea that a freelancer, an agency, or a three-person consultancy shouldn't need an accountant to know who owes them money. You manage invoices, clients, payments and expenses in one place — and if you work with other people, you bring them in instead of exporting CSVs back and forth.

This is the real product codebase: App Router, Postgres, row-level security, and a data layer that was designed with operations in mind, not just demos.

![Invoxa dashboard](https://raw.githubusercontent.com/ahsanmughal757/invoxa/main/public/images/dashboard.png)

---

## What it does

- **Invoices** — create, edit, preview and export invoices with line items, tax, discounts and per-client currency. Seven lifecycle states (draft → sent → paid / overdue / partially paid / void / cancelled) and you can tag an invoice to one of five built-in templates — from a minimal monochrome look to a bold creative layout — or drop in a temporary client without setting up a full profile.
- **Clients** — a real client database with payment terms, default currency, tax IDs and outstanding balances, so you always know what a given client owes across every invoice.
- **Payments & ledger** — record payments against invoices (cash, check, bank transfer, card, PayPal, other), track partial payments, and review the full payments ledger.
- **Expenses** — company and personal expenses with categories, vendors and tax-deductible flags. Money in and money out in the same tool.
- **Reports & insights** — generated reports (Professional Invoice, Executive Summary, Detailed Analytics) plus an insights dashboard with the usual charts — revenue, expenses, profit/loss, client summaries — built on real aggregated data, not mock numbers.
- **Organizations & collaboration** — invite teammates to your workspace, assign owner/member roles, switch between multiple organizations, and let members operate in a shared area without stepping on each other's data.
- **Dashboard** — a financial command center showing outstanding receivables, revenue YTD, total invoiced vs collected, top debtors and aging analysis, all computed server-side in SQL.
- **Notifications & activity** — a notification center driven by database triggers (overdue invoices, payments received, recurring invoices) plus a full activity log.
- **Subscriptions & trials** — self-service trial flow (3-minute and 14-day), plan-gated features with an upgrade modal and trial banners, and admin controls to manage licenses and subscriptions for a handful of users.
- **Admin** — a superuser area to manage plans, subscriptions, licenses and general system settings without touching the database.

## Tech stack

| Layer      | Choice                                                       |
| ---------- | ------------------------------------------------------------ |
| Framework  | Next.js 15 (App Router) + React 18                           |
| Language   | TypeScript (strict)                                          |
| Auth       | Clerk (SSO, organization-scoped sessions)                    |
| Database   | Supabase / Postgres — RLS policies, triggers, materialized dashboard views |
| Data layer | TanStack Query on top of a service → repository split         |
| UI         | Tailwind CSS + Radix UI primitives (shadcn-style components) |
| Charts     | Recharts                                                     |
| PDF        | html2pdf.js (client-side export of invoice/report templates) |
| Testing    | Jest + React Testing Library                                 |

## How the data layer is organized

Nothing on the dashboard or list views is client-computed from raw rows. The flow is roughly:

```
UI → hooks/ (TanStack Query)
   → lib/services/ (domain logic, idempotent upserts, validations)
   → lib/repositories/ (SQL against Supabase)
   → Postgres (RLS enforced, materialized views + functions do the heavy aggregation)
```

Auth runs through Clerk; a webhook route (`app/api/webhooks/clerk`) keeps the `profiles` table in sync with `user.created` / `user.updated` / `user.deleted`, and every org-scoped query is guarded by Row-Level Security. The `.func.ts` suffix on repositories/services marks files that are the "functional" flavor used by server routes, distinct from the equivalent client helpers.

## Getting started

Requirements: Node.js ≥ 18.18, a [Supabase](https://supabase.com) project, and a [Clerk](https://clerk.com) application.

```bash
git clone git@github.com:ahsanmughal757/invoxa.git
cd invoxa
npm install
```

1. **Set up the database.** Apply the migrations from `supabase/migrations/` to your Supabase project (they run in order and are idempotent), then push the schema with the local CLI if you prefer:

   ```bash
   supabase db push
   ```

2. **Configure environment variables.** Copy `.env.example` to `.env` and fill in:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=          # e.g. https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   CLERK_WEBHOOK_SECRET=              # needed for local webhook testing (see below)
   ```

3. **Run it.**

   ```bash
   npm run dev        # http://localhost:3000
   ```

### Local dev with Clerk webhooks

Clerk is a cloud service, so its webhooks can't reach `localhost`. To test the profile-sync route locally:

1. Run `npm run dev` and in a second terminal: `ngrok http 3000`
2. In the Clerk Dashboard → Webhooks, add an endpoint pointing at your ngrok URL + `/api/webhooks/clerk` (e.g. `https://abcd-123.ngrok.app/api/webhooks/clerk`) and subscribe to `user.created`, `user.updated`, `user.deleted`.
3. Copy the generated signing secret into `CLERK_WEBHOOK_SECRET` and restart the dev server.
4. Hit **Send Test** in the dashboard and confirm a 200 in the ngrok inspector (`http://127.0.0.1:4040`).

Note that ngrok issues a fresh subdomain on every restart, so the endpoint URL in Clerk will need updating afterwards.

## Scripts

| Command               | What it does                          |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start the dev server                  |
| `npm run build`       | Production build                      |
| `npm start`           | Serve the production build            |
| `npm run lint`        | ESLint via Next's built-in linting    |
| `npm test`            | Run Jest once                         |
| `npm run test:watch`  | Jest in watch mode                    |
| `npm run test:coverage` | Jest with coverage report           |

## Project layout

```
app/                    App Router pages
  (main)/               Authenticated app: dashboard, invoices, clients,
                        payments, expenses, reports, insights, settings
  (auth)/               Clerk sign-in / sign-up / invite screens
  site/                 Public marketing site
  api/webhooks/clerk/   Profile sync webhook
components/
  ui/                   Radix + Tailwind primitives (button, table, dialog, …)
  invoice/              Invoice form, preview, list + 5 print templates
  reports/              Report renderers + 3 templates
  clients/, payments/,
  expenses/, insights/,
  settings/, admin/     Feature modules
lib/
  services/             Domain logic (func flavor for server paths)
  repositories/         SQL access layer
  supabase/             client / server / admin helpers
  utils/                logger, error handler, activity logger
supabase/migrations/    Versioned SQL migrations
hooks/                  TanStack Query hooks per feature
```

## What's next (honest status)

Some things are wired in and working; others are in progress, and the README won't pretend otherwise:

- [x] Invoice PDF export (client-side, template-based)
- [x] Recurring invoice definitions — scheduling logic landing next
- [x] Multi-organization with roles + invites
- [ ] Email delivery of invoices (rule engine is ready; SMTP/email-service integration is not)
- [ ] Public API surface (service layer is already designed for it)
- [ ] Payment gateway integration (payment *recording* exists; processing does not)

## License

Commercial license — see [LICENSE.md](LICENSE.md).

---

Built with a lot of coffee and a fair amount of patience. If something's broken, an issue beats a support ticket every time.