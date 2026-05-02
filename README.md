# Deko

Deko is a self-hosted API observability platform. It ingests API events, stores and aggregates them, and exposes dashboards for logs, errors, status codes, endpoints, and timeseries metrics. It is designed to be easy to run and own.

## Screenshots

> Screenshots will be added here.

<!-- Overview dashboard -->
<!-- Logs page -->
<!-- Error groups -->
<!-- Endpoints leaderboard -->
<!-- Settings -->

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

- pg (TimescaleDB)
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

- PG_USER
- PG_PASSWORD
- ENCRYPTION_KEY
- API_URL
- WEB_URL

### 2. Build and run

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```

### 3. Verify

```bash
docker compose -f docker-compose.prod.yaml ps
docker compose -f docker-compose.prod.yaml logs -f api web worker
```

### 4. Access

- Web: `http://localhost:3000`
- API: `http://localhost:8000`
- API reference: `http://localhost:8000/api/reference`

### 5. Stop

```bash
docker compose -f docker-compose.prod.yaml down
```

Remove volumes as well:

```bash
docker compose -f docker-compose.prod.yaml down -v
```

## Integrating with your API

Once Deko is running you need two things: a **service** and a **token**. A service represents one of your APIs. A token authenticates ingest requests from it.

### 1. Create a service

Open the Deko web UI at `http://localhost:3000`, click **New service**, give it a name, and copy the **service ID** shown in Settings.

### 2. Create a service token

In Settings → Tokens, click **New token**. Copy the token value immediately — it is only shown once.

### 3. Send log events

Send a `POST` request to `/api/ingest` with the token in the `x-deko-service-token` header. You can send a single event or a batch of up to 100.

```http
POST http://localhost:8000/api/ingest
Content-Type: application/json
x-deko-service-token: <your-token>
```

**Single event:**

```json
{
  "level": "info",
  "timestamp": "2026-05-02T12:00:00.000Z",
  "environment": "production",
  "method": "GET",
  "path": "/api/users",
  "status": 200,
  "duration": 42
}
```

**Batch (array):**

```json
[
  {
    "level": "info",
    "timestamp": "2026-05-02T12:00:00.000Z",
    "environment": "production",
    "method": "GET",
    "path": "/api/users",
    "status": 200,
    "duration": 42
  },
  {
    "level": "error",
    "timestamp": "2026-05-02T12:00:01.000Z",
    "environment": "production",
    "method": "POST",
    "path": "/api/orders",
    "status": 500,
    "duration": 310,
    "message": "Database connection timeout"
  }
]
```

**Full event fields:**

| Field         | Type                                                   | Required | Description                                 |
| ------------- | ------------------------------------------------------ | -------- | ------------------------------------------- |
| `level`       | `debug` \| `info` \| `warn` \| `error`                 | ✅       | Log severity                                |
| `timestamp`   | ISO 8601 string                                        | ✅       | When the request was handled                |
| `environment` | string                                                 | ✅       | e.g. `production`, `staging`                |
| `method`      | `GET` \| `POST` \| `PUT` \| `PATCH` \| `DELETE` \| ... | ✅       | HTTP method                                 |
| `path`        | string                                                 | ✅       | Request path                                |
| `status`      | number                                                 | ✅       | HTTP response status code                   |
| `duration`    | number                                                 | ✅       | Response time in milliseconds               |
| `message`     | string                                                 | —        | Human-readable description or error message |
| `sessionId`   | string                                                 | —        | Session or user identifier for grouping     |
| `meta`        | object                                                 | —        | Any additional key/value data               |

Rate limits: **100 requests/second** and **10,000 events/minute** per service token.

The full interactive API reference is available at `http://localhost:8000/api/reference`.

## Development

Install dependencies once from repo root:

```bash
bun install
```

Start all apps in dev mode:

```bash
bun run dev
```
