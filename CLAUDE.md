# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Next.js + WebSocket server concurrently)
npm run dev

# Run only Next.js (port 3000)
npm run dev:next

# Run only WebSocket server (tsx watch, port 3005)
npm run dev:socket

# Production build (TypeScript and ESLint errors will fail the build)
npm run build

# Start production servers
npm run start          # Next.js
npm run start:socket   # WebSocket server
```

No test runner is configured.

### PM2 (production process manager)
```bash
pm2 status
pm2 logs zuri-app
pm2 restart zuri-app
pm2 logs zuri-websocket
```
Two PM2 processes: `zuri-app` (Next.js on port 3000) and `zuri-websocket` (Socket.io on port 3005).

## Architecture

**Zuri Platform** is a NEMT (Non-Emergency Medical Transportation) management system. Stack: Next.js 14 App Router, TypeScript, PostgreSQL, Prisma, Socket.io + Redis, Leaflet maps.

### Clean Architecture Layers

```
src/
├── domain/entities/        # Business entities (Conductor, etc.)
├── application/usecases/   # Use case orchestration
├── infrastructure/api/     # API client utilities (conductor.api.ts pattern)
├── app/api/                # Next.js API route handlers (backend)
├── app/dashboard/          # Next.js page routes (frontend)
├── components/             # React UI components (feature-based)
├── hooks/                  # Custom React hooks (data fetching/state)
├── lib/                    # Shared utilities (db, redis, notifications)
└── server/websocket.ts     # Standalone Socket.io server
```

### Database — Hybrid Approach
- **Prisma ORM** (`src/lib/prisma.ts`): Singleton client for type-safe queries. Use for most database operations.
- **Raw pg pool** (`src/lib/pg-pool.ts`): Direct PostgreSQL connection pool (max 20 connections) for complex queries where Prisma is insufficient.
- Schema: `prisma/schema.prisma` — primary model is `Conductor` (driver) with GPS tracking fields, certification fields, mobile app fields, and audit fields.

### Real-Time Architecture
- Separate WebSocket server (`src/server/websocket.ts`) running independently from Next.js.
- Socket.io with Redis adapter (`src/lib/redis.ts`) for pub/sub.
- Client hooks: `src/hooks/useWebSocketDashboard.ts`, `src/hooks/useGPSTracking.ts`.

### File Uploads
- Files stored in `public/uploads/` on disk.
- Served via `/api/uploads/` route.
- DB stores relative path (e.g., `/api/uploads/filename.jpg`).

## Key Patterns

### API Routes
- Collection: `src/app/api/[resource]/route.ts` (GET list, POST create)
- Single: `src/app/api/[resource]/[id]/route.ts` (GET, PUT, DELETE)

### API Client (infrastructure layer)
`src/infrastructure/api/conductor.api.ts` establishes the pattern:
- Dual URL resolution: relative `/api` on client, absolute URL on server
- `fetchWithTimeout` with AbortController (15s default, 3 retries)
- Custom error class (e.g., `ConductorAPIError`) for domain-specific error handling
- DTOs defined alongside the client

### Component Organization
Feature-based under `src/components/[domain]/` (conductores, pacientes, doctores, programacion, servicios). Shared primitives in `src/components/ui/` (Radix-based shadcn components). Layout in `src/components/layout/`.

### Domain Hooks
`src/hooks/use[Domain].ts` — each domain has a corresponding hook (e.g., `useConductores`, `useProgramaciones`) that encapsulates fetching, state, and mutations for that entity.

## Environment
Key `.env.local` variables needed: `DATABASE_URL`, `REDIS_URL`, `WEBSOCKET_PORT` (3005), `NEXT_PUBLIC_APP_URL`, `JWT_SECRET`.
