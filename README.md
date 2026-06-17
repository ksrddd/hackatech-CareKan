# CareKan

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
