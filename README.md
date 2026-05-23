# Mallannapeta Kitchen

Full-stack ordering platform for Mallannapeta Kitchen — a Turborepo monorepo (pnpm workspaces).

## Structure

```
apps/
  api/   NestJS + Prisma (Postgres/Redis) REST API
  web/   Next.js (App Router) storefront + admin
packages/
  shared/          Shared TypeScript types/utilities
  email-templates/  Transactional email templates
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Setup

```bash
pnpm install
```

Copy the example env file and fill in real values (never commit `.env`):

```bash
cp apps/api/.env.example apps/api/.env
```

For the web app, create `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Develop

```bash
pnpm dev            # run all apps via turbo
pnpm dev:web        # web only
```

## Build

```bash
pnpm build
```

### API (NestJS)

```bash
cd apps/api
npx prisma migrate deploy   # apply migrations
npx nest build
node dist/main.js
```

### Web (Next.js)

```bash
cd apps/web
npx next build && npx next start --port 3000
```
