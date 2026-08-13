# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
# Prisma engines need openssl + glibc shims on Alpine.
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` may evaluate server code, so the client has to exist and the env
# has to parse. Real secrets are injected at runtime, never baked into layers.
ARG DATABASE_URL="postgresql://build:build@127.0.0.1:5439/build?schema=public"
ARG AUTH_SECRET="build-time-placeholder-not-used-at-runtime"
ENV NODE_ENV=production \
    DATABASE_URL=$DATABASE_URL \
    AUTH_SECRET=$AUTH_SECRET
RUN npx prisma generate
RUN npm run build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3059 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# Standalone tracing misses the generated Prisma client often enough to copy it.
COPY --from=build /app/node_modules/.prisma/client ./node_modules/.prisma/client
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads
USER nextjs
EXPOSE 3059
CMD ["node", "server.js"]
