# Mallannapeta Kitchen — Developer Execution Guide

> **Document for**: Internal developer (you)
> **Companion to**: `PROJECT_PHASES.md` (client-facing) and the original PDF spec
> **Version**: 1.0

This guide is **the** step-by-step execution plan. Each phase is broken into atomic steps with the **exact tools, packages, files, and verification commands** you need at each step. Follow it sequentially. Don't skip steps.

---

## Table of Contents

1. [Prerequisites — Local Environment](#1-prerequisites--local-environment)
2. [Prerequisites — Third-Party Accounts](#2-prerequisites--third-party-accounts)
3. [Stack Reference (one-page)](#3-stack-reference-one-page)
4. [Environment Variables Glossary](#4-environment-variables-glossary)
5. [Phase 0 — Scaffold & Brand Kit](#phase-0--scaffold--brand-kit-12-days)
6. [Phase 1 — Auth + Menu Browse](#phase-1--auth--menu-browse-34-days)
7. [Phase 2 — Cart + Checkout + Razorpay](#phase-2--cart--checkout--razorpay-45-days)
8. [Phase 3 — Real-time + Order Tracking](#phase-3--real-time--order-tracking-3-days)
9. [Phase 4 — Sunday Special + Coupons](#phase-4--sunday-special--coupons-23-days)
10. [Phase 5 — Admin Polish + Reports](#phase-5--admin-polish--reports-3-days)
11. [Phase 6 — Hardening + Launch](#phase-6--hardening--launch-23-days)
12. [Appendix A — Prisma Schema Skeleton](#appendix-a--prisma-schema-skeleton)
13. [Appendix B — Common Debugging Commands](#appendix-b--common-debugging-commands)
14. [Appendix C — Production Deploy Runbook](#appendix-c--production-deploy-runbook)

---

## 1. Prerequisites — Local Environment

Install these on your dev machine (Windows 11 in this case):

| Tool | Version | Purpose | Install Command |
|---|---|---|---|
| **Node.js** | 20 LTS | JavaScript runtime | https://nodejs.org/ — installer |
| **pnpm** | 9.x | Package manager (faster than npm, monorepo-friendly) | `npm i -g pnpm@9` |
| **Git** | latest | Source control | https://git-scm.com/ |
| **Docker Desktop** | latest | Run MySQL + Redis locally | https://www.docker.com/products/docker-desktop |
| **MySQL CLI** (optional) | 8.x | Inspect DB | `winget install Oracle.MySQL` or use DBeaver |
| **VS Code** | latest | IDE | Extensions: Prisma, ESLint, Tailwind CSS IntelliSense, GitLens |
| **GitHub CLI** | latest | Repo management | `winget install --id GitHub.cli` |

Verify installs:

```powershell
node --version    # should be v20.x
pnpm --version    # should be 9.x
docker --version
git --version
gh --version
```

---

## 2. Prerequisites — Third-Party Accounts

Create these accounts **before Phase 0 ends**. Use the kitchen's email (`mallanapetkitchen@gmail.com`) where it's the official account; use your own developer email where it's just for development access.

| Service | Account Email | Purpose | URL |
|---|---|---|---|
| **GitHub** | dev email | Source control, CI/CD | github.com |
| **Vercel** | dev email (will invite client later) | Frontend hosting (Next.js) | vercel.com |
| **Railway** | dev email | Backend hosting + Redis + MySQL | railway.app |
| **Cloudinary** | kitchen email | Dish photo storage + CDN | cloudinary.com |
| **Razorpay** | kitchen email | Payment gateway | razorpay.com (start in **Test Mode**) |
| **Resend** | kitchen email | Transactional emails | resend.com |
| **Sentry** | dev email | Error monitoring (free tier) | sentry.io |
| **Google Cloud Console** | kitchen email | OAuth client for "Sign in with Google" | console.cloud.google.com |

For each account: enable 2FA, save credentials to a password manager, add the credentials to `.env.example` keys (without values).

---

## 3. Stack Reference (one-page)

| Layer | Tech |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 14 (App Router) + React 18 + TypeScript + Tailwind + shadcn/ui |
| Frontend auth | NextAuth.js v5 (Auth.js) |
| Frontend data | SWR + Zod |
| Frontend real-time | socket.io-client |
| Frontend payments | Razorpay Checkout JS (loaded via `<Script>`) |
| Frontend monitoring | @sentry/nextjs |
| Backend | NestJS 10 + TypeScript |
| Backend ORM | Prisma + MySQL 8 |
| Backend auth | passport-jwt + argon2 + google-auth-library |
| Backend validation | class-validator + class-transformer + Zod (shared schemas) |
| Backend real-time | @nestjs/websockets + socket.io + @socket.io/redis-adapter |
| Backend queues / cron | BullMQ + ioredis + @nestjs/schedule |
| Backend payments | razorpay (official SDK) |
| Backend media | cloudinary (official SDK) |
| Backend email | resend + react-email |
| Backend push | web-push (VAPID) |
| Backend logging | nestjs-pino + pino |
| Backend monitoring | @sentry/node + @willsoto/nestjs-prometheus |
| Backend security | helmet + @nestjs/throttler |
| Testing | Vitest (unit) + Jest+Supertest (api integration) + Playwright (E2E) |
| CI/CD | GitHub Actions |
| Hosting | Vercel (web) + Railway (api + redis + mysql) |

---

## 4. Environment Variables Glossary

These are the env vars used across the project. Document each in `.env.example` (committed) and set real values in Vercel/Railway env settings.

### `apps/web/.env`

| Var | Phase | Description |
|---|---|---|
| `NEXTAUTH_URL` | 0 | Full URL of the Next.js app (e.g., `http://localhost:3000` dev, `https://mallannapetakitchen.com` prod) |
| `NEXTAUTH_SECRET` | 0 | 32+ random bytes — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | 1 | From Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | 1 | From Google Cloud OAuth client |
| `NEXT_PUBLIC_API_URL` | 0 | Base URL of NestJS API (e.g., `http://localhost:4000/api/v1`) |
| `NEXT_PUBLIC_SOCKET_URL` | 3 | Base URL of NestJS Socket.IO (often same as API host) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | 2 | Razorpay test/live key ID (publishable) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 3 | VAPID public key for web push |
| `NEXT_PUBLIC_SENTRY_DSN` | 6 | Sentry DSN for browser |
| `SENTRY_AUTH_TOKEN` | 6 | For source map upload in CI |

### `apps/api/.env`

| Var | Phase | Description |
|---|---|---|
| `DATABASE_URL` | 0 | `mysql://user:pass@host:3306/dbname` |
| `REDIS_URL` | 0 | `redis://host:6379` |
| `JWT_ACCESS_SECRET` | 1 | 32+ random bytes |
| `JWT_REFRESH_SECRET` | 1 | 32+ random bytes (different from above) |
| `JWT_ACCESS_TTL` | 1 | `15m` |
| `JWT_REFRESH_TTL` | 1 | `30d` |
| `GOOGLE_CLIENT_ID` | 1 | Same as web |
| `WEB_ORIGIN` | 0 | Web URL — for CORS allowlist |
| `RAZORPAY_KEY_ID` | 2 | Server-side |
| `RAZORPAY_KEY_SECRET` | 2 | Server-side — never expose |
| `RAZORPAY_WEBHOOK_SECRET` | 2 | Set in Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | 1 | |
| `CLOUDINARY_API_KEY` | 1 | |
| `CLOUDINARY_API_SECRET` | 1 | |
| `RESEND_API_KEY` | 2 | |
| `EMAIL_FROM` | 2 | e.g., `Mallannapeta Kitchen <orders@mallannapetakitchen.com>` |
| `VAPID_PUBLIC_KEY` | 3 | Generate with `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | 3 | |
| `VAPID_SUBJECT` | 3 | `mailto:mallanapetkitchen@gmail.com` |
| `SENTRY_DSN` | 6 | For NestJS |
| `TZ` | 4 | `Asia/Kolkata` (so cron expressions use IST) |

---

## Phase 0 — Scaffold & Brand Kit (1–2 days)

**Goal:** Working monorepo with both apps booting locally, brand kit applied, deployment pipelines wired, all third-party accounts created.

### Step 0.1 — Initialize monorepo

```powershell
cd e:\igniks_projects\mallanapet_kitchen
pnpm dlx create-turbo@latest .
# When prompted, pick "pnpm" as package manager
```

After init, replace the default apps with our structure:

```powershell
# Remove default apps
rm -r apps/web apps/docs

# We'll create them in next steps
mkdir apps/api packages/shared packages/email-templates
```

Update `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Step 0.2 — Create Next.js web app

```powershell
cd apps
pnpm create next-app@14 web --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint
cd web
pnpm add @tanstack/react-query swr zod next-auth@beta @auth/core lucide-react
pnpm add -D @types/node
```

Install shadcn/ui:

```powershell
cd apps/web
pnpm dlx shadcn@latest init
# Pick: New York style, neutral base, CSS variables yes
pnpm dlx shadcn@latest add button card input label select dialog sheet dropdown-menu form toast badge separator
```

### Step 0.3 — Create NestJS API

```powershell
cd ../..
pnpm dlx @nestjs/cli new apps/api --skip-git --package-manager pnpm
cd apps/api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/throttler @nestjs/schedule @nestjs/swagger @nestjs/websockets @nestjs/platform-socket.io
pnpm add @prisma/client passport passport-jwt argon2 google-auth-library class-validator class-transformer zod
pnpm add socket.io @socket.io/redis-adapter ioredis bullmq
pnpm add razorpay cloudinary resend web-push
pnpm add helmet nestjs-pino pino pino-http
pnpm add -D prisma @types/passport-jwt @types/web-push pino-pretty
pnpm dlx prisma init --datasource-provider mysql
```

### Step 0.4 — Brand kit setup (CRITICAL — uses provided assets)

```powershell
# Copy the provided logo
copy ..\..\logo.jpeg apps\web\public\logo.jpeg
copy ..\..\menu.jpeg apps\web\public\menu-original.jpeg
```

Create `apps/web/tailwind.config.ts` with brand colors:

```typescript
import type { Config } from "tailwindcss"

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#B8332A",   // deep red — from logo calligraphy
          accent:  "#E8841F",   // saffron — secondary
          gold:    "#F4B847",   // warm yellow — Sunday Special highlight
          surface: "#FFFAF0",   // warm cream — background
          ink:     "#2C1810",   // dark brown — text
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        telugu: ["Noto Serif Telugu", "serif"],
        display: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
```

Update `apps/web/src/app/layout.tsx` to load Google Fonts (Inter + Noto Serif Telugu + Playfair Display).

Generate favicons from logo:
```powershell
# Use https://realfavicongenerator.net/ — upload logo.jpeg, download package, drop into apps/web/public/
```

### Step 0.5 — Set up tooling

In monorepo root, add:
- `.prettierrc` — `{"singleQuote": true, "trailingComma": "all", "semi": true, "printWidth": 100}`
- `.editorconfig`
- Root `eslint.config.js` extending Next + NestJS configs
- `husky` + `lint-staged` for pre-commit
- `commitlint.config.js` for conventional commits

```powershell
pnpm add -D -w prettier eslint husky lint-staged @commitlint/cli @commitlint/config-conventional
pnpm dlx husky init
```

### Step 0.6 — Create GitHub repo + CI

```powershell
gh repo create mallannapeta-kitchen --private --source=. --remote=origin
git add . && git commit -m "chore: initial scaffold"
git push -u origin main
```

Create `.github/workflows/ci.yml`:
- Triggers: push to `main`, PRs to `main`
- Jobs: lint → typecheck → test (unit + integration with MySQL+Redis service containers)
- Caching: pnpm store, Turbo remote cache

### Step 0.7 — Provision hosting

**Vercel:**
1. Connect GitHub repo
2. Set root to `apps/web`, build command `pnpm turbo build --filter=web`
3. Add env vars (placeholder values — real ones come later)

**Railway:**
1. New project → connect GitHub
2. Add 3 services from same repo:
   - **api** (root: `apps/api`, build: `pnpm install && pnpm prisma generate && pnpm build`, start: `pnpm prisma migrate deploy && pnpm start:prod`)
   - **mysql** (Railway template: MySQL 8)
   - **redis** (Railway template: Redis)
3. Set internal env vars: `DATABASE_URL`, `REDIS_URL` reference the internal service hostnames

### Step 0.8 — Provision third-party accounts

For each, create the account, save credentials, and add to `.env.example`:
- Cloudinary: get cloud name, API key, secret
- Razorpay: enable test mode, get test key ID + key secret; create webhook URL placeholder (will fill in Phase 2)
- Resend: create API key; add domain DNS records (DKIM/SPF) — will be verified once domain is active
- Sentry: create two projects — `web` (Next.js) and `api` (Node.js), get DSNs
- Google Cloud OAuth:
  1. Create project "Mallannapeta Kitchen"
  2. Enable "Google+ API" / OAuth consent screen
  3. Create OAuth 2.0 Client ID — Web application
  4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`, `https://<your-domain>/api/auth/callback/google`
  5. Save client ID + secret

### Step 0.9 — Verify Phase 0

```powershell
pnpm install
pnpm dev   # Should boot Next.js on :3000 and NestJS on :4000
```

**Acceptance checklist:**
- [ ] `pnpm dev` boots both apps
- [ ] `pnpm lint && pnpm typecheck && pnpm test` are green
- [ ] Visiting `localhost:3000` shows the Mallannapeta logo + brand colors
- [ ] `curl localhost:4000/healthz` returns `{"status":"ok"}`
- [ ] Push to `main` triggers GitHub Actions CI green
- [ ] Vercel staging URL deploys successfully
- [ ] Railway api service is up and reachable

---

## Phase 1 — Auth + Menu Browse (3–4 days)

**Goal:** Customers can register, log in (email/password or Google), and browse the seeded menu. Admin can CRUD menu items + variants.

### Step 1.1 — Define Prisma schema

Edit `apps/api/prisma/schema.prisma` — see [Appendix A](#appendix-a--prisma-schema-skeleton) for the complete schema. Then:

```powershell
cd apps/api
pnpm prisma migrate dev --name init
pnpm prisma generate
```

### Step 1.2 — NestJS auth module

Create `apps/api/src/modules/auth/`:
- `auth.module.ts` — registers JwtModule (HS256, ACCESS_SECRET), PassportModule
- `auth.service.ts` — methods: `register(email, password, name)`, `login(email, password)`, `googleSignIn(idToken)`, `refresh(refreshToken)`, `logout(refreshToken)`, `forgotPassword(email)`, `resetPassword(token, newPassword)`
- `auth.controller.ts` — exposes the endpoints
- `strategies/jwt.strategy.ts` — extracts Bearer token, validates against `JWT_ACCESS_SECRET`
- `dto/{register,login,reset-password,...}.dto.ts` — class-validator DTOs

Key implementation notes:
- **Password hashing**: `argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })`
- **Refresh tokens**: opaque random string, store SHA-256 hash, family_id (UUID) for rotation reuse-detection
- **Google id_token verification**: `new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({idToken, audience: GOOGLE_CLIENT_ID})`
- **Account lockout**: after 5 failed `login()` attempts, set `locked_until = now + 15 min`
- **Password reset token**: `crypto.randomBytes(32).toString('base64url')`, store SHA-256 hash, expire 1h, single-use, invalidate all sessions on success

### Step 1.3 — NextAuth.js configuration on web

Create `apps/web/src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        })
        if (!res.ok) return null
        const data = await res.json()
        return { id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role,
                 accessToken: data.accessToken, refreshToken: data.refreshToken,
                 accessTokenExpires: Date.now() + 15 * 60 * 1000 }
      },
    }),
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // exchange Google id_token with our backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: account.id_token }),
        })
        if (!res.ok) return false
        const data = await res.json()
        Object.assign(user, { role: data.user.role, accessToken: data.accessToken,
                              refreshToken: data.refreshToken,
                              accessTokenExpires: Date.now() + 15 * 60 * 1000 })
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) Object.assign(token, user)
      // refresh if expiring within 60s
      if (Date.now() > (token.accessTokenExpires as number) - 60_000) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: token.refreshToken }),
        })
        if (res.ok) {
          const data = await res.json()
          token.accessToken = data.accessToken
          token.refreshToken = data.refreshToken
          token.accessTokenExpires = Date.now() + 15 * 60 * 1000
        }
      }
      return token
    },
    async session({ session, token }) {
      Object.assign(session, { accessToken: token.accessToken, role: token.role })
      return session
    },
  },
})
```

Wire up the route handler at `apps/web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
export { GET, POST } from "@/lib/auth"
```

### Step 1.4 — Guards & decorators

Create in `apps/api/src/common/`:
- `guards/jwt-auth.guard.ts` — extends `AuthGuard('jwt')`, default-applied via `APP_GUARD`
- `guards/roles.guard.ts` — checks `request.user.role` against `@Roles(...)` metadata
- `guards/ws-jwt.guard.ts` — for Socket.IO handshake (Phase 3)
- `decorators/roles.decorator.ts` — `@Roles(Role.OWNER, Role.MANAGER)`
- `decorators/public.decorator.ts` — `@Public()` to bypass JWT guard
- `decorators/current-user.decorator.ts` — `@CurrentUser()` extracts `req.user`

### Step 1.5 — Menu module

Create `apps/api/src/modules/menu/`:
- `menu.controller.ts` — public endpoints
- `menu.service.ts` — Prisma queries with eager-loading variants + addons
- DTOs

Endpoints:
- `GET /api/v1/menu/categories` — returns active categories with counts
- `GET /api/v1/menu/items?category=&search=&isVeg=` — paginated
- `GET /api/v1/menu/items/:slug` — full detail
- `GET /api/v1/menu/sunday-special` — current week's specials (active + IST Sunday)

### Step 1.6 — Admin menu CRUD

Create `apps/api/src/modules/admin/menu/`:
- `admin-menu.controller.ts` — guarded with `@Roles(Role.OWNER, Role.MANAGER)`
- Endpoints for categories, items, variants, addons (full CRUD)
- `POST /admin/cloudinary/sign` — returns signed Cloudinary upload params for direct browser upload

### Step 1.7 — Seed real menu data

Create `apps/api/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Categories
  const chicken = await prisma.category.upsert({ where: { slug: 'chicken' }, update: {}, create: { name: 'Chicken', slug: 'chicken', displayOrder: 1, isActive: true } })
  const mutton = await prisma.category.upsert({ where: { slug: 'mutton' }, update: {}, create: { name: 'Mutton', slug: 'mutton', displayOrder: 2, isActive: true } })
  const thali = await prisma.category.upsert({ where: { slug: 'thali-combos' }, update: {}, create: { name: 'Thali Combos', slug: 'thali-combos', displayOrder: 3, isActive: true } })
  const specials = await prisma.category.upsert({ where: { slug: 'specials' }, update: {}, create: { name: 'Specials', slug: 'specials', displayOrder: 4, isActive: true } })

  // Chicken & Rice with 1/2/4 person variants
  const chickenRice = await prisma.menuItem.upsert({
    where: { slug: 'chicken-and-rice' },
    update: {},
    create: {
      categoryId: chicken.id, name: 'Chicken & Rice', slug: 'chicken-and-rice',
      description: 'Tender chicken curry served with fragrant rice. A classic from our kitchen.',
      basePrice: 199, isVeg: false, isAvailable: true, prepTimeMinutes: 25,
      variants: { create: [
        { name: '1 Person', priceOverride: 199, displayOrder: 1, isDefault: true, isAvailable: true },
        { name: '2 Persons', priceOverride: 349, displayOrder: 2, isAvailable: true },
        { name: '4 Persons', priceOverride: 699, displayOrder: 3, isAvailable: true },
      ]},
    },
  })

  // Mutton & Rice with 1/2/4 person variants
  await prisma.menuItem.upsert({
    where: { slug: 'mutton-and-rice' },
    update: {},
    create: {
      categoryId: mutton.id, name: 'Mutton & Rice', slug: 'mutton-and-rice',
      description: 'Slow-cooked mutton curry with aromatic spices, served with rice.',
      basePrice: 299, isVeg: false, isAvailable: true, prepTimeMinutes: 35,
      variants: { create: [
        { name: '1 Person', priceOverride: 299, displayOrder: 1, isDefault: true, isAvailable: true },
        { name: '2 Persons', priceOverride: 549, displayOrder: 2, isAvailable: true },
        { name: '4 Persons', priceOverride: 1099, displayOrder: 3, isAvailable: true },
      ]},
    },
  })

  // Thali Combo
  await prisma.menuItem.upsert({
    where: { slug: 'thali-combo' },
    update: {},
    create: {
      categoryId: thali.id, name: 'Thali Combo', slug: 'thali-combo',
      description: 'Rice with Special Curry, Pappu, Charu, Curd, Appadam, Chutney.',
      basePrice: 199, isVeg: true, isAvailable: true, prepTimeMinutes: 20,
      variants: { create: [
        { name: '1 Person', priceOverride: 199, displayOrder: 1, isDefault: true, isAvailable: true },
        { name: '2 Persons', priceOverride: 349, displayOrder: 2, isAvailable: true },
        { name: '4 Persons', priceOverride: 699, displayOrder: 3, isAvailable: true },
      ]},
    },
  })

  // Boti — weight-based variant
  await prisma.menuItem.upsert({
    where: { slug: 'boti' },
    update: {},
    create: {
      categoryId: specials.id, name: 'Boti', slug: 'boti',
      description: 'Traditional spicy mutton offal preparation, slow-cooked to perfection.',
      basePrice: 749, isVeg: false, isAvailable: true, prepTimeMinutes: 45,
      variants: { create: [{ name: '1 KG', priceOverride: 749, displayOrder: 1, isDefault: true, isAvailable: true }]},
    },
  })

  // Thalakaya — weight-based variant
  await prisma.menuItem.upsert({
    where: { slug: 'thalakaya' },
    update: {},
    create: {
      categoryId: specials.id, name: 'Thalakaya', slug: 'thalakaya',
      description: 'Authentic Andhra-style mutton head curry — a rare weekend delicacy.',
      basePrice: 1100, isVeg: false, isAvailable: true, prepTimeMinutes: 60,
      variants: { create: [{ name: '1 KG', priceOverride: 1100, displayOrder: 1, isDefault: true, isAvailable: true }]},
    },
  })

  // Kitchen settings (single row)
  await prisma.kitchenSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, isOpen: true,
      openTime: '11:00', closeTime: '22:00',
      daysOpen: [0,1,2,3,4,5,6],
      minOrderValue: 199,
      prepTimeEstimateMinutes: 35,
      contactPhone: '+917993040100',
      supportWhatsappNumber: '+917993040100',
    },
  })

  console.log('✅ Seeded successfully')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

Run: `pnpm prisma db seed`

### Step 1.8 — Customer pages

In `apps/web/src/app/`:
- `(public)/page.tsx` — landing page with hero (Mallannapeta logo + tagline + "Order Now" CTA)
- `(public)/menu/page.tsx` — server-side rendered menu with categories + items + variant pricing
- `(auth)/login/page.tsx` — Google button + email/password form
- `(auth)/register/page.tsx` — name + email + password
- `(auth)/forgot-password/page.tsx`
- `(account)/account/page.tsx` — basic profile

Create `apps/web/src/components/MenuItemCard.tsx` with variant selector. Create `apps/web/src/lib/api-client.ts` — a typed fetch wrapper that auto-attaches `Authorization: Bearer <session.accessToken>`.

### Step 1.9 — Admin pages

In `apps/web/src/app/admin/`:
- `layout.tsx` — admin shell with role check via `auth()` server-side; redirects non-admins
- `menu/page.tsx` — list categories + items, edit buttons
- `menu/new/page.tsx`, `menu/[id]/edit/page.tsx`
- `categories/page.tsx`, `categories/new/page.tsx`

Create `apps/web/src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth"
export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")
  if (isAdminRoute) {
    const role = req.auth?.user?.role
    if (!["OWNER", "MANAGER", "KITCHEN_STAFF"].includes(role ?? "")) {
      return Response.redirect(new URL("/login", req.url))
    }
  }
})
export const config = { matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"] }
```

### Step 1.10 — Verify Phase 1

```powershell
pnpm dev
```

Manual checklist:
- [ ] Visit `/menu` — see all 5 seeded items with variant pricing
- [ ] Register new account at `/register`, log in
- [ ] Sign in with Google
- [ ] Promote yourself to OWNER: `UPDATE users SET role = 'OWNER' WHERE email = 'you@email.com';`
- [ ] Visit `/admin/menu`, add a new menu item with photo upload (Cloudinary)
- [ ] See the new item on `/menu`
- [ ] `curl -H "Authorization: Bearer <expired>" localhost:4000/api/v1/me` returns 401

---

## Phase 2 — Cart + Checkout + Razorpay (4–5 days)

**Goal:** End-to-end ordering: cart → checkout → Razorpay payment (or COD) → order confirmed → email sent.

### Step 2.1 — Cart module

`apps/api/src/modules/cart/`:
- `GET /cart` — server cart for logged-in users; recompute prices, flag OOS items
- `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`
- `POST /cart/merge` — body: `{items: [{menuItemId, variantId, addonIds, quantity, instructions}]}` — merges guest localStorage cart on login

On web, store guest cart in `localStorage` until login, then call `/cart/merge`. Use SWR for cart state with optimistic updates.

### Step 2.2 — Address management + serviceable pincodes

`apps/api/src/modules/users/addresses.controller.ts`:
- CRUD on user_addresses
- Validates `pincode` exists in `serviceable_pincodes` and is_active

`apps/api/src/modules/admin/pincodes/`:
- Admin CRUD: create pincode + delivery_fee + min_order_value
- `GET /api/v1/pincodes/:code/check` (public) — returns `{servicable, deliveryFee, minOrderValue}`

Web: `apps/web/src/app/(account)/addresses/page.tsx`, `AddressForm.tsx` with real-time pincode validation.

### Step 2.3 — Checkout `quote` endpoint

`POST /api/v1/checkout/quote` — body: `{addressId, couponCode?}`:
- Loads cart, validates kitchen open, validates address pincode is serviceable
- Recomputes all prices server-side (subtotal, delivery_fee from pincode, packaging_fee, taxes, discount, grand_total)
- Returns `{servedNow: true/false, reason, deliveryFee, packagingFee, taxes, discountAmount, grandTotal, unavailableItems[], minOrderValue, currentSubtotal}`

### Step 2.4 — `place-order` endpoint

`POST /api/v1/checkout/place-order` — body: `{addressId, couponCode?, paymentMethod, instructions?}`:
- Re-validates everything from quote
- In a Prisma transaction:
  - Snapshot address + customer name/phone into order
  - Snapshot each menu_item + variant + addons into order_items
  - Create Order(status=PENDING_PAYMENT for RAZORPAY, CONFIRMED for COD)
  - Create Payment(status=PENDING)
  - If RAZORPAY: call Razorpay `orders.create({amount: grandTotal*100, currency:'INR', receipt: orderNumber, notes:{orderId}})`, store `razorpay_order_id`
  - Atomic coupon redemption: `UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND used_count < usage_limit_total`; insert `coupon_redemptions` row (UNIQUE on coupon_id+order_id)
  - If COD: emit Socket.IO `order:new` to admin (Phase 3 wires it up)
- Returns `{orderId, orderNumber, razorpayOrderId?, razorpayKeyId?, amount, prefill: {name, email, contact}}`
- Schedule BullMQ delayed job at +10min for pending-payment sweep

### Step 2.5 — Razorpay frontend integration

Create `apps/web/src/components/RazorpayCheckout.tsx`:
- Loads Razorpay Checkout JS via `<Script src="https://checkout.razorpay.com/v1/checkout.js" />`
- Opens checkout on click with the order params from `place-order` response
- On success → POST to `/api/v1/payments/verify` with `{razorpay_order_id, razorpay_payment_id, razorpay_signature}`
- On failure → show error, allow retry

### Step 2.6 — Payment verification

`POST /api/v1/payments/verify`:
```typescript
const generated = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex')
if (generated !== razorpay_signature) throw new BadRequestException()
// Update payment to PAID, order to CONFIRMED, write order_status_history, emit Socket.IO, enqueue email
```

### Step 2.7 — Razorpay webhook

`apps/api/src/modules/webhooks/razorpay.controller.ts`:
- Configure raw body for this route in `main.ts`:
  ```typescript
  app.use('/api/v1/webhooks/razorpay', express.raw({type: 'application/json'}))
  ```
- Verify HMAC of raw body with `RAZORPAY_WEBHOOK_SECRET`
- Parse event, idempotently process by `razorpay_payment_id`:
  - `payment.captured` → ensure order CONFIRMED
  - `payment.failed` → mark payment FAILED, order CANCELLED, restore coupon
  - `refund.processed` → mark payment REFUNDED, order REFUNDED

In Razorpay dashboard: configure webhook URL `https://<api-host>/api/v1/webhooks/razorpay` with secret matching `RAZORPAY_WEBHOOK_SECRET`. Subscribe to: `payment.captured`, `payment.failed`, `refund.processed`.

### Step 2.8 — BullMQ pending-payment sweep

`apps/api/src/jobs/pending-payment-sweep.processor.ts`:
- Triggered as delayed job at order creation: 10 min later
- If order is still PENDING_PAYMENT → mark CANCELLED with reason "Payment timeout", restore coupon

Also a fallback global cron `*/10 * * * *` that scans for any stuck orders the delayed job missed (server restarts, etc.).

### Step 2.9 — Resend email integration

In `packages/email-templates/src/`:
- `OrderConfirmation.tsx` — React Email template with order summary, branded with logo + colors
- `PasswordReset.tsx`
- `RefundProcessed.tsx`

In `apps/api/src/modules/email/email.service.ts`:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
async sendOrderConfirmation(order) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: order.customerEmail,
    subject: `Order Confirmed - ${order.orderNumber}`,
    react: OrderConfirmation({ order }),
  })
}
```

Send email on order CONFIRMED via BullMQ queue (don't block the API response).

### Step 2.10 — COD flow

If `paymentMethod === COD`:
- Skip Razorpay, mark Payment.method=COD, Payment.status=PENDING (collect on delivery)
- Order goes straight to CONFIRMED
- Show "Please keep exact change ready" note

### Step 2.11 — Verify Phase 2

- [ ] Add to cart → log in → cart merges
- [ ] `POST /checkout/quote` with non-serviceable pincode → 400
- [ ] Place order with Razorpay test card `4111 1111 1111 1111` → see CONFIRMED in admin, email arrives
- [ ] Force-fail with card `4000 0000 0000 0002` → order stays PENDING_PAYMENT, sweep cancels after 10 min (override TTL to 1 min in dev for testing)
- [ ] Replay webhook from Razorpay test dashboard → order does NOT double-flip
- [ ] Coupon race: `for /l %i in (1,1,10) do curl -X POST ...` for last-use coupon → only one redemption row

---

## Phase 3 — Real-time + Order Tracking (3 days)

### Step 3.1 — Socket.IO gateway

`apps/api/src/modules/realtime/realtime.gateway.ts`:
```typescript
@WebSocketGateway({ namespace: '/realtime', cors: { origin: process.env.WEB_ORIGIN, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server
  
  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth.token
    try {
      const payload = jwtService.verify(token)
      socket.data.user = payload
      socket.join(`customer:${payload.sub}`)
      if (['OWNER','MANAGER','KITCHEN_STAFF'].includes(payload.role)) socket.join('admin:orders')
      if (payload.role === 'KITCHEN_STAFF') socket.join('admin:kitchen')
    } catch { socket.disconnect(true) }
  }
  
  @SubscribeMessage('subscribe:order')
  async subscribeOrder(@MessageBody() {orderId}, @ConnectedSocket() socket: Socket) {
    const order = await prisma.order.findUnique({ where: {id: orderId} })
    const isOwner = order?.userId === socket.data.user.sub
    const isAdmin = ['OWNER','MANAGER','KITCHEN_STAFF'].includes(socket.data.user.role)
    if (!isOwner && !isAdmin) return
    socket.join(`order:${orderId}`)
  }
}
```

### Step 3.2 — Redis adapter

In `main.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

const pub = createClient({ url: process.env.REDIS_URL })
const sub = pub.duplicate()
await Promise.all([pub.connect(), sub.connect()])
const ioAdapter = new IoAdapter(app)
ioAdapter.createIOServer = (port, options) => {
  const server = new Server(port, options)
  server.adapter(createAdapter(pub, sub))
  return server
}
app.useWebSocketAdapter(ioAdapter)
```

### Step 3.3 — Emit on status change

Inject `RealtimeGateway` into `OrdersService`. After every status update:
```typescript
this.gateway.server.to(`order:${orderId}`).emit('order:status_changed', payload)
this.gateway.server.to(`customer:${userId}`).emit('order:status_changed', payload)
this.gateway.server.to('admin:orders').emit('order:status_changed', payload)
```

On `order:new` (CONFIRMED), emit to `admin:orders` with full payload.

### Step 3.4 — Customer order tracking page

`apps/web/src/app/(account)/orders/[id]/page.tsx`:
- Server component fetches order initially
- Client component (`<OrderLiveStatus />`) connects Socket.IO, emits `subscribe:order`, listens for `order:status_changed`, updates UI status pill in real time
- Status timeline: visual stepper showing each status with timestamps from `order_status_history`
- Estimated delivery countdown
- Call button + WhatsApp click-to-chat button

### Step 3.5 — Admin orders dashboard

`apps/web/src/app/admin/orders/page.tsx`:
- Tabbed by status (All / New / Preparing / Out for Delivery / Delivered / Cancelled)
- Real-time append on `order:new` (with audio chime)
- Status update buttons per role: KITCHEN_STAFF can only progress forward; OWNER/MANAGER can cancel + refund
- `If-Match: <updated_at>` header for optimistic concurrency

### Step 3.6 — Audit log interceptor

`apps/api/src/common/interceptors/audit-log.interceptor.ts`:
```typescript
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(ctx, next) {
    const action = Reflect.getMetadata('audit-log', ctx.getHandler())
    if (!action) return next.handle()
    const req = ctx.switchToHttp().getRequest()
    return next.handle().pipe(tap(async result => {
      await prisma.auditLog.create({ data: {
        actorUserId: req.user?.sub, actorRole: req.user?.role, action,
        entityType: result?.__entityType, entityId: result?.id,
        before: req.__before, after: result, ip: req.ip, userAgent: req.headers['user-agent'],
      }})
    }))
  }
}
```

Decorator: `@AuditLog('order.cancelled')`. Apply to all admin mutation endpoints.

### Step 3.7 — Web push

Generate VAPID keys: `npx web-push generate-vapid-keys` → store in env.

Backend:
- `GET /api/v1/push/vapid-public-key` — public endpoint
- `POST /api/v1/push/subscribe` — store subscription
- On order status change, fan out push notification via web-push library (background BullMQ job)

Frontend:
- `apps/web/public/sw.js` — service worker handling `push` event
- `apps/web/src/components/PushSubscribeButton.tsx` — request permission, subscribe via `PushManager.subscribe()`, POST to backend

### Step 3.8 — Verify Phase 3

- [ ] Open `/orders/<id>` in browser A, change status in `/admin/orders` in browser B → status pill updates within 1s
- [ ] Kill API instance, restart → client reconnects automatically (re-join, re-fetch via REST)
- [ ] Subscribe to push, change status → OS notification appears
- [ ] Check `audit_logs` row written for status change

---

## Phase 4 — Sunday Special + Coupons (2–3 days)

### Step 4.1 — Sunday Special module

`apps/api/src/modules/sunday-special/`:
- `GET /sunday-special/current` — public, returns specials matching `is_active=true AND week_starting=current Sunday IST AND DAYOFWEEK(NOW IST)=1`
- Admin: full CRUD on `/admin/sunday-specials` (create, edit, schedule for future weeks, toggle is_active)

`apps/api/src/modules/admin/sunday-special/admin-sunday-special.controller.ts`:
- `POST /admin/sunday-specials` — body: `{menuItemId? OR oneOffName+description, specialPrice, bannerPhotoUrl, weekStarting, isActive}`
- Validate `weekStarting` is a Sunday (IST)
- `POST /admin/sunday-specials/:id/notify` — manually trigger fan-out (otherwise auto via cron)

### Step 4.2 — Sunday cron + push fan-out

`apps/api/src/jobs/sunday-push.processor.ts`:
```typescript
@Cron('0 8 * * 0', { timeZone: 'Asia/Kolkata' })
async sundayMorningFanOut() {
  const today = currentSundayIST()
  const specials = await prisma.sundaySpecial.findMany({ where: { isActive: true, weekStarting: today }})
  if (!specials.length) return
  // Fan out to opted-in subscriptions in batches of 100
  const subs = await prisma.pushSubscription.findMany({
    where: { isActive: true, user: { notificationPreferences: { sundaySpecialOptin: true }}},
    include: { user: true },
  })
  for (const batch of chunk(subs, 100)) {
    await this.pushQueue.addBulk(batch.map(sub => ({ name: 'send', data: { sub, payload: ... }})))
  }
}
```

Sweep cron `*/10 * * * *` for stuck pending-payment orders (also already in Phase 2).

### Step 4.3 — Customer Sunday Special UI

- Hero banner on `/` (only renders on Sunday) — gold-bordered card with `bg-brand-gold`, dish photo, name, price, "Order Now" CTA, "Available today only!" countdown to midnight IST
- Dedicated `/sunday-special` page
- Gold star badge on Sunday Special menu item cards

### Step 4.4 — Coupons module

`apps/api/src/modules/coupons/`:
- `POST /coupons/validate` — body: `{code, subtotal}` → returns `{valid, discountAmount, reason?}`
- Atomic redemption (already covered in Phase 2 step 2.4)

`apps/api/src/modules/admin/coupons/`:
- Full CRUD with usage_limit, expiry, type (FLAT/PERCENT)
- View redemption history per coupon

### Step 4.5 — Web coupon UI

In checkout page: input field with "Apply" button. On apply, call `/coupons/validate`, show discount applied or inline error. Persist applied coupon in cart state until removed or order placed.

### Step 4.6 — Verify Phase 4

- [ ] Schedule Sunday Special for `weekStarting = next Sunday`
- [ ] Override IST check in dev to fake Sunday → see banner
- [ ] Manually trigger fan-out → push received
- [ ] Apply valid coupon → discount applied; reuse it → "already used"
- [ ] Race 10 parallel redemptions → exactly one succeeds

---

## Phase 5 — Admin Polish + Reports (3 days)

### Step 5.1 — Admin customers module

`apps/api/src/modules/admin/customers/`:
- `GET /admin/customers` — search, filter, paginate
- `GET /admin/customers/:id` — profile + orders + lifetime value
- `PATCH /admin/customers/:id` — change role (OWNER-only for promoting OWNER/MANAGER), block/unblock
- `POST /admin/customers/:id/whatsapp` — open wa.me URL with pre-filled greeting (no actual API call)

### Step 5.2 — Pincodes admin page

UI for full CRUD on serviceable_pincodes. Bulk import via CSV upload (parse → upsert).

### Step 5.3 — Reports

`apps/api/src/modules/admin/reports/`:
- `GET /admin/reports/sales?from=&to=&groupBy=day|week|month`
- `GET /admin/reports/top-items?from=&to=`
- `GET /admin/reports/coupons-usage`
- `GET /admin/reports/customer-cohorts`

Use raw Prisma queries with `groupBy` + aggregations. Export to CSV.

Web: simple charts using Recharts or `<canvas>` rendering in `/admin/reports/` pages.

### Step 5.4 — Refund flow

`POST /admin/orders/:id/refund` — body: `{amount?, reason}`:
- Calls `razorpay.payments.refund(paymentId, {amount: refundAmount * 100})`
- Stores `refund_id` on payments row
- Marks order REFUNDED
- Webhook `refund.processed` provides idempotent confirmation
- Email customer via Resend

### Step 5.5 — Kitchen settings UI

`apps/web/src/app/admin/settings/page.tsx` — form for:
- is_open toggle (with optional force_close_until datetime)
- open_time / close_time
- days_open (multi-checkbox)
- min_order_value
- prep_time_estimate_minutes
- contact_phone / support_whatsapp_number

On save → `PATCH /admin/kitchen-settings` → emit Socket.IO `kitchen:settings_updated` → all clients refresh.

### Step 5.6 — Audit log viewer

`apps/web/src/app/admin/audit-logs/page.tsx` (OWNER only):
- Filter by entity type, actor, date range
- Show before/after JSON diffs
- Pagination

### Step 5.7 — Mobile-responsive admin

All admin pages should work on tablet (manager doing kitchen ops on iPad). Test at 768px breakpoint. Use shadcn `<Sheet>` for mobile sidebars.

### Step 5.8 — Verify Phase 5

- [ ] Refund a paid test order → Razorpay test dashboard shows refund; webhook flips to REFUNDED; email sent
- [ ] Generate sales report; totals match `SELECT SUM(grand_total) FROM orders WHERE status NOT IN ('CANCELLED', 'REFUNDED')` SQL
- [ ] KITCHEN_STAFF logs in → cannot see Refund button (and 403 if curl'd)
- [ ] Toggle kitchen closed → menu still browsable, checkout disabled with banner

---

## Phase 6 — Hardening + Launch (2–3 days)

### Step 6.1 — Sentry integration

```powershell
cd apps/web && pnpm dlx @sentry/wizard@latest -i nextjs
cd ../api && pnpm add @sentry/node @sentry/profiling-node
```

In NestJS `main.ts`: `Sentry.init({ dsn, integrations: [...], tracesSampleRate: 0.2 })`.

Configure source map upload in CI for both apps.

### Step 6.2 — Rate limiting tuning

In `app.module.ts`:
```typescript
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 10 },
  { name: 'medium', ttl: 60_000, limit: 100 },
  { name: 'long', ttl: 3600_000, limit: 1000 },
])
```

Per route: `@Throttle({ short: { limit: 5, ttl: 60_000 }})` on `/auth/login`.

Use Redis storage (`ThrottlerStorageRedisService`) for multi-instance.

### Step 6.3 — Helmet + CORS final config

```typescript
app.use(helmet({ contentSecurityPolicy: { directives: { ... }}}))
app.enableCors({
  origin: process.env.WEB_ORIGIN.split(','),
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
})
```

### Step 6.4 — E2E suite

```powershell
cd apps/web && pnpm add -D @playwright/test
pnpm playwright install
```

Critical test flows in `apps/web/e2e/`:
- `auth.spec.ts` — register, login, Google sign-in
- `checkout.spec.ts` — cart → checkout → Razorpay test → CONFIRMED
- `realtime.spec.ts` — admin status update reflects on customer page
- `coupon.spec.ts` — apply, race, expiry
- `sunday-special.spec.ts` — create, view, banner appears on Sunday

Add to CI: run on PRs to `main` only (slower).

### Step 6.5 — Lighthouse + a11y audit

```powershell
pnpm dlx @lhci/cli@latest autorun --collect.url=https://staging-url/ --collect.url=https://staging-url/menu
```

Target: Performance ≥ 85, A11y ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on `/` and `/menu`.

Fix common a11y issues: alt text on logo + dish photos, keyboard navigation in checkout, focus trap in modals, ARIA labels on icon-only buttons.

### Step 6.6 — Production environment setup

1. Domain — point DNS to Vercel + add custom domain in Vercel project
2. Resend — verify domain (DKIM, SPF, DMARC records)
3. Razorpay — submit KYC, get live keys (replace test keys)
4. Razorpay webhook — point at production URL
5. Google OAuth — add production redirect URI
6. Cloudinary — ensure paid plan if needed (free tier covers small volumes)
7. Update all env vars in Vercel + Railway to production values

### Step 6.7 — Production seed

Run a one-time prod seed:
- Create OWNER user with kitchen team's email
- Real menu (already covered in Phase 1 seed — verify photos are uploaded)
- Real pincodes (start with 5–10 for soft launch)
- Real opening hours

### Step 6.8 — Soft launch runbook

Document in `RUNBOOK.md` (separate file):
- How to roll back a deploy (Vercel + Railway one-click)
- How to put kitchen in "force closed" mode
- How to refund manually if needed
- How to reset a customer's password from admin
- On-call contact
- Sentry alert rules
- Webhook failure investigation steps

### Step 6.9 — Final deploy + smoke test

- [ ] Deploy production
- [ ] Place a real ₹1 test order with live Razorpay → verify end-to-end
- [ ] Refund the test order
- [ ] Check Sentry receives a synthetic error
- [ ] Verify Resend sends from production domain (no spam folder)
- [ ] Lighthouse on prod URLs
- [ ] Soft-launch announcement (limited pincodes)

---

## Appendix A — Prisma Schema Skeleton

The full schema goes in `apps/api/prisma/schema.prisma`. Below is the structure — flesh out the field-level details per the master plan.

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "mysql"; url = env("DATABASE_URL") }

enum Role { OWNER MANAGER KITCHEN_STAFF CUSTOMER }
enum OrderStatus { PENDING_PAYMENT CONFIRMED PREPARING OUT_FOR_DELIVERY DELIVERED CANCELLED REFUNDED }
enum PaymentStatus { PENDING PAID FAILED REFUNDED PARTIALLY_REFUNDED }
enum PaymentMethod { RAZORPAY COD }
enum CouponType { FLAT PERCENT }

model User {
  id              BigInt     @id @default(autoincrement()) @db.UnsignedBigInt
  email           String     @unique
  emailVerifiedAt DateTime?
  hashedPassword  String?
  phone           String?
  fullName        String
  role            Role       @default(CUSTOMER)
  googleId        String?    @unique
  avatarUrl       String?
  failedLoginCount Int       @default(0)
  lockedUntil     DateTime?
  lastLoginAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  deletedAt       DateTime?
  // relations
  addresses       UserAddress[]
  orders          Order[]
  cart            Cart?
  refreshTokens   RefreshToken[]
  pushSubscriptions PushSubscription[]
  notificationPreferences NotificationPreference?
  @@index([role])
}

model RefreshToken {
  id          BigInt    @id @default(autoincrement()) @db.UnsignedBigInt
  userId      BigInt    @db.UnsignedBigInt
  user        User      @relation(fields: [userId], references: [id])
  tokenHash   String    @unique @db.Char(64)
  familyId    String    @db.Char(36)
  userAgent   String?
  ip          String?
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())
  @@index([userId, familyId])
}

// ... PasswordResetToken, UserAddress, ServiceablePincode,
// Category, MenuItem, MenuItemVariant, MenuItemAddon,
// SundaySpecial, Cart, CartItem,
// Order, OrderItem, OrderStatusHistory, Payment,
// Coupon, CouponRedemption,
// PushSubscription, NotificationPreference,
// KitchenSettings, AuditLog
```

Reference the master plan section "Database Schema" for the full column list per table.

---

## Appendix B — Common Debugging Commands

```powershell
# Check what's listening on a port
netstat -ano | findstr :3000

# Inspect Prisma DB
pnpm --filter api prisma studio

# Reset local DB (DROP + recreate + migrate + seed)
pnpm --filter api prisma migrate reset --force

# Generate Prisma client after schema change
pnpm --filter api prisma generate

# Check Redis
docker exec -it <redis-container> redis-cli
> KEYS *
> MONITOR

# Check MySQL
docker exec -it <mysql-container> mysql -u root -p mallannapeta
> SHOW TABLES;
> SELECT * FROM orders ORDER BY id DESC LIMIT 5;

# Replay a Razorpay webhook locally (using ngrok)
ngrok http 4000
# In Razorpay dashboard, set webhook URL to ngrok URL temporarily, send test event

# Generate VAPID keys
npx web-push generate-vapid-keys

# Generate strong JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Test rate limit
for /l %i in (1,1,15) do curl -X POST http://localhost:4000/api/v1/auth/login -d "{}"
```

---

## Appendix C — Production Deploy Runbook

### Standard deploy
1. PR merged to `main` → GitHub Actions runs lint+typecheck+test
2. On green, Vercel auto-deploys `apps/web`
3. Railway auto-deploys `apps/api` (runs `prisma migrate deploy` on startup)
4. Smoke-test prod URL within 5 min

### Rollback
- **Web**: Vercel dashboard → Deployments → click previous deploy → "Promote to Production"
- **API**: Railway dashboard → Deployments → "Rollback" on previous build
- **DB migration rollback**: requires writing a reverse migration; for emergency, restore from Railway backup (daily snapshots)

### Force-close kitchen (emergency)
- Admin UI: `/admin/settings` → toggle is_open OFF
- Or SQL: `UPDATE kitchen_settings SET is_open = 0 WHERE id = 1; UPDATE kitchen_settings SET force_close_until = '<datetime>' WHERE id = 1;`

### Webhook failure investigation
1. Check Sentry for failed webhook events
2. Check Razorpay dashboard → Webhook deliveries → see delivery status + retry counts
3. Reproduce locally: copy raw body + signature header, send to local API via ngrok
4. Manually replay from Razorpay dashboard once fixed

---

*This guide is a living document. Update it as you learn things during implementation.*
