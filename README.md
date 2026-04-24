# Deko

Deko is a self-hosted API observability platform. It ingests API events, stores and aggregates them, and exposes dashboards for logs, errors, status codes, endpoints, and timeseries metrics. It is designed to be easy to run and own.

## Stack

- Runtime and monorepo tooling: Bun + Turborepo
- API: Hono
- Web: React + TanStack Start/Router/Query/Table
- Worker: BullMQ
- Database: PostgreSQL + TimescaleDB (hypertables for time-series data)
- Queue/cache: Redis
- ORM: Drizzle

## Production Setup (Docker Compose)

The root compose file starts these services:

- db (TimescaleDB)
- redis
- api
- worker
- web

### 1. Prepare environment

Copy and edit environment values:

```bash
cp .env.example .env
```

Set at minimum:

- POSTGRES_USER
- POSTGRES_PASSWORD
- ENCRYPTION_KEY
- API_URL
- WEB_URL

### 2. Build and run

```bash
docker compose up -d --build
```

### 3. Verify

```bash
docker compose ps
docker compose logs -f api web worker
```

### 4. Access

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- API reference: `http://localhost:8000/api/reference`

### 5. Stop

```bash
docker compose down
```

Remove volumes as well:

```bash
docker compose down -v
```

## Development

Install dependencies once from repo root:

```bash
bun install
```

Start all apps in dev mode:

```bash
bun run dev
```
