# API

Backend service for ingestion, querying, service management, and dashboard endpoints.

## Built With

- Hono
- Zod
- Drizzle
- PostgreSQL/TimescaleDB
- Redis

## Quick Dev Setup

From repo root:

```bash
bun install
cp .env.example .env
docker compose up -d db redis
bun run dev --filter=@repo/api
```

Default local URL: `http://localhost:8000`
