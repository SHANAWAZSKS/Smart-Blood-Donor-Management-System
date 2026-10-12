# Smart Blood Donor Management System — LifeLink AI

A full-stack blood donor coordination platform with live geolocation, emergency broadcasting, and AI-assisted donor matching.

## Project Structure

```
lifelink-ai/
├── frontend/           # React + Vite + Tailwind CSS (client-side app)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page-level views (Home, LandingPage, …)
│   │   ├── hooks/      # Custom React hooks (useLiveMap, useAuth, …)
│   │   ├── data/       # Mock/seed data (donor dataset)
│   │   └── lib/        # tRPC client, utilities
│   └── README.md
│
├── backend/            # Express + tRPC + Drizzle ORM (API server)
│   ├── _core/          # Server internals (auth, JWT, Vite bridge)
│   ├── drizzle/        # DB schema, migrations (MySQL)
│   ├── db.ts           # Database helpers
│   ├── routers.ts      # All tRPC procedures
│   └── README.md
│
├── shared/             # Types and constants shared by frontend & backend
│   ├── const.ts        # Cookie names, error messages, timeouts
│   ├── types.ts        # Re-exported DB types
│   └── lifelink.ts     # Domain utilities (match scoring)
│
├── .env.example        # Environment variable template (no real secrets)
├── package.json        # Single package — both sides share node_modules
├── tsconfig.json       # Unified TypeScript config
├── vite.config.ts      # Vite config (root = frontend/, output = dist/)
└── vitest.config.ts    # Test config (covers backend/ tests)
```

## Technology Stack

| Layer      | Technology |
|------------|-----------|
| Frontend   | React 19, Vite 7, TypeScript, Tailwind CSS 4, Radix UI |
| Backend    | Node.js, Express 4, tRPC v11, tsx |
| Database   | MySQL, Drizzle ORM |
| Auth       | JWT session cookies, Manus OAuth |
| Maps       | Google Maps API (via Forge proxy) |

## Getting Started

### 1. Install dependencies (once)

```bash
cd "path/to/lifelink-ai"
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.
```

### 3. Run in development

```bash
pnpm dev
# → http://localhost:3000
```

This starts both the Express backend AND the Vite frontend HMR in a single process.

### 4. Database setup (optional — app runs without DB using in-memory fallback)

```bash
pnpm db:push
```

### 5. Production build

```bash
pnpm build      # builds frontend → dist/public/, bundles backend → dist/index.js
pnpm start      # runs the production server
```

## Architecture Notes

This project uses a **monorepo with a shared/ layer**:
- `frontend/` and `backend/` share a single `node_modules` and `package.json`
- `shared/` is imported by both sides via TypeScript path aliases (`@shared/*`)
- In development, Express serves Vite's dev middleware on the same port — no CORS needed
- In production, Express serves the built static files from `dist/public/`

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (frontend + backend) |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm check` | TypeScript type check |
| `pnpm test` | Run backend tests |
| `pnpm db:push` | Run database migrations |
| `pnpm format` | Format code with Prettier |
