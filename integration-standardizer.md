# Backend ↔ Frontend Integration Standardization  
## AI Agent Micro-Prompts (Standalone, Rule-Reinforced)

Each micro-prompt below is **standalone** and will be fed to the Gemini CLI agent **individually**.  
Therefore, **ALL universal rules are repeated and enforced in EVERY prompt**.

The agent must treat **each prompt as authoritative and self-contained**.

---

# MICRO PROMPT 1 — INTEGRATION AUDIT

## Agent Role
**Observer & Auditor**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

Violation of any rule = FAILURE.

## Task

Audit the entire codebase and identify:
- Backend functions throwing errors for missing data
- Frontend components that hang on loading when data is absent

## Enforcement

- ❌ DO NOT refactor code  
- ❌ DO NOT add logic  
- ✅ ONLY document violations  

---

# MICRO PROMPT 2 — ERROR VS EMPTY STATE CLASSIFICATION

## Agent Role
**Semantic Classifier**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Classify every backend response as:
- **ERROR** (true failure)
- **EMPTY STATE** (valid absence)

## Enforcement

- ❌ DO NOT change behavior  
- ❌ DO NOT update UI  
- ✅ Flag misclassified empty states  

---

# MICRO PROMPT 3 — BACKEND EMPTY-STATE THROW REMOVAL

## Agent Role
**Backend Contract Enforcer**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Refactor backend logic so valid empty states:
- No organization
- No invoices
- No clients
- No payments

return structured empty responses instead of throwing errors.

## Enforcement

- ❌ No DB changes  
- ❌ No UI assumptions  
- ❌ No throwing for absence  

---

# MICRO PROMPT 4 — BACKEND RESPONSE CONTRACT STANDARDIZATION

## Agent Role
**Response Contract Designer**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Ensure backend responses follow a consistent, explicit pattern:
- Data OR
- `null` / `[]` with clear intent

## Enforcement

- ❌ No error-based signaling  
- ❌ No ambiguous responses  
- ✅ Deterministic contracts only  

---

# MICRO PROMPT 5 — FRONTEND LOADING TERMINATION

## Agent Role
**UI State Stabilizer**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Ensure frontend:
- Stops loading on empty responses
- Never waits indefinitely for absent data

## Enforcement

- ❌ Infinite loading = FAILURE  
- ❌ `!data → keep loading` forbidden  

---

# MICRO PROMPT 6 — EMPTY STATE UI IMPLEMENTATION

## Agent Role
**UX State Mapper**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Render explicit UI for:
- No organization → Create CTA
- No invoices → Create CTA
- No clients → Add CTA

## Enforcement

- ❌ No redirect via error  
- ❌ No hidden UI  
- ✅ User must always have next action  

---

# MICRO PROMPT 7 — ERROR STATE ISOLATION

## Agent Role
**Failure Boundary Architect**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Ensure frontend error UI renders **only** for true failures.

## Enforcement

- ❌ Empty state ≠ error UI  
- ❌ Errors must not block valid flows  

---

# MICRO PROMPT 8 — UI STATE MATRIX ENFORCEMENT

## Agent Role
**State Machine Builder**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Explicitly implement:
- Loading
- Empty
- Ready
- Error

as separate states in every data-driven UI.

## Enforcement

- ❌ Combined states forbidden  
- ❌ Implicit branching forbidden  

---

# MICRO PROMPT 9 — INTEGRATION FLOW VALIDATION

## Agent Role
**Integration Validator**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Test flows:
- No organization
- New user onboarding
- No invoices
- Permission denied

## Enforcement

- ❌ UI hang = FAILURE  
- ❌ Crash = FAILURE  

---

# MICRO PROMPT 10 — REGRESSION LOCKDOWN

## Agent Role
**Compliance Gatekeeper**

## UNIVERSAL RULES (MANDATORY FOR THIS TASK)

1. Absence of data is **NOT** an error  
2. Errors are allowed **only** for auth, permission, validation, or system failure  
3. Backend must **never** control UI flow via thrown errors  
4. Frontend must **never** infer state from backend errors  
5. **No database schema, trigger, RLS, or SQL changes**  
6. **No breaking existing backend integrations**  
7. **Infinite loading states are forbidden**  
8. Every backend outcome must map to a frontend UI state  

## Task

Verify:
- No regressions
- No broken flows
- No rule violations

## Enforcement

- ❌ Any regression = STOP  
- ❌ Any rule break = FIX  

---

## FINAL GUARANTEE

When all micro-prompts are completed:

- Backend communicates **facts, not control**
- Frontend renders **states, not guesses**
- Users are never blocked by missing data
- Integration is deterministic and scalable

**These prompts are binding and standalone.**
