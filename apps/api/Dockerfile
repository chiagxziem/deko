FROM oven/bun:1.3.3 AS base

# --- Prepare stage ---
FROM base AS prepare
WORKDIR /app

# Install turbo globally
RUN bun add -g turbo@^2.6.1

# Copy everything
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune api --docker

# --- Builder stage ---
FROM base AS builder
WORKDIR /app

# Prune, copy and install dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile

# Copy the rest of the files (as they change more often)
COPY --from=prepare /app/out/full/ .

# Build the app
RUN bunx turbo run build

# --- Runner stage ---
FROM base AS runner
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

# Set environment variables
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=8000

USER bun
EXPOSE 8000

ENTRYPOINT [ "bun", "run", "apps/api/dist/index.js" ]