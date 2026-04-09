# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package.json 並安裝依賴
COPY package.json package-lock.json ./
RUN npm ci

# 複製原始碼並建置
COPY . .

# VITE_CONTRACT_ADDRESS 需在 Railway 環境變數設定，或 build 時傳入
ARG VITE_CONTRACT_ADDRESS
ENV VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS

RUN npm run build

# ---- Runtime Stage ----
FROM nginx:alpine

# 複製 nginx 設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 複製打包後的靜態檔案
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
