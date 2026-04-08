# ── Build stage ──────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# ── Runtime stage ─────────────────────────────────────────────
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache tzdata ca-certificates

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
