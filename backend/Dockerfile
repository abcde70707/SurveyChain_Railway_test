# ---- Build Stage ----
FROM golang:1.24-alpine AS builder

WORKDIR /app

# 複製 go.mod 和 go.sum 並下載依賴
COPY go.mod go.sum ./
RUN go mod download

# 複製所有原始碼
COPY . .

# 編譯靜態執行檔
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./main.go

# ---- Runtime Stage ----
FROM alpine:latest

WORKDIR /app

# 安裝憑證（HTTPS 連線需要）
RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
