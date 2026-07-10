# Hackatech — "CareKan แคร์กันไม่ขาดตอน"

CareKan is a hospital appointment booking platform for Thai citizens.

- **Backend** — NestJS + Prisma, hosted Postgres on **Supabase** (no local database needed)
- **Frontend** — React + Vite

> Because the database runs on Supabase, **you do not need Docker to run the app.**
> Docker is only required to run the backend test suite (see [Testing](#testing)).

---

## Prerequisites

- **Node.js 20+** (22 recommended)
- A `backend/.env` file with valid credentials (see [Environment](#environment))

---

## Quick Start

Two terminals. The database is already provisioned and seeded on Supabase, so there is no `docker compose up` and no first-time seeding step.

```bash
# Terminal 1 — API server
cd backend
npm install
npm run dev            # → http://localhost:4000

# Terminal 2 — Frontend dev server
cd frontend
npm install
npm run dev            # → http://localhost:5173 (proxies /api → :4000)
```

Open **http://localhost:5173**

### Demo Account (password: `care1234`)

| Role    | National ID     |
|---------|-----------------|
| citizen | `1234567890123` |

---

## Environment

The backend reads `backend/.env` (git-ignored). Copy the template and fill in the values:

```bash
cd backend
cp .env.example .env
```

| Variable                 | Required | Notes                                                             |
|--------------------------|----------|-------------------------------------------------------------------|
| `DATABASE_URL`           | ✅       | Supabase **transaction-mode pooler** (port `6543`, `?pgbouncer=true`) — used at runtime |
| `DIRECT_URL`             | ✅       | Supabase **session-mode pooler** (port `5432`) — used by `prisma migrate` |
| `JWT_SECRET`             | ✅       | Any strong random string                                          |
| `PORT`                   | —        | Defaults to `4000`                                                |
| `LINE_CHANNEL_SECRET`    | —        | LINE webhook; leave blank to disable                              |
| `LINE_CHANNEL_TOKEN`     | —        | LINE reply API                                                    |
| `LIFF_ID`                | —        | LINE front-end integration                                        |
| `GOOGLE_APPS_SCRIPT_URL` | —        | API-key request logging; leave blank to disable                   |

> Both Supabase connection strings come from **Supabase Dashboard → Project Settings → Database**.
> `DATABASE_URL` and `DIRECT_URL` differ **only in the port** (`6543` vs `5432`).

---

## Backend

```bash
cd backend

npm run dev          # watch mode → http://localhost:4000
npm run build        # compile to dist/
npm start            # run the compiled server (dist/backend/src/main.js)
npm run typecheck    # tsc --noEmit, must exit 0
```

### Database (Prisma)

The schema and data already live on Supabase. You only need these if you change the schema or reset data:

```bash
npm run prisma:migrate   # create + apply a new migration (uses DIRECT_URL)
npm run db:seed          # re-seed hospitals + demo account
```

### Hospital API keys

```bash
npm run key:gen -- --org="โรงพยาบาล X" --hospital-id="klang"
npm run key:revoke -- --id="<key-id>"
```

---

## Frontend

```bash
cd frontend

npm run dev          # → http://localhost:5173
npm run typecheck    # must exit 0
npm run build        # outputs to frontend/dist/
```

The dev server proxies `/api` → `http://localhost:4000`, so start the backend first.

---

## Testing

The backend test suite talks to a **local Postgres** (never Supabase — the tests wipe every table between runs, and `src/test/setup.ts` refuses to run against a non-local database). This is the only place Docker is needed.

```bash
# 1. Start local Postgres (once)
docker compose up -d

# 2. Prepare the test database (first time only)
cd backend
DATABASE_URL="postgresql://carekan:carekan@localhost:5432/carekan_test?schema=public" \
  npx prisma migrate deploy

# 3. Run tests
npm test
```

---

## Troubleshooting

**`npm.ps1 cannot be loaded because running scripts is disabled`** (PowerShell)

Windows blocks script execution by default. Enable it for your user once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then reopen the terminal. Alternatively use Git Bash / CMD, or run `npm.cmd run dev`.

**`Missing env var: DATABASE_URL` / `JWT_SECRET`**

`backend/.env` is missing or incomplete — see [Environment](#environment).
