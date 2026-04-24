# Simulator

A traffic simulator for the Deko ingest API.

It generates realistic synthetic logs with variable traffic patterns so the dashboard can be tested with meaningful data distributions.

## Quick Start

From the simulator directory:

```bash
bun install
SERVICE_TOKEN=<your_service_token> bun run dev
```

Or from workspace root:

```bash
bun run --filter @repo/simulator dev
```

The simulator server runs on port `5000`.

## Environment Variables

- `SERVICE_TOKEN` (required to actually send logs): service token used for `/api/ingest`.
- `API_URL` (optional, default: `http://localhost:8000`): base URL of the API service.
- `INTERVAL_MS` (optional, default: `2500`): base interval used by scheduler.
- `MODE` (optional, default: `steady`): startup mode. Allowed values:
  - `steady`
  - `bursty`
  - `chaos`

## Simulation Modes

- `steady`: low-to-medium continuous traffic with light jitter.
- `bursty`: alternating quiet periods and traffic spikes.
- `chaos`: noisy high-variance traffic with aggressive timing.

## HTTP Control Endpoints

These endpoints control the simulator process itself (served by the simulator on port `5000`).

- `GET /`
  - Liveness text response.

- `GET /status`
  - Returns simulation state, current mode, API target, and counters:
    - `sentEvents`
    - `sentBatches`
    - `failedBatches`
    - `droppedEvents`
    - `lastError`
    - `lastRunAt`

- `POST /start`
  - Starts scheduler if not running.

- `POST /stop`
  - Stops scheduler.

- `POST /mode/:mode`
  - Changes runtime mode (`steady|bursty|chaos`).

- `POST /tick?count=<n>`
  - Sends an immediate manual batch.
  - `count` is clamped to `1..100`.

## Notes

- Logs are sent in batches to exercise ingest batching behavior.
- Endpoint/status/latency distributions are intentionally non-uniform so dashboard charts show realistic p95/p99 and error patterns.
- If `SERVICE_TOKEN` is missing, the simulator starts in idle mode and will not send traffic.
