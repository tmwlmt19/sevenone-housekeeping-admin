# sevenone-housekeeping-admin

Platform/owner console for the SevenOne hotel housekeeping SaaS — an **admin-only**
web app for managing all hotels (tenants) and their staff across the platform.

Part of a four-app system:

- **sevenone-housekeeping-login** — shared login app (cookie SSO)
- **sevenone-housekeeping-web** — hotel operations app (managers + housekeepers)
- **sevenone-housekeeping-admin** — this app (platform admins)
- **sevenone-housekeeping-service** — FastAPI + PostgreSQL/Neon backend

**Status:** MVP built (hotels list, create hotel, hotel detail + staff
onboarding, account). Whole-system status lives in the web repo's `docs/status.md`.

## Auth

Cookie-based SSO. This app has no login screen: on load it calls `GET /auth/me`;
if there's no valid **admin** session it redirects to the login app. All API
calls send the shared httpOnly session cookie (`credentials: 'include'`).

## Getting started

```bash
pnpm install
cp .env.example .env.local     # API + login app URLs
pnpm dev                       # http://localhost:5175
pnpm gen:api                   # regenerate API types (backend running)
```

Requires the backend running (see the service repo's `docs/local-development.md`)
and the login app for signing in.

Stack: Vite + React + TypeScript, Tailwind v4 + shadcn/ui, TanStack Query, React
Router, React Hook Form + Zod, openapi-fetch.
