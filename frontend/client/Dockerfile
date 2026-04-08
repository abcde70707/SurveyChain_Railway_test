# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_CONTRACT_ADDRESS 在 build time 注入
ARG VITE_CONTRACT_ADDRESS
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_APP_ID
ENV VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_APP_ID=$VITE_APP_ID

RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────
FROM nginx:1.27-alpine

# 移除預設設定，換上自訂設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
