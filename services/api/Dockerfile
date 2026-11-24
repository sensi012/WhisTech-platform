# ── Stage 1: install production dependencies ────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 2: production image ────────────────────────────────────────
FROM node:22-alpine AS production

RUN apk upgrade --no-cache && \
    addgroup -g 1001 -S whistech && \
    adduser  -u 1001 -S whistech -G whistech

WORKDIR /app

COPY --from=deps --chown=whistech:whistech /app/node_modules ./node_modules
COPY --chown=whistech:whistech src/          ./src/
COPY --chown=whistech:whistech package*.json ./

USER whistech

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
