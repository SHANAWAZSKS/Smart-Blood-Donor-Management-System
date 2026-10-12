# LifeLink AI — Frontend

React + Vite + TypeScript + Tailwind CSS single-page application.

## Stack
- **Framework:** React 19
- **Bundler:** Vite 7
- **Styling:** Tailwind CSS 4
- **State / data fetching:** TanStack Query + tRPC client
- **Routing:** Wouter (in-app state-based routing)
- **UI components:** Radix UI primitives + shadcn/ui

## Source layout

```
frontend/
├── index.html          # HTML entry point
├── public/             # Static assets served as-is
└── src/
    ├── _core/          # Auto-generated auth hooks (useAuth)
    ├── components/     # Shared UI components (AuthModal, Map, LiveDonorMap, …)
    │   └── ui/         # shadcn/ui primitive wrappers
    ├── contexts/       # React context providers (ThemeContext)
    ├── data/           # Seed / mock data (mockDonors.ts)
    ├── hooks/          # Custom hooks (useLiveMap, useMobile, …)
    ├── lib/            # Utilities and tRPC client setup
    ├── pages/          # Page-level components (Home, LandingPage, …)
    ├── App.tsx         # Root component
    ├── main.tsx        # Vite entry point
    └── index.css       # Global styles
```

## Development

Run from the **repo root** (not this folder):

```bash
pnpm dev        # starts the combined dev server at http://localhost:3000
```

The frontend is served by the Express backend via Vite middleware in development.
In production it is built to `dist/public/` and served statically.

## Build

```bash
pnpm build      # outputs to dist/public/
```
