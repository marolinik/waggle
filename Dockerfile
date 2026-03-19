# Waggle Server — Production Docker Image
# Multi-stage build: install deps + build frontend, then run server

FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY packages/agent/package.json packages/agent/
COPY packages/server/package.json packages/server/
COPY packages/shared/package.json packages/shared/
COPY packages/sdk/package.json packages/sdk/
COPY packages/marketplace/package.json packages/marketplace/
COPY packages/optimizer/package.json packages/optimizer/
COPY packages/weaver/package.json packages/weaver/
COPY packages/worker/package.json packages/worker/
COPY packages/waggle-dance/package.json packages/waggle-dance/
COPY packages/ui/package.json packages/ui/
COPY packages/launcher/package.json packages/launcher/
COPY app/package.json app/

# Install all dependencies (including dev for building)
RUN npm install --ignore-scripts 2>/dev/null || npm install

# Copy source code
COPY packages/ packages/
COPY app/ app/
COPY tsconfig*.json ./
COPY vitest*.ts ./

# Build the React frontend
RUN cd app && npm run build

# ── Production image ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install native dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy workspace config
COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY packages/agent/package.json packages/agent/
COPY packages/server/package.json packages/server/
COPY packages/shared/package.json packages/shared/
COPY packages/sdk/package.json packages/sdk/
COPY packages/marketplace/package.json packages/marketplace/
COPY packages/optimizer/package.json packages/optimizer/
COPY packages/weaver/package.json packages/weaver/
COPY packages/worker/package.json packages/worker/
COPY packages/waggle-dance/package.json packages/waggle-dance/
COPY packages/ui/package.json packages/ui/
COPY packages/launcher/package.json packages/launcher/

# Install production dependencies only
RUN npm install --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev
# Rebuild native modules for Alpine
RUN npm rebuild better-sqlite3 2>/dev/null || true

# Copy source + built frontend
COPY packages/ packages/
COPY --from=builder /app/app/dist app/dist

# Set environment
ENV NODE_ENV=production
ENV WAGGLE_FRONTEND_DIR=/app/app/dist
ENV WAGGLE_DATA_DIR=/data

# Expose server port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost:3333/health || exit 1

# Data volume for persistence
VOLUME ["/data"]

# Start the server
CMD ["npx", "tsx", "packages/server/src/local/start.ts", "--skip-litellm"]
