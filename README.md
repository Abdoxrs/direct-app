# 🔗 SnapURL — URL Shortener & Analytics API

> A production-ready URL shortening service built with NestJS, PostgreSQL, and Redis — fully containerized with Docker Compose. Features custom aliases, click tracking, GeoIP analytics, TTL-based expiry, and per-user rate limiting.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client / Browser                    │
└────────────────────────┬────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────┐
│              NestJS API (port 3000)                  │
│                                                      │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Auth Module │  │  URL Module │  │ Stats Module│ │
│  │  JWT + Guard │  │  Shorten /  │  │  Analytics  │ │
│  │              │  │  Redirect   │  │  Endpoint   │ │
│  └──────────────┘  └──────┬──────┘  └────────────┘ │
│                           │                          │
│              ┌────────────┴──────────┐               │
│              │     Redis Cache       │               │
│              │  (TTL + Rate Limit)   │               │
│              └────────────┬──────────┘               │
│                           │ cache miss                │
│              ┌────────────▼──────────┐               │
│              │     PostgreSQL        │               │
│              │  urls · clicks · users│               │
│              └───────────────────────┘               │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **URL Shortening** — Generate a short code automatically or provide a custom alias
- **Instant Redirect** — Sub-5ms redirects powered by Redis cache
- **Click Analytics** — Track every click: timestamp, IP, country, city, browser, OS, referrer
- **GeoIP Lookup** — Resolve country and city from visitor IP using `geoip-lite`
- **TTL / Link Expiry** — Set an expiration date per link; expired links return 410 Gone
- **User Accounts** — Register, login, manage your own links with JWT auth
- **Rate Limiting** — Throttle shortening requests per user via Redis sliding window
- **Swagger Docs** — Full OpenAPI 3.0 documentation at `/api/docs`
- **Health Check** — `/health` endpoint reports DB and Redis status
- **Docker Compose** — One command spins up the entire stack

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | NestJS 10 + TypeScript | Modular, decorator-driven architecture |
| Database | PostgreSQL 15 + TypeORM | Relational data, migrations support |
| Cache | Redis 7 | Sub-millisecond reads for redirects |
| Auth | JWT + Passport.js | Stateless, scalable authentication |
| GeoIP | geoip-lite | Offline IP-to-location resolution |
| Validation | class-validator + class-transformer | DTO-level request validation |
| Docs | @nestjs/swagger | Auto-generated from decorators |
| Container | Docker + Docker Compose | Reproducible dev & prod environments |
| Testing | Jest + Supertest | Unit + E2E test coverage |

---

## 📁 Project Structure

```
snapurl/
├── src/
│   ├── main.ts                        # Bootstrap, Swagger setup
│   ├── app.module.ts                  # Root module
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts         # POST /auth/register, /auth/login
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   │
│   ├── urls/
│   │   ├── urls.module.ts
│   │   ├── urls.controller.ts         # POST /urls, GET /:code, DELETE /urls/:id
│   │   ├── urls.service.ts            # Core shorten + redirect logic
│   │   ├── urls.repository.ts         # TypeORM custom queries
│   │   ├── entities/
│   │   │   └── url.entity.ts
│   │   └── dto/
│   │       ├── create-url.dto.ts
│   │       └── url-response.dto.ts
│   │
│   ├── clicks/
│   │   ├── clicks.module.ts
│   │   ├── clicks.service.ts          # Record click + GeoIP resolve
│   │   └── entities/
│   │       └── click.entity.ts
│   │
│   ├── stats/
│   │   ├── stats.module.ts
│   │   ├── stats.controller.ts        # GET /stats/:code
│   │   └── stats.service.ts           # Aggregate analytics queries
│   │
│   ├── cache/
│   │   ├── cache.module.ts
│   │   └── cache.service.ts           # Redis wrapper (get/set/del/ttl)
│   │
│   └── common/
│       ├── guards/
│       │   └── throttle.guard.ts      # Redis-backed rate limiter
│       ├── interceptors/
│       │   └── logging.interceptor.ts
│       └── filters/
│           └── http-exception.filter.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── urls.service.spec.ts
│
├── docker/
│   ├── Dockerfile
│   └── Dockerfile.dev
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .env.test
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2+
- Node.js 18+ (only needed if running outside Docker)

### 1. Clone

```bash
git clone https://github.com/yourusername/snapurl.git
cd snapurl
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)
```

### 3. Start everything

```bash
docker-compose up --build
```

That's it. The API is live at `http://localhost:3000`.

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Swagger docs | http://localhost:3000/api/docs |
| Health check | http://localhost:3000/health |

---

## 🐳 Docker Setup (Full Detail)

### `docker/Dockerfile` (production — multi-stage)

```dockerfile
# ── Stage 1: build ──────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production image ───────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
```

### `docker/Dockerfile.dev` (development — hot reload)

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

### `docker-compose.yml` (development)

```yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### `docker-compose.prod.yml` (production override)

```yaml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: always

  postgres:
    image: postgres:15-alpine
    expose:
      - "5432"            # not exposed to host in prod
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: always

  redis:
    image: redis:7-alpine
    expose:
      - "6379"            # not exposed to host in prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: always

volumes:
  postgres_data:
  redis_data:
```

### Deploy to production

```bash
# Build and start with prod config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View logs
docker-compose logs -f app

# Rebuild app only after a code change
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env`:

```env
# ── App ──────────────────────────────────────────────
PORT=3000
BASE_URL=http://localhost:3000
NODE_ENV=development

# ── JWT ──────────────────────────────────────────────
JWT_SECRET=change_me_to_something_long_and_random
JWT_EXPIRES_IN=7d

# ── PostgreSQL ───────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=snapurl
POSTGRES_USER=snapurl_user
POSTGRES_PASSWORD=supersecretpassword

# ── Redis ────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600

# ── Rate Limiting ────────────────────────────────────
THROTTLE_TTL=60
THROTTLE_LIMIT=20
```

---

## 📡 API Reference

### Auth

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Response `201`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

Response `200`:
```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
```

---

### URLs

#### Shorten a URL

```http
POST /urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "originalUrl": "https://example.com/very/long/path?with=params",
  "alias": "my-link",
  "expiresAt": "2025-12-31"
}
```

Response `201`:
```json
{
  "id": "uuid",
  "shortCode": "my-link",
  "shortUrl": "http://localhost:3000/my-link",
  "originalUrl": "https://example.com/very/long/path?with=params",
  "expiresAt": "2025-12-31T00:00:00Z",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

#### Redirect (public)

```http
GET /:code
```

Returns `301` redirect. Returns `404` if not found, `410` if expired.

#### List my URLs

```http
GET /urls
Authorization: Bearer <token>
```

Response `200`:
```json
[
  {
    "id": "uuid",
    "shortCode": "my-link",
    "shortUrl": "http://localhost:3000/my-link",
    "originalUrl": "https://...",
    "totalClicks": 142,
    "expiresAt": null,
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

#### Delete a URL

```http
DELETE /urls/:id
Authorization: Bearer <token>
```

Response `204 No Content`

---

### Analytics

#### Get stats for a link

```http
GET /stats/:code
Authorization: Bearer <token>
```

Response `200`:
```json
{
  "shortCode": "my-link",
  "originalUrl": "https://...",
  "totalClicks": 142,
  "uniqueIps": 98,
  "clicksByDay": [
    { "date": "2025-01-14", "count": 23 },
    { "date": "2025-01-15", "count": 41 }
  ],
  "topCountries": [
    { "country": "Egypt", "count": 55 },
    { "country": "Saudi Arabia", "count": 32 }
  ],
  "topReferrers": [
    { "referrer": "twitter.com", "count": 60 },
    { "referrer": "direct", "count": 45 }
  ],
  "browsers": {
    "Chrome": 88,
    "Safari": 30,
    "Firefox": 14
  }
}
```

---

## 🗄️ Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | VARCHAR | unique |
| passwordHash | VARCHAR | bcrypt |
| createdAt | TIMESTAMP | |

### `urls`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| shortCode | VARCHAR(20) | unique, indexed |
| originalUrl | TEXT | |
| userId | UUID | FK → users |
| expiresAt | TIMESTAMP | nullable |
| createdAt | TIMESTAMP | |

### `clicks`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| urlId | UUID | FK → urls, indexed |
| ip | VARCHAR | |
| country | VARCHAR | GeoIP resolved |
| city | VARCHAR | GeoIP resolved |
| browser | VARCHAR | parsed user-agent |
| os | VARCHAR | parsed user-agent |
| referrer | VARCHAR | nullable |
| clickedAt | TIMESTAMP | indexed |

---

## ⚙️ Core Logic

### Short Code Generation

```typescript
private generateCode(length = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

### Redis Cache Flow

```
GET /:code
    │
    ├─▶ Redis GET snapurl:<code>
    │       │
    │       ├── HIT  ──────────────────────▶ 301 redirect (< 5ms)
    │       │
    │       └── MISS ──▶ PostgreSQL SELECT
    │                         │
    │                         ├── found ──▶ Redis SET (TTL 1h) ──▶ 301 redirect
    │                         └── not found ──▶ 404
```

### Rate Limiting (Redis sliding window)

```typescript
// throttle.guard.ts — simplified logic
const key = `throttle:${userId}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, THROTTLE_TTL);
if (count > THROTTLE_LIMIT) throw new TooManyRequestsException();
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests (requires running Docker services)
npm run test:e2e

# Coverage report
npm run test:cov
```

Run tests inside Docker:

```bash
docker-compose exec app npm run test
docker-compose exec app npm run test:e2e
```

---

## 📦 Useful Docker Commands

```bash
# Start dev with hot reload
docker-compose up

# Start production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Stop everything
docker-compose down

# Full reset (deletes volumes/data)
docker-compose down -v

# View live logs
docker-compose logs -f app

# Open psql shell
docker-compose exec postgres psql -U snapurl_user -d snapurl

# Open Redis CLI
docker-compose exec redis redis-cli

# Run DB migrations
docker-compose exec app npm run migration:run

# Generate new migration
docker-compose exec app npm run migration:generate -- src/migrations/AddIndexToClicks
```

---

## 🗺️ Roadmap

- [ ] QR code generation per short link
- [ ] Link preview / Open Graph metadata
- [ ] Password-protected links
- [ ] Bulk URL import via CSV
- [ ] Webhook on click event
- [ ] Admin dashboard (React + Next.js)
- [ ] Prometheus + Grafana metrics

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with NestJS · PostgreSQL · Redis · Docker
</div>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
