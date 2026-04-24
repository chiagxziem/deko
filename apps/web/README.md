# Web

Frontend dashboard for viewing logs, metrics, errors, and service settings.

## Built With

- React
- TanStack Start/Router/Query/Table
- Tailwind CSS
- Base UI

## Quick Dev Setup

From repo root:

```bash
bun install
cp .env.example .env
docker compose up -d db redis
bun run dev --filter=@repo/api
bun run dev --filter=@repo/web
```

Default local URL: `http://localhost:3000`
