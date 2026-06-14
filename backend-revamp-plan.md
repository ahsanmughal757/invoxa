# AI Agent–Enforced Backend Compliance & Migration Plan  
**(With Explicit Rule Reinforcement per Phase)**

This document is designed **specifically for an AI implementation agent**.  
Every phase **re-states and enforces the rules** to prevent drift, shortcuts, or architectural violations.

The agent **must follow this plan sequentially**.  
Skipping, merging, or reinterpreting phases is **not allowed**.

---

## Global Non-Negotiable Rules (Apply to ALL Phases)

These rules are **always active**, even if repeated later.

1. **NO internal usage of `app/api/**`**
   - No `fetch('/api/...')` inside the app
   - No internal CRUD via route handlers

2. **Supabase RLS is the single source of authorization**
   - Never re-implement permission logic in JS/TS
   - Never bypass RLS unless explicitly using admin client

3. **No business logic in UI components**
   - UI = orchestration + rendering only
   - Zero calculations that already exist in DB triggers/views

4. **Do NOT modify database schema, triggers, RLS, or SQL logic**
   - Backend is considered stable and correct
   - Frontend must adapt, not the database

5. **One responsibility per layer**
   - Repositories = DB access only
   - Services = business workflows
   - Server Actions = all mutations

---

# PHASE 1 — SYSTEM AUDIT & CLASSIFICATION

## Agent Role
**Auditor + Classifier**

The agent must **observe only**, not refactor yet.

---

## Objectives

- Identify **all data access points**
- Classify each as:
  - Internal app usage
  - External integration
- Detect **rule violations** without fixing them yet

---

## Mandatory Tasks

1. Scan entire project for:
   - `app/api/**`
   - `fetch(`/api/`
   - Direct Supabase usage in components

2. Create a classification list:
   - Internal CRUD
   - Webhooks
   - Third-party callbacks

3. Flag violations explicitly (do not fix yet)

---

## Rules Enforced in This Phase

- ❌ DO NOT refactor anything
- ❌ DO NOT introduce new files
- ❌ DO NOT delete API routes yet
- ✅ ONLY observe, list, and classify

If the agent starts refactoring here → **FAILURE**

---

# PHASE 2 — DATA ACCESS EXTRACTION (REPOSITORIES)

## Agent Role
**Database Access Engineer**

---

## Objectives

- Create a **single source of truth** for database access
- Move all Supabase queries into repositories

---

## Mandatory Tasks

1. Create `lib/repositories/**`
2. For each entity:
   - `invoices.repo.ts`
   - `clients.repo.ts`
   - `payments.repo.ts`
   - `organizations.repo.ts`
3. Move **only raw Supabase queries** into these files

---

## Repository Rules (Strict)

Each repository file:
- ✅ Can contain:
  - `select`
  - `insert`
  - `update`
  - `delete`
  - `rpc`
- ❌ Must NOT:
  - Contain business logic
  - Call other repositories
  - Perform authorization checks
  - Modify returned data shapes

---

## Phase-Specific Enforcement

- ❌ UI components must NOT query Supabase directly
- ❌ API routes must NOT query Supabase directly
- ✅ ALL DB access must go through repositories

If even one query exists outside repositories → **FAILURE**

---

# PHASE 3 — SERVICE LAYER INTRODUCTION

## Agent Role
**Business Logic Architect**

---

## Objectives

- Centralize workflows that span multiple entities
- Represent real-world operations accurately

---

## Mandatory Tasks

1. Create `lib/services/**`
2. Implement services such as:
   - `invoice.service.ts`
   - `invite.service.ts`
   - `payment.service.ts`

---

## Service Rules (Strict)

Services:
- ✅ CAN:
  - Call multiple repositories
  - Orchestrate workflows
  - Enforce process order
- ❌ CANNOT:
  - Perform raw Supabase queries
  - Modify DB schema
  - Bypass RLS
  - Contain UI logic

---

## Phase-Specific Enforcement

- ❌ Repositories must NOT gain business logic
- ❌ UI must NOT orchestrate workflows
- ✅ UI must call services (directly or via actions)

If logic is duplicated between UI and service → **FAILURE**

---

# PHASE 4 — SERVER ACTIONS (ALL MUTATIONS)

## Agent Role
**Mutation Gatekeeper**

---

## Objectives

- Enforce a single mutation entry point
- Remove unsafe client-side writes

---

## Mandatory Tasks

1. Create `actions.ts` per feature folder
2. Move **all writes** into server actions:
   - Create invoice
   - Update invoice
   - Record payment
   - Accept/reject invite

---

## Server Action Rules (Strict)

- Every mutation:
  - Must include `use server`
  - Must call a service (not a repository directly)
- ❌ No mutations in:
  - Client components
  - Server components
  - API routes

---

## Phase-Specific Enforcement

- ❌ Direct Supabase writes anywhere else = FAILURE
- ❌ Client-side Supabase usage = FAILURE
- ✅ Only server actions mutate state

---

# PHASE 5 — READ FLOW STANDARDIZATION

## Agent Role
**Read-Path Optimizer**

---

## Objectives

- Make reads predictable, safe, and cacheable
- Align UI with DB as source of truth

---

## Mandatory Tasks

1. Reads in:
   - Server Components
   - Optional query helpers
2. Dashboard reads:
   - Use DB views only
   - No JS aggregation

---

## Read Rules (Strict)

- ❌ No derived calculations in UI
- ❌ No recomputation of:
  - Invoice status
  - Paid amount
  - Revenue totals
- ✅ DB views and triggers are authoritative

---

## Phase-Specific Enforcement

If UI calculates values already computed in DB → **FAILURE**

---

# PHASE 6 — API ROUTE ISOLATION

## Agent Role
**Boundary Enforcer**

---

## Objectives

- Restrict API routes to external communication only

---

## Mandatory Tasks

1. Delete or isolate internal API routes
2. Retain ONLY:
   - Webhooks
   - Public integrations

---

## API Rules (Strict)

- ❌ No internal app logic in `app/api/**`
- ❌ No dashboard or CRUD endpoints
- ✅ External-only communication

---

## Phase-Specific Enforcement

If UI calls `/api/*` internally → **FAILURE**

---

# PHASE 7 — FINAL VERIFICATION & LOCKDOWN

## Agent Role
**Compliance Validator**

---

## Objectives

- Ensure zero rule violations
- Confirm architectural consistency

---

## Mandatory Checks

1. No Supabase usage in components
2. No internal API calls
3. No business logic outside services
4. No mutations outside server actions
5. No frontend calculations duplicating DB logic

---

## Final Lock Rules

- ❌ No “temporary” exceptions
- ❌ No shortcuts for speed
- ✅ Architecture > convenience

---

# FINAL OUTCOME GUARANTEE

If implemented correctly, the system will have:

- One data access pattern
- Zero duplicated logic
- Strong RLS-aligned security
- Industry-grade Next.js App Router architecture
- AI-maintainable structure without drift

---

**This document is authoritative.  
Any deviation is a failure of execution.**
