FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files AND Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client (CRITICAL)
RUN npx prisma generate

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps (includes generated Prisma Client)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Ensure public folder exists
RUN mkdir -p public

# Set build-time environment variables if needed
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client again to be safe
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy server files (fix for clientReferenceManifest error)
COPY --from=builder --chown=nextjs:nodejs /app/.next/server ./.next/server

# Copy public folder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma files (CRITICAL)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]