# Multi-stage production image for Rare Oud (Next.js 15 standalone + Prisma + WA worker).
# Runs as non-root user `nextjs` (uid 1001).
# No apt-get in any stage — avoids flaky Debian mirrors on some hosts.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm config set registry "$NPM_REGISTRY" \
  && npm config set fetch-retries 8 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 300000 \
  && npm config set fetch-timeout 600000 \
  && npm ci --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ARG DATABASE_URL=postgresql://rareoud:rareoud@postgres:5432/rareoud?schema=public
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
RUN npm run build
# Keep tsx for the WhatsApp worker entry (TypeScript). Prune other devDeps.
RUN npm prune --omit=dev && npm install tsx@4.19.3 --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/public/uploads /app/.wa-auth /app/backups \
  && chown -R nextjs:nodejs /app/public/uploads /app/.wa-auth /app/backups /app/node_modules

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
