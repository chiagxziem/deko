FROM oven/bun:1.3.3 AS base

# --- PREPARE STAGE ---
FROM base AS prepare
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.6.1

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune web --docker

# --- BUILDER STAGE ---
FROM base AS builder
WORKDIR /app

# Prune and copy dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .

# Install dependencies
RUN bun install --no-save --frozen-lockfile

# Copy the rest of the files (as they change more often)
COPY --from=prepare /app/out/full/ .

# Build the app
RUN bunx turbo run build

# --- RUNNER STAGE ---
FROM base AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

ENTRYPOINT [ "bun", "apps/web/server.js" ]