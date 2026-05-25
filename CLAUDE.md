# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a **two-package** project, not a workspace. Each side has its own `package.json` and `node_modules`:

- `/` — React 19 + Vite 6 + Tailwind v4 frontend (root `package.json`)
- `/server` — Express + TypeScript + PostgreSQL backend

Always `npm install` in **both** directories after a fresh clone. The root `Makefile install` target does both.

The legacy `firebase-applet-config.json`, `firebase-blueprint.json`, and `firestore.rules` files at the repo root are remnants from a previous Firebase implementation. Auth and persistence are now JWT + PostgreSQL; ignore the Firebase files unless explicitly migrating away from them.

## Common commands

### Development (run two terminals)

```bash
# Terminal 1 — frontend on :3000, proxies /api → :3001
npm run dev

# Terminal 2 — backend on :3001 with tsx watch
cd server && npm run dev
```

The Vite dev server proxies `/api/*` to `VITE_API_URL` (default `http://localhost:3001`), so the frontend `api.ts` always calls `/api/...` regardless of environment.

### Type-checking & build

There is **no test runner** and **no ESLint** configured. The only static check is TypeScript:

```bash
npm run lint          # tsc --noEmit on the frontend
cd server && npm run build   # tsc compile of the server (also surfaces type errors)
npm run build         # vite production build (frontend)
```

### Docker / full-stack

```bash
./deploy.sh           # one-shot: generates .env on first run, builds, starts, prints URL
./deploy.sh fresh     # ⚠️ wipes the postgres volume and redeploys
make up               # docker compose up -d --build
make logs-server      # tail server logs only
make shell-db         # psql into the running database (user ibc, db ibc_tasks)
```

`docker-compose.yml` exposes the frontend on host port `${WEB_PORT:-80}` (mapped to nginx's internal `8080`). If port 80 is blocked, set `WEB_PORT=8080` in `.env`.

## Architecture

### Request flow

```
Browser → Nginx (container :8080) ──/api/*──→ Express (container :3001) → Postgres (container :5432)
                                  ──/*──→ static React build
```

In dev, Vite replaces nginx and proxies `/api` directly. The frontend has **no knowledge of the API host** — always relative paths.

### Backend bootstrapping (`server/src/index.ts`)

- On startup, reads `schema.sql` and runs it against Postgres. The schema is **idempotent**, so it doubles as the migration system. To change the DB shape, edit `server/src/schema.sql` — there are no separate migration files.
- Mounts route modules under `/api/{auth,tasks,users,notifications,reports,custom-roles,departments,chat}`.
- Three rate limiters layered on `/api/`, `/api/auth`, and `/api/chat`.
- Health check is at `/health` (not `/api/health`).

### Authorization model (`server/src/middleware/authorize.ts`)

Two-tier permission system. When adding a protected endpoint, call `authorize('tasks:edit', ...)`:

1. **Role-based** — hard-coded `ROLE_PERMISSIONS` map for `admin`, `member`, `monitor`. New built-in permissions go here.
2. **Custom permissions** — per-user JSON array stored in `users.custom_permissions`. Falls through to this check if role-based fails. Managed via the `/api/custom-roles` and user management endpoints.

The first registered user is auto-promoted to `admin` (see `routes/auth.ts`). There is no separate signup flow for admins.

### Frontend state architecture

App-wide state lives in **four custom hooks** under `src/hooks/`, composed in `App.tsx`:

| Hook | Owns |
|------|------|
| `useAuth` | Login/register/logout, JWT in localStorage, dark mode, language toggle |
| `useData` | Fetches and caches tasks, users, reports, notifications, customRoles, departments. Exposes `fetchData()` for manual refresh after mutations |
| `useTaskActions` | All task CRUD + bulk + modal open/close state. Calls `fetchData()` and `createNotification()` after mutations |
| `useUserActions` | User/role/department/notification mutations |

There is **no global store** (Redux/Zustand). After any mutation, the convention is `await fetchData()` to refetch. If you add a new mutation, follow the same pattern — don't introduce optimistic updates without a clear reason.

Routing is `react-router` v7 with routes defined inline in `App.tsx`. The active tab is derived from `location.pathname`, not stored.

### Design system

Tailwind v4 with the new `@tailwindcss/vite` plugin. Tokens and component classes (`glass-1`, `bg-app`, `noise-overlay`, etc.) are defined in `src/index.css` — **not** in a `tailwind.config.js`. There is no Tailwind config file.

Fonts (Inter, IBM Plex Sans Arabic) are served locally from `public/fonts/`. Do not add Google Fonts links — they will fail in air-gapped Saudi government deployments.

### i18n & RTL

`src/i18n.ts` holds all AR/EN strings inline. Adding a string means editing both language blocks. The HTML `dir` attribute is toggled via `useAuth.toggleLanguage`; component layouts must work in both directions (use logical Tailwind utilities like `ms-*`/`me-*` over `ml-*`/`mr-*` where it matters).

### AI integration

`GEMINI_API_KEY` is **inlined into the client bundle** at build time via `vite.config.ts`'s `define` block (`process.env.GEMINI_API_KEY`). The chatbot calls `@google/genai` directly from the browser. The server also has a `routes/chat.ts` for server-side calls. When working on AI features, be aware which side is making the call — the client-side path leaks the key in the bundle, which is acceptable for this private deployment but worth flagging if scope changes.

## Environment

Required in `.env` (root):

| Variable | Notes |
|----------|-------|
| `DB_PASSWORD` | Postgres password. `./deploy.sh` generates a random one on first run |
| `JWT_SECRET` | 32+ random bytes. Also generated by `deploy.sh` |
| `GEMINI_API_KEY` | Optional; only needed for chatbot/report-AI features |
| `WEB_PORT` | Host port for nginx (default `80`) |
| `VITE_API_URL` | Dev-only; defaults to `http://localhost:3001` |

The `Dockerfile` (frontend) sets `NODE_OPTIONS=--max-old-space-size=4096` because the Vite build is memory-heavy. Servers under 2 GB RAM need swap added (see README).

## Conventions

- Schema changes go in `server/src/schema.sql` and must be **idempotent** (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). The schema runs on every server boot.
- After a frontend mutation, refetch via `fetchData()` rather than splicing local state.
- New API routes need both `authMiddleware` and (usually) `authorize(...)` — never expose mutating endpoints without the authorize layer.
- The `dist/` directory at the repo root is committed build output used by some deployment paths; don't edit it by hand.
