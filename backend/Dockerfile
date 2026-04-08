# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# 安裝 gcc（go-ethereum cgo 需要）
RUN apk add --no-cache gcc musl-dev

# 先複製 go.mod / go.sum，利用 Docker 快取層加速
COPY go.mod go.sum ./
RUN go mod download

# 複製全部原始碼並編譯
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o server ./

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM alpine:3.20

WORKDIR /app

# 執行階段只需要 ca-certificates（HTTPS 呼叫用）
RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
