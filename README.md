# متابعة أعمال قطاع الاستثمار وخدمات الأعمال
# Investment & Business Services Sector Work Tracker

A professional task management platform built for Saudi government sectors, supporting bilingual Arabic/English interface with RTL layout.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite 6 + Tailwind CSS v4 |
| **Backend** | Express.js + TypeScript + PostgreSQL 16 |
| **Auth** | JWT (email/password), first user auto-admin |
| **AI** | Google Gemini (chatbot + report generation) |
| **Deploy** | Docker Compose (3 containers) + Nginx |
| **i18n** | i18next (Arabic/English) with full RTL support |

## Features

- **Dashboard** — Stats cards, charts (Recharts), department/status/monthly analytics
- **Task Management** — CRUD, bulk operations, subtasks, dependencies, team assignment
- **Kanban Board** — Drag-and-drop columns with @dnd-kit
- **Calendar View** — Monthly calendar with task visualization
- **My Tasks** — Personal task dashboard per user
- **Report Generator** — AI-powered reports with PDF/DOCX/PPTX export
- **User Management** — Role-based access (admin/editor/member/monitor), custom roles
- **Notifications** — Real-time notification center
- **AI Chatbot** — Gemini-powered assistant for task queries
- **Dark Mode** — Full dark/light theme support
- **Audit Trail** — Task history with before/after change tracking

## Quick Start — One Command Deploy

On any fresh server (Ubuntu 22.04/24.04) with Docker installed:

```bash
git clone https://github.com/aalshugaihy/ibc-sector-3.git
cd ibc-sector-3
./deploy.sh
```

That's it. The script:
- Generates a strong random `.env` (DB password + JWT secret) on first run
- Pulls latest from git
- Builds & starts all containers
- Waits until they're healthy
- Prints the public URL

**First registered user automatically becomes admin.**

### Deploy script commands

| Command | What it does |
|---------|--------------|
| `./deploy.sh` | Pull + build + start (default) |
| `./deploy.sh status` | Show URL and container status |
| `./deploy.sh logs` | Tail live logs |
| `./deploy.sh restart` | Restart all containers |
| `./deploy.sh stop` | Stop everything |
| `./deploy.sh fresh` | ⚠️ Wipe DB and redeploy from scratch |

### If port 80 is blocked

Some hosting providers block inbound port 80. Change to 8080:

```bash
# Edit .env, set WEB_PORT=8080
./deploy.sh
# Then visit: http://YOUR_IP:8080/
```

### Server requirements

- Ubuntu 22.04 or 24.04
- Docker + Docker Compose plugin
- **1 GB RAM minimum, 2 GB recommended** (Vite build is memory-heavy)
- If OOM during build: add 4 GB swap with `fallocate -l 4G /swapfile && mkswap /swapfile && swapon /swapfile`

## Development

```bash
# Install dependencies
npm install
cd server && npm install

# Run frontend (dev mode)
npm run dev

# Run backend
cd server && npm run dev
```

## Docker Commands (Makefile)

| Command | Description |
|---------|------------|
| `make up` | Build and start all containers |
| `make down` | Stop all containers |
| `make logs` | View container logs |
| `make restart` | Restart all containers |
| `make ps` | Show container status |
| `make shell-server` | Shell into API server |
| `make shell-db` | Shell into PostgreSQL |
| `make clean` | Remove containers, volumes, images |

## Architecture

```
Browser (8080) --> Nginx --> /api/* --> Express API (3001) --> PostgreSQL (5432)
                         --> /*     --> React SPA (static files)
```

**3 Docker containers:**
- `db` — PostgreSQL 16 Alpine with health checks
- `server` — Express API with JWT auth, auto-runs schema on startup
- `client` — Nginx serving React build + reverse proxy to API

## Design System

Unified glassmorphism design with consistent styling across all components:

- **Surfaces**: `glass-1` for cards, opaque backgrounds for modals/dropdowns
- **Typography**: `font-semibold` headings, `font-medium` body, no decorative tracking
- **Spacing**: `rounded-xl` cards, `rounded-lg` inputs/buttons, `rounded-md` badges
- **Colors**: Primary (indigo), Accent (cyan), Success (emerald), Warning (amber), Danger (rose)
- **Fonts**: Inter (variable) + IBM Plex Sans Arabic — loaded locally, zero external requests
- **Dark Mode**: Full support with navy-based dark palette

## Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | For AI features |
| `PORT` | API server port (default: 3001) | No |

## Project Structure

```
/
├── src/                    # React frontend
│   ├── components/         # UI components (13 files)
│   ├── api.ts              # REST API client
│   ├── types.ts            # TypeScript types
│   ├── i18n.ts             # Translations (AR/EN)
│   ├── constants.ts        # App constants
│   └── index.css           # Design system + Tailwind
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes (auth, tasks, users, etc.)
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── schema.sql      # Database schema
│   │   └── index.ts        # Express app entry
│   └── Dockerfile
├── public/
│   ├── fonts/              # Local font files (Inter, IBM Plex Sans Arabic)
│   └── textures/           # Local texture assets
├── docker-compose.yml
├── nginx.conf
├── Makefile
└── Dockerfile              # Frontend multi-stage build
```

## License

Private project — Investment & Business Services Sector.
