# ── Mobile (Expo Web) ─────────────────────────────────────────────────────────
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy shared package first (workspace dependency)
COPY packages/shared ./packages/shared

# Copy mobile app
COPY apps/mobile ./apps/mobile

# Copy root workspace manifest so npm understands the monorepo
COPY package.json turbo.json tsconfig.base.json ./

# Install all deps from monorepo root
RUN npm install --legacy-peer-deps --ignore-scripts

WORKDIR /app/apps/mobile

# Build args — injected at build time from .env / docker-compose
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_AGORA_APP_ID
ARG EXPO_PUBLIC_FCM_SENDER_ID
ARG EXPO_PUBLIC_SENTRY_DSN
ARG EXPO_PUBLIC_APP_ENV=production

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_AGORA_APP_ID=$EXPO_PUBLIC_AGORA_APP_ID
ENV EXPO_PUBLIC_FCM_SENDER_ID=$EXPO_PUBLIC_FCM_SENDER_ID
ENV EXPO_PUBLIC_SENTRY_DSN=$EXPO_PUBLIC_SENTRY_DSN
ENV EXPO_PUBLIC_APP_ENV=$EXPO_PUBLIC_APP_ENV

# Export Expo web build to /app/apps/mobile/dist
RUN npx expo export --platform web --output-dir dist

# Inject phone-frame CSS so the app looks like a mobile app on desktop.
# Strategy: append a <style> block to index.html that:
#   - Gives body the dark outer shell background
#   - Constrains #root to 430px max-width, centered, full height
#   - Adds a phone-shadow on wider viewports
#   - On narrow screens (<430px) it fills naturally — real mobile experience unchanged
RUN node -e "\
const fs=require('fs');\
const f='/app/apps/mobile/dist/index.html';\
const css='<style>body{background:#040506!important;display:flex;justify-content:center;align-items:flex-start;min-height:100vh;}#root{max-width:430px;width:100%;min-height:100vh;background:#080A0C;position:relative;}@media(min-width:431px){#root{box-shadow:0 0 0 1px #252D36,0 32px 80px rgba(0,0,0,0.8);margin:0 auto;}}</style>';\
fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('</head>',css+'</head>'));\
"

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/mobile/dist /usr/share/nginx/html

# SPA fallback — all routes serve index.html
RUN printf 'server {\n  listen 8081;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n  gzip on;\n  gzip_types text/plain text/css application/javascript application/json;\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
