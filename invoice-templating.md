# FRONTEND-ONLY INVOICE TEMPLATE SYSTEM  
## 10 STRICT MICRO-PROMPTS (UNIVERSAL RULES FULLY ENFORCED)

> These prompts are **independent, self-contained, and strict**.  
> Each one **repeats ALL universal rules explicitly**, including the **NO-CLASS-ARCHITECTURE rule for Next.js compatibility**.

---

## 🧩 MICRO-PROMPT 1 — ROLE, SCOPE & CONTEXT ANALYSIS

### Agent Role
You are a **Senior Frontend UI Architect specializing in Next.js-based invoicing applications**.

### Task
Analyze the **existing invoice rendering flow**:
- Identify where layouts are defined
- Identify how invoice data is passed to UI
- Identify reusable vs hard-coded UI pieces

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. **FRONTEND ONLY** — absolutely no backend changes.
2. **Do NOT modify APIs, database schema, or backend logic.**
3. **Do NOT rename, restructure, or transform backend data fields.**
4. Invoice data must be consumed **exactly as already provided**.
5. Templates are **presentation-only**.
6. No assumptions about missing data.
7. No UI behavior changes in this phase.
8. **NO class-based architecture** — Next.js requires function-based components only.
9. Stop immediately if backend changes seem required.
10. Output must be analysis/documentation only.

### Output
Written architectural understanding of current invoice UI.

---

## 🧩 MICRO-PROMPT 2 — TEMPLATE SYSTEM ARCHITECTURE

### Task
Design a **frontend-only invoice template architecture** that:
- Fully separates data from presentation
- Supports multiple layouts with the same data
- Is scalable and plug-in friendly

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. Existing invoice data shape **must remain untouched**.
3. No new API calls or backend dependencies.
4. Templates are **purely visual**.
5. No business logic duplication.
6. Must integrate with current Next.js structure.
7. No breaking changes.
8. **NO class-based components or patterns.**
9. Graceful handling of missing fields.
10. Abort if backend involvement is required.

### Output
Component hierarchy + architecture diagram (conceptual).

---

## 🧩 MICRO-PROMPT 3 — TEMPLATE REGISTRY & SWITCHING LOGIC

### Task
Implement a **Template Registry Pattern**:
- Functional-component-based registry
- String-based template IDs
- Safe fallback behavior

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. Do NOT change invoice data format.
3. No backend storage or persistence.
4. No API or schema assumptions.
5. Deterministic template switching.
6. Missing template must never crash UI.
7. Use existing frontend state only.
8. **NO classes, constructors, or OOP patterns.**
9. No backend flags or toggles.
10. Stop if backend involvement is required.

### Output
Registry implementation using functions only.

---

## 🧩 MICRO-PROMPT 4 — TEMPLATE STYLE 1: CLASSIC BUSINESS

### Template
**Classic Business (Corporate Standard)**

### Task
Build a layout featuring:
- Table-based structure
- Clear borders
- Conservative typography
- Print-friendly design

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. Use existing invoice data only.
3. No backend formatting or calculations.
4. Layout-only responsibility.
5. No field renaming.
6. Missing data must render safely.
7. Must integrate into template registry.
8. **Functional components only (NO classes).**
9. No backend configuration.
10. Abort if backend changes are required.

### Output
Classic Business invoice template component.

---

## 🧩 MICRO-PROMPT 5 — TEMPLATE STYLE 2: MODERN CLEAN

### Template
**Modern Clean (SaaS / Startup)**

### Task
Design:
- Card-based layout
- Minimal borders
- Sans-serif typography
- Spacious spacing

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. Same invoice data usage.
3. No backend formatting logic.
4. No API dependency.
5. Visual-only changes.
6. Print-compatible design.
7. Handle missing fields safely.
8. **No class-based components.**
9. Integrate with existing design system.
10. Stop if backend involvement is needed.

### Output
Modern Clean invoice template component.

---

## 🧩 MICRO-PROMPT 6 — TEMPLATE STYLE 3: MINIMAL MONOCHROME

### Template
**Minimal Monochrome**

### Task
Implement:
- Single-column layout
- Typography-driven hierarchy
- Extreme whitespace
- Black/gray palette only

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. Consume invoice data as-is.
3. No backend formatting.
4. No logic assumptions.
5. Layout-only changes.
6. Missing data must not break UI.
7. Register within template system.
8. **Function components only.**
9. No backend flags.
10. Abort on backend dependency.

### Output
Minimal Monochrome invoice UI component.

---

## 🧩 MICRO-PROMPT 7 — TEMPLATE STYLE 4: BOLD CREATIVE

### Template
**Bold Creative (Agency / Designer)**

### Task
Create a layout with:
- Accent color headers
- Strong visual hierarchy
- Creative but professional look

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. No backend config changes.
3. Same invoice data usage.
4. No extra fields.
5. Print-safe styling.
6. Graceful empty states.
7. Clean functional components.
8. **NO class-based architecture.**
9. Registry integration required.
10. Stop if backend change is needed.

### Output
Bold Creative invoice template.

---

## 🧩 MICRO-PROMPT 8 — TEMPLATE STYLE 5: FINANCIAL DETAILED

### Template
**Financial Detailed (Enterprise)**

### Task
Design:
- Dense information layout
- Explicit totals and breakdowns
- Grid-heavy structure

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. No backend calculations.
3. Use existing totals only.
4. No schema assumptions.
5. Layout-only responsibility.
6. UI clarity over density.
7. Missing data handled gracefully.
8. **No class-based components.**
9. Registry-compatible.
10. Abort if backend change required.

### Output
Financial Detailed invoice UI template.

---

## 🧩 MICRO-PROMPT 9 — TEMPLATE SELECTION UI

### Task
Build a **frontend-only template selector**:
- Preview templates
- Switch layouts safely
- Use frontend state only

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. No backend persistence.
3. No API calls.
4. No database writes.
5. Use existing state management.
6. Safe fallback behavior.
7. No UI blocking states.
8. **Functional components only.**
9. No backend assumptions.
10. Abort if backend involvement is required.

### Output
Template selector UI component.

---

## 🧩 MICRO-PROMPT 10 — VALIDATION, FALLBACKS & EXTENSIBILITY

### Task
Ensure:
- All templates render safely
- Missing data never breaks UI
- New templates can be added without refactors

### 🚨 UNIVERSAL RULES (MUST FOLLOW ALL)
1. FRONTEND ONLY.
2. No backend dependencies.
3. No data mutations.
4. Same data → different visuals.
5. Deterministic rendering.
6. Graceful degradation.
7. No silent UI errors.
8. **NO class-based architecture anywhere.**
9. Maintain architectural integrity.
10. Stop if backend changes are required.

### Output
Validation checklist + extensibility guidelines.

---

## ✅ FINAL SUCCESS CRITERIA
- 5 industry-standard invoice templates
- Zero backend impact
- Next.js–compliant functional architecture
- Stable UI flows
- Future-ready, extensible system

---

**END OF STRICT, NEXT.JS-COMPLIANT MICRO-PROMPT SET**
