FROM oven/bun:1-alpine AS deps

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_API_URL

# Set environment variables for build
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Debug: Show environment variables before build
RUN echo "=== BUILD ENVIRONMENT VARIABLES ===" && \
    echo "NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL" && \
    echo "NEXT_PUBLIC_APP_NAME: $NEXT_PUBLIC_APP_NAME" && \
    echo "=== END BUILD ENV VARS ==="

# Limit Node.js memory to trigger GC earlier instead of getting OOM-killed
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN bun run build

FROM node:24-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs \
    && adduser -u 1001 -S -G nodejs nextjs

COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static

# Create .next directory with proper permissions for cache
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

EXPOSE 80

ENV HOSTNAME="0.0.0.0"
ENV PORT=80

# Runtime environment variables with placeholders
ENV NEXT_PUBLIC_APP_NAME="NEXT_PUBLIC_APP_NAME_PLACEHOLDER"
ENV NEXT_PUBLIC_API_URL="NEXT_PUBLIC_API_URL_PLACEHOLDER"

USER nextjs

CMD ["node", "server.js"]
