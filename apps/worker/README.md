# Worker

Background processor for queued ingestion jobs and asynchronous event handling.

## Built With

- Bun
- BullMQ
- Redis
- Drizzle + PostgreSQL/TimescaleDB

## Quick Dev Setup

From repo root:

```bash
bun install
cp .env.example .env
docker compose up -d db redis
bun run dev --filter=@repo/worker
```
