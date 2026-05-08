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
  - `real`

## Simulation Modes

- `steady`: low-to-medium continuous traffic with light jitter.
- `bursty`: alternating quiet periods and traffic spikes.
- `chaos`: noisy high-variance traffic with aggressive timing.
- `real`: mimics a production app's natural traffic rhythm. Cycles through three tiers in a randomised order:
  - **High** — 30–60 minutes of dense, rapid-fire traffic.
  - **Medium** — 3–5 hours of moderate, steady traffic.
  - **Low** — 8–12 hours of sparse traffic simulating off-peak/overnight.

  The tier order is shuffled each cycle so no two cycles look the same. The same tier is also prevented from running back-to-back across cycle boundaries.

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
  - When in `real` mode, also returns `realPhaseInfo`:
    - `currentTier` — active traffic tier (`high`, `medium`, or `low`).
    - `phaseElapsedMs` — how long the current tier has been running.
    - `phaseDurationMs` — total planned duration for the current tier.
    - `remainingPhases` — the tiers still to run in this cycle.

- `POST /start`
  - Starts scheduler if not running.

- `POST /stop`
  - Stops scheduler.

- `POST /mode/:mode`
  - Changes runtime mode (`steady|bursty|chaos|real`).
  - Switching into `real` mode initialises a fresh traffic cycle immediately.

- `POST /tick?count=<n>`
  - Sends an immediate manual batch.
  - `count` is clamped to `1..100`.

## Notes

- Logs are sent in batches to exercise ingest batching behavior.
- Endpoint/status/latency distributions are intentionally non-uniform so dashboard charts show realistic p95/p99 and error patterns.
- The global error rate is kept below 15%. Each endpoint category has its own error budget that reflects realistic failure rates for that type of route (e.g. auth endpoints are noisier than catalog reads).
- Error messages are varied by status code — expired tokens, circuit breakers, constraint violations, payload limits, and more — rather than generic strings.
- If `SERVICE_TOKEN` is missing, the simulator starts in idle mode and will not send traffic.
