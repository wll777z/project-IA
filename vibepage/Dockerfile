FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
FROM base AS deps
COPY package*.json ./
RUN npm ci
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN BETTER_AUTH_URL=http://localhost:3000 BETTER_AUTH_SECRET=build-only-placeholder-never-use-in-production-123456 npm run build
FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
