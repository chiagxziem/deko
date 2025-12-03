FROM oven/bun:1.3.3 AS base

# --- Prepare stage ---
FROM base AS prepare
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.6.1

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune web --docker

# --- Builder stage ---
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

# --- Runner stage ---
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

ENTRYPOINT [ "bun", "run", "apps/web/server.js" ]