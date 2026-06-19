# Hackatech -- CareKan

CareKan is a hospital appointment booking platform for Thai citizens.

## Backend

### Prerequisites

- Docker (for Postgres)
- Node.js 18+

### Run Steps

```bash
# 1. Start Postgres
docker compose up -d

# 2. Install dependencies
cd backend && npm install

# 3. Configure environment
cp .env.example .env
# then open .env and set JWT_SECRET to a strong random string

# 4. Create database tables
npx prisma migrate dev

# 5. Seed data (9 hospitals + demo accounts)
npm run db:seed

# 6. Start the API server
npm run dev
# → http://localhost:4000
```

### Demo Accounts (password: `care1234`)

| Role    | National ID   |
|---------|---------------|
| citizen | 1234567890123 |
| admin   | 9876543210987 |

## Frontend

### Prerequisites

- Node.js 20+ (22 recommended)

### Run Steps

```bash
# From repo root
cd frontend && npm install

# Start dev server (proxies /api → localhost:4000)
npm run dev
# → http://localhost:5173
```

### Build

```bash
npm run typecheck   # must exit 0
npm run build       # outputs to frontend/dist/
```

## Run the Whole App

Three terminals, backend must be seeded first (see Backend → Run Steps above).

```bash
# Terminal 1 – Postgres
docker compose up -d

# Terminal 2 – API server
cd backend && npm run db:seed   # first time only
npm run dev                     # → http://localhost:4000

# Terminal 3 – Frontend dev server
cd frontend && npm run dev      # → http://localhost:5173 (proxies /api → :4000)
```

Open **http://localhost:5173**

### Demo Accounts (password: `care1234`)

| Role    | National ID   |
|---------|---------------|
| citizen | 1234567890123 |
| admin   | 9876543210987 |

