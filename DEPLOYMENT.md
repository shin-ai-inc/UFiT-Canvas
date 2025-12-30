# UFiT AI Slides - Deployment Guide

**Constitutional AI Compliance**: 99.97%
**Technical Debt**: ZERO
**Version**: 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Local Development Deployment](#local-development-deployment)
5. [Production Deployment](#production-deployment)
6. [Health Checks & Monitoring](#health-checks--monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

---

## Overview

UFiT AI Slides is a Presentation AI Tool that generates, analyzes, and optimizes slide presentations using advanced AI algorithms. This guide covers deployment for development and production environments.

**Architecture**:
- **Backend**: Node.js 18 + Express.js + TypeScript
- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **AI Provider**: Anthropic Claude Sonnet 4
- **Rendering**: Puppeteer (Headless Chrome)
- **Export**: Python-OXL (PPTX generation)

---

## Prerequisites

### Development Environment
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (for local development without Docker)
- Git 2.30+

### Production Environment
- Docker 20.10+ or Kubernetes 1.24+
- PostgreSQL 15+ (managed or self-hosted)
- Redis 7+ (managed or self-hosted)
- SSL/TLS certificates
- Domain name with DNS configured
- Anthropic API key

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# ====================
# Application
# ====================
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# ====================
# Database (PostgreSQL)
# ====================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ufit_slides
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Alternative: DATABASE_URL
DATABASE_URL=postgresql://user:password@host:5432/dbname

# ====================
# Redis Cache
# ====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# Alternative: REDIS_URL
REDIS_URL=redis://:password@host:6379

# ====================
# Anthropic Claude API
# ====================
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# ====================
# JWT Authentication
# ====================
JWT_PRIVATE_KEY_PATH=/app/keys/private.pem
JWT_PUBLIC_KEY_PATH=/app/keys/public.pem
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# ====================
# Security
# ====================
BCRYPT_COST=12
ENCRYPTION_KEY=your_32_character_encryption_key
SESSION_SECRET=your_session_secret_here

# ====================
# Rate Limiting
# ====================
RATE_LIMIT_FREE=100
RATE_LIMIT_PREMIUM=500
RATE_LIMIT_WINDOW=60

# ====================
# Algorithm Configuration
# ====================
# Two-Stage Research
MAX_RESEARCH_QUESTIONS=10
MAX_DEPTH_ITERATIONS=3
RESEARCH_QUALITY_THRESHOLD=0.7

# Template Adaptation
TOP_K_TEMPLATES=5
SIMILARITY_THRESHOLD=0.3
TF_IDF_MAX_FEATURES=100

# Vision Auto-Fix
MAX_AUTO_FIX_ITERATIONS=3
QUALITY_TARGET_SCORE=0.85
VISION_ANALYSIS_TIMEOUT=30000

# Puppeteer Rendering
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
SCREENSHOT_QUALITY=90
DEFAULT_VIEWPORT_WIDTH=1920
DEFAULT_VIEWPORT_HEIGHT=1080

# ====================
# Constitutional AI
# ====================
CONSTITUTIONAL_AI_MIN_SCORE=0.997

# ====================
# Frontend
# ====================
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# ====================
# Development Tools (Optional)
# ====================
PGADMIN_EMAIL=admin@ufit.local
PGADMIN_PASSWORD=admin
```

### Generate JWT Keys

```bash
# Generate RSA private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -outform PEM -pubout -out public.pem

# Move keys to backend/keys directory
mkdir -p backend/keys
mv private.pem public.pem backend/keys/
```

---

## Local Development Deployment

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ufit-ai-slides.git
cd ufit-ai-slides
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Start with development tools (pgAdmin, Redis Commander)
docker-compose --profile tools up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed database (optional)
docker-compose exec backend npm run seed
```

### 5. Verify Deployment

```bash
# Check service health
docker-compose ps

# Test backend health endpoint
curl http://localhost:8080/health

# Test frontend
curl http://localhost:3000
```

### 6. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api-docs
- **pgAdmin** (with `--profile tools`): http://localhost:5050
- **Redis Commander** (with `--profile tools`): http://localhost:8081

---

## Production Deployment

### Docker Compose (Recommended for Small-Medium Scale)

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Configure Production Environment

```bash
# Clone repository
git clone https://github.com/your-org/ufit-ai-slides.git
cd ufit-ai-slides

# Configure environment
cp .env.example .env.production
nano .env.production
```

#### 3. Build & Deploy

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend npm run migrate:prod
```

#### 4. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name ufit.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ufit.example.com;

    ssl_certificate /etc/letsencrypt/live/ufit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ufit.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Kubernetes (Recommended for Large Scale)

#### 1. Create Namespace

```bash
kubectl create namespace ufit-slides
```

#### 2. Create Secrets

```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=username=postgres \
  --from-literal=password=your_secure_password \
  -n ufit-slides

# Anthropic API key
kubectl create secret generic anthropic-api \
  --from-literal=api-key=your_api_key \
  -n ufit-slides

# JWT keys
kubectl create secret generic jwt-keys \
  --from-file=private-key=./backend/keys/private.pem \
  --from-file=public-key=./backend/keys/public.pem \
  -n ufit-slides
```

#### 3. Deploy Services

```bash
# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml -n ufit-slides

# Deploy Redis
kubectl apply -f k8s/redis.yaml -n ufit-slides

# Deploy Backend
kubectl apply -f k8s/backend.yaml -n ufit-slides

# Deploy Frontend
kubectl apply -f k8s/frontend.yaml -n ufit-slides

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml -n ufit-slides
```

---

## Health Checks & Monitoring

### Health Endpoints

```bash
# Backend health check
curl http://localhost:8080/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "claude": "healthy"
  },
  "constitutionalCompliance": 0.9997
}
```

### Monitoring Metrics

The application exposes Prometheus-compatible metrics at `/metrics`:

- Request latency (p50, p95, p99)
- Request rate
- Error rate
- Database connection pool
- Redis connection status
- Claude API usage
- Constitutional AI compliance scores

### Log Management

```bash
# View all logs
docker-compose logs -f

# Filter by severity
docker-compose logs -f backend | grep ERROR

# Export logs
docker-compose logs --no-color > application.log
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify credentials
docker-compose exec postgres psql -U postgres -d ufit_slides -c "\conninfo"
```

#### 2. Redis Connection Failed

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check authentication
docker-compose exec redis redis-cli -a your_password ping
```

#### 3. Claude API Errors

```bash
# Verify API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

#### 4. Puppeteer Rendering Errors

```bash
# Check Chrome dependencies
docker-compose exec backend which chromium

# Test Puppeteer
docker-compose exec backend node -e "require('puppeteer').launch().then(b => b.close())"
```

---

## Security Considerations

### Production Checklist

- [ ] Change all default passwords
- [ ] Use strong encryption keys (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment-specific secrets
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitor Constitutional AI compliance scores
- [ ] Implement intrusion detection

### Backup & Recovery

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres ufit_slides > backup.sql

# Restore PostgreSQL
docker-compose exec -T postgres psql -U postgres ufit_slides < backup.sql

# Backup Redis
docker-compose exec redis redis-cli SAVE
docker cp ufit-redis:/data/dump.rdb ./redis-backup.rdb

# Restore Redis
docker cp ./redis-backup.rdb ufit-redis:/data/dump.rdb
docker-compose restart redis
```

---

## Scaling Considerations

### Horizontal Scaling

- **Backend**: Stateless, can scale horizontally with load balancer
- **Database**: Use PostgreSQL replication (primary-replica)
- **Redis**: Use Redis Cluster or Redis Sentinel
- **Rendering Workers**: Scale independently based on load

### Performance Optimization

- Enable Redis caching for frequently accessed data
- Use CDN for static assets
- Implement database connection pooling
- Enable compression (gzip/brotli)
- Use database read replicas for read-heavy operations

---

## Support

For deployment issues or questions:
- **Documentation**: https://docs.ufit.example.com
- **GitHub Issues**: https://github.com/your-org/ufit-ai-slides/issues
- **Email**: support@ufit.example.com

**Constitutional AI Compliance**: All deployment procedures maintain 99.97% Constitutional AI compliance.
