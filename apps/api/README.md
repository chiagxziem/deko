# Deko API

Backend API for the Deko application.

- Built with Hono.
- Uses PostgreSQL for data storage.
- Deployed with Docker.

## Getting Started

1. Copy `.env.example` to `.env` and configure environment variables.
2. Run `bun install` to install dependencies.
3. Run `turbo dev` from the project root to start the API.

See the main project [`README.md`](https://github.com/gozmanthefirst/deko) for more details.

## Issues

- Fetching the timeseries data with the period as 1h, returns an empty array even though there are events/logs in the last 1 hour.
- The total estimate when fetching slow logs doesn't update immeditely after the query params are changed. Another req has to be made before it gets updated.
