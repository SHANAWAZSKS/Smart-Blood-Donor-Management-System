# LifeLink AI — Backend

Express + tRPC + Drizzle ORM API server (Node.js / TypeScript).

## Stack
- **Runtime:** Node.js (ESM, tsx for development)
- **Framework:** Express 4
- **API layer:** tRPC v11 (type-safe, no REST boilerplate)
- **Database:** MySQL via Drizzle ORM
- **Auth:** JWT session cookies + OAuth via Manus SDK
- **File storage:** AWS S3 (optional)

## Source layout

```
backend/
├── drizzle/            # Database schema, migrations, relations
│   ├── schema.ts       # Table definitions (users, …)
│   ├── relations.ts    # Drizzle relations
│   └── *.sql           # Migration files
├── drizzle.config.ts   # Drizzle Kit configuration
├── db.ts               # Database connection + query helpers
├── routers.ts          # tRPC app router (all procedures)
├── storage.ts          # S3 / file storage helpers
└── _core/              # Framework internals (do not edit without care)
    ├── index.ts        # Express server entry point
    ├── context.ts      # tRPC request context
    ├── trpc.ts         # tRPC initialisation + middleware
    ├── cookies.ts      # Session cookie helpers
    ├── env.ts          # Typed environment variables
    ├── oauth.ts        # OAuth callback route
    ├── sdk.ts          # Manus SDK (JWT, user sync)
    ├── vite.ts         # Vite dev-server middleware (dev only)
    └── …
```

## Development

Run from the **repo root**:

```bash
pnpm dev        # starts Express + Vite HMR at http://localhost:3000
```

## Database migrations

```bash
pnpm db:push    # generate SQL and apply to DB (requires DATABASE_URL)
```

## Required environment variables

See `../.env.example` for the full list.
