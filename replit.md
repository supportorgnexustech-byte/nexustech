# Nexus Tech Solutions — Client Management Portal

A full-stack internal + client-facing portal for a tech services company. Manages clients, projects (Kanban board), resource/cost tracking, invoices, an AI-powered pricing estimator (Gemini 1.5 Flash), and a monthly analytics dashboard. Role-based access: Admin, Dev, and Client.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 / workflow-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build lib declarations (run this if you get "no exported member" errors)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Gemini 1.5 Flash for AI pricing estimator

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS (dark navy/electric blue theme) + shadcn/ui components
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)
- AI: Google Gemini 1.5 Flash via direct fetch

## Where things live

- `artifacts/portal/` — React Vite frontend (preview path `/`)
- `artifacts/api-server/` — Express API server (preview path `/api`)
- `lib/db/` — Drizzle ORM schema + migrations (`@workspace/db`)
- `lib/api-spec/` — OpenAPI spec (source of truth for all routes)
- `lib/api-client-react/` — Generated React Query hooks (`@workspace/api-client-react`)
- `lib/api-zod/` — Generated Zod schemas (`@workspace/api-zod`)
- `artifacts/portal/src/pages/` — All page components (Dashboard, Clients, Projects, Kanban, Resources, Invoices, Pricing, Analytics, Users, Notifications, ClientPortal)
- `artifacts/portal/src/contexts/AuthContext.tsx` — Auth context with token management
- `artifacts/api-server/src/routes/` — All route handlers
- `artifacts/api-server/src/lib/auth.ts` — Auth middleware and token store

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas. No drift between frontend and backend.
- Auth: In-memory token store (Map) + sha256+salt password hashing. Token passed as Bearer in all API requests via `setAuthTokenGetter`.
- Role-based routing: Admin sees all; Dev sees projects/kanban/resources; Client sees only their invoices and client portal.
- AI pricing uses Gemini 1.5 Flash with a structured JSON prompt — output is itemized feature estimates in INR.
- Notifications are stored in DB with `read` as integer (0/1) due to Drizzle's integer column — converted to boolean in API responses.
- Invoice items stored as JSONB; invoice numbers follow `NTS-YYYYMM-XXXX` pattern.

## Product

- **Client onboarding** — manage companies, contacts, services, GSTIN
- **Project Kanban** — drag-and-drop task board across all projects, with priority/status/assignee
- **Resource monitoring** — track dev hours, hosting, tools costs per project
- **Invoice management** — create, send, track paid/pending/overdue invoices
- **AI Pricing Estimator** — describe a project in plain text, get itemized INR estimate via Gemini
- **Analytics dashboard** — revenue, active projects, dev hours, invoice breakdown
- **Role-based access** — Admin / Dev / Client with protected routes
- **Notifications** — in-app and email milestone/invoice alerts

## Demo accounts (seeded)

| Email | Password | Role |
|-------|----------|------|
| admin@nexustech.in | admin123 | Admin |
| priya@nexustech.in | dev123 | Dev |
| rahul@nexustech.in | dev123 | Dev |
| sneha@nexustech.in | dev123 | Dev |
| rohan@acmecorp.com | client123 | Client (ACME Corp) |
| kavya@brightfintech.com | client123 | Client (BrightFintech) |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Stale lib types**: If you get "no exported member" errors after adding DB schema or running codegen, run `pnpm run typecheck:libs` to rebuild lib declarations.
- **Token auth**: Frontend uses `setAuthTokenGetter` from `@workspace/api-client-react` to inject Bearer token on every request. This is wired in `AuthContext.tsx`.
- **DB booleans**: `notifications.read` and `milestones.completed` are integers (0/1) in the DB schema — routes convert to boolean in responses.
- **Do not use root `pnpm dev`** — run artifacts via workflows only.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
