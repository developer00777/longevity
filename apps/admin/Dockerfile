# ── Admin Dashboard (React + Vite) ────────────────────────────────────────────
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package (workspace dependency)
COPY packages/shared ./packages/shared

# Copy admin app
COPY apps/admin ./apps/admin

# Copy root workspace manifests
COPY package.json turbo.json tsconfig.base.json ./

# Install deps
RUN npm install --legacy-peer-deps --ignore-scripts

WORKDIR /app/apps/admin

# Build args — injected at build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_AGORA_APP_ID
ARG VITE_SENTRY_DSN
ARG VITE_APP_ENV=production
ARG VITE_BASE_URL=/admin

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_AGORA_APP_ID=$VITE_AGORA_APP_ID
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_BASE_URL=$VITE_BASE_URL

# Vite build outputs to dist/
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# SPA fallback
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n  gzip on;\n  gzip_types text/plain text/css application/javascript application/json;\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
