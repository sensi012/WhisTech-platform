# ── Stage 1: build React application ────────────────────────────────
FROM node:20.15.1-alpine3.20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG BUILD_DATE
ARG GIT_SHA
ENV REACT_APP_BUILD_DATE=$BUILD_DATE \
    REACT_APP_GIT_SHA=$GIT_SHA \
    REACT_APP_API_URL=/api

RUN npm run build

# ── Stage 2: serve with Nginx ────────────────────────────────────────
FROM nginx:1.27.0-alpine3.19 AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/build /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
 && chown -R nginx:nginx /var/cache/nginx \
 && chown -R nginx:nginx /var/log/nginx \
 && touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
