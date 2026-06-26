# Threat Model

## Project Overview

Formate is a multi-tenant safety-compliance SaaS for tradies and subcontractors. Users authenticate with Clerk, manage company details, sites, templates, submissions, SSSPs/JHAs, SWMS, and optional Xero contacts through a public Express API (`artifacts/api-server/src`) backed by PostgreSQL/Drizzle. The live deployment is public, so both anonymous endpoints and authenticated endpoints must be treated as reachable from the internet.

## Assets

- **Tenant business records** — sites, templates, submissions, SWMS, JSA, SSSPs, dashboard activity, and company profiles. These contain commercially sensitive operational data.
- **Safety-plan contents** — hazard registers, emergency contacts, site addresses, contractor/client identities, signatures, and uploaded site photos. Exposure can leak sensitive jobsite and personnel information.
- **Authentication context** — Clerk-backed user identity and any bearer tokens or session material used to call protected APIs.
- **Integration secrets and synced data** — Xero OAuth tokens, Xero OAuth client credentials, synced contact records, and Resend connector access. Compromise enables unauthorized downstream access.
- **Object storage references** — uploaded images served from app-controlled URLs. If public access is too broad, stored jobsite imagery becomes publicly enumerable.

## Trust Boundaries

- **Browser to API** — all client input crosses into the Express server; the browser is untrusted even when authenticated.
- **Authenticated user to tenant-owned data** — Clerk proves identity, but the API must still enforce per-record ownership for every list/read/write/delete operation.
- **Anonymous user to public sharing flows** — `/api/public/**` and public document pages must only disclose records through unguessable capability tokens or similarly strong access controls.
- **API to PostgreSQL** — the API has broad database access; missing authorization or unsafe query construction immediately becomes data compromise.
- **API to external services** — Xero OAuth, Resend, and Replit object storage cross into third-party or platform-managed systems and require strict token handling.
- **Repository/workspace to production secrets** — tracked files such as `.replit` must never contain live credentials; production secrets belong in the platform secret store or connector infrastructure.
- **Production to dev-only artifacts** — `artifacts/mockup-sandbox/` is assumed non-production unless reachability is proven. Marketing/video artifacts are lower-priority unless they share production APIs.

## Scan Anchors

- **Production entry points:** `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/index.ts`, `artifacts/safeiq/src/App.tsx`, `artifacts/formate-us/src/App.tsx`
- **Highest-risk code areas:** `artifacts/api-server/src/routes/public.ts`, `routes/sssps.ts`, `routes/sites.ts`, `routes/templates.ts`, `routes/submissions.ts`, `routes/swms.ts`, `routes/jsa.ts`, `routes/dashboard.ts`, `routes/xero.ts`, `routes/storage.ts`
- **Public surfaces:** `/api/healthz`, `/api/leads`, `/api/public/**`, `/api/storage/objects/*`, `/api/xero/callback`, frontend routes `/sssp/:id` and `/sign/:token`
- **Authenticated surfaces:** `/api/sites`, `/api/templates`, `/api/submissions`, `/api/dashboard`, `/api/sssps`, `/api/swms`, `/api/jsa`, `/api/company`, `/api/integrations`, `/api/billing`, most app routes under `/dashboard`, `/sites`, `/forms`, `/submissions`, `/sssps`, `/swms`, `/jsa`
- **Usually ignore unless proven reachable:** `artifacts/mockup-sandbox/`, video artifacts, local-only workflow/dev helpers

## Threat Categories

### Spoofing

The application relies on Clerk for authentication, so every protected API route must require a valid Clerk-authenticated identity and must not trust client-supplied user identifiers. OAuth callbacks and other third-party callbacks must bind their state to the initiating user and reject forged or replayed flows.

### Tampering

Authenticated users can create and edit safety records that drive customer-facing emails, PDFs, and sign-off flows. The server must validate request bodies and, more importantly, must only allow a user to modify records they own. Public signing links must be unguessable and scoped to the intended document.

### Information Disclosure

The most important risk in this product is data leakage across tenants or to the public internet. Safety plans, submissions, sites, emergency contacts, signatures, and uploaded photos must not be disclosed to other authenticated users or anonymous visitors except through deliberate, unguessable sharing mechanisms.

### Denial of Service

Public routes such as lead capture, public document access, signing, and object retrieval can be hit without prior trust. These surfaces should avoid expensive unbounded work, large payload abuse, or repeated token-guessing amplification that could degrade availability.

### Elevation of Privilege

The application is multi-tenant, but several resources use numeric IDs and shared tables. The API must enforce row-level ownership on every list/read/update/delete path so one authenticated customer cannot gain effective access to another customer’s records. Public share routes must not allow enumeration-based escalation from “knowing an ID” to “reading confidential safety plans.”
