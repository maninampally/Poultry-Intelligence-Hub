# Quick Start — Full Stack

Get Poultry Intelligence running locally in 5 minutes.



---

## With Docker Compose (Easiest)

### 1. Start all services

```bash
docker-compose up
```

Wait for all containers to be healthy:
```
✓ postgres   healthy
✓ redis      healthy
✓ fastapi    healthy  (port 8000)
✓ worker     running
✓ api        ready    (port 8000)
```

### 2. Visit the app

- **FastAPI docs:** http://localhost:8000/docs (OpenAPI)
- **Health check:** http://localhost:8000/health
- **Mobile app:** run Expo from `apps/mobile`

### 3. Test the stack

Open a new terminal and run a sync push:

```bash
# Create an org + flock first (via SQL or the API)
# Then test sync:

curl -X POST http://localhost:8000/api/v1/sync/push \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "operations": [
      {
        "idempotency_key": "mortality-001",
        "table_name": "mortality_records",
        "operation": "insert",
        "record_id": "your-record-id",
        "data": {"count": 5, "reason": "heat stress"}
      }
    ]
  }'

# Should return:
# {
#   "results": [{"status": "accepted", ...}],
#   "summary": {"total": 1, "accepted": 1, ...}
# }
```

### 4. Stop everything

```bash
docker-compose down
```

---

## Manual Setup (More control)

### Prerequisites

- Python 3.11+
- Redis (brew install redis on macOS, or https://redis.io)
- PostgreSQL (Docker or local)
- Node.js 18+

### 1. Database

```bash
# Start Postgres (Docker)
docker run --name postgres -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:17-alpine

# OR use local: psql -h localhost -U postgres

# Apply migrations
supabase db push

# Verify tables exist
psql -h localhost -U postgres -d poultry_intelligence -c "\dt"
```

### 2. Redis

```bash
# macOS
brew services start redis
redis-cli PING  # Should return PONG

# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server

# Windows (WSL2)
wsl
redis-server
```

### 3. Python Backend

```bash
# Terminal 1: FastAPI
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt

# Copy environment
cp .env.example .env
# Edit .env if needed (DATABASE_URL, REDIS_URL, JWT_SECRET)

# Start server
uvicorn app.main:app --reload --port 8000
# API running at http://localhost:8000
```

### 4. Celery Worker

```bash
# Terminal 2: Worker
cd apps/worker
source venv/bin/activate  # Windows: venv\Scripts\activate
celery -A worker.celery_app worker --loglevel=info
# Worker ready for tasks
```

### 5. Mobile app

```bash
cd apps/mobile
npm install
npm start
# Open with Expo Go or a development build
```

### 6. Test sync

```bash
# Terminal 4: Test
curl http://localhost:8000/health
# {
#   "status": "ok",
#   "timestamp": "...",
#   "version": "1.0.0"
# }
```

---

## File Structure

```
Poultry-Intelligence-Hub/
├── apps/api/                 # FastAPI backend
│   ├── main.py             # App initialization
│   ├── db.py               # Database connection pool
│   ├── auth.py             # JWT auth
│   └── routes/             # API endpoints
├── apps/worker/              # Celery worker
│   ├── celery_app.py       # Celery config
│   └── tasks.py            # Async tasks
├── apps/mobile/               # Expo React Native app
├── supabase/
│   └── migrations/         # SQL migrations
├── docker-compose.yml      # 4 services: postgres, redis, api, worker
├── Dockerfile.api          # FastAPI container
├── Dockerfile.worker       # Celery container
├── requirements.txt        # Python dependencies
└── README.md               # Overview
```

---

## Troubleshooting

### "Connection refused: localhost:8000"
- FastAPI not running? Check Terminal 1: `uvicorn api.main:app --reload`
- Wrong port? Edit docker-compose.yml or `--port 8001`

### "Celery worker not connecting to Redis"
- Redis not running? `redis-server` or `brew services start redis`
- Check Redis: `redis-cli PING` should return PONG
- Check Celery logs for connection errors

### "Database connection error"
- Postgres not running? Start it: `docker run ... postgres:17-alpine`
- Wrong credentials? Check `DATABASE_URL` in `.env`
- Migrations not applied? Run `supabase db push`

### "Frontend says 'Cannot reach API'"
- API not running? Check Terminal 1
- Wrong VITE_API_URL? Check `.env` or docker-compose.yml
- CORS error? Check `ALLOWED_ORIGINS` in FastAPI config

### "Event inserted but metrics not updating"
- Worker not running? Check Terminal 2
- Task not enqueued? Check Celery logs for errors
- Manual rebuild: `SELECT rebuild_batch_metrics('batch-id')`

---

## Next Steps

1. **Explore the API** → http://localhost:8000/docs (interactive OpenAPI)
2. **Read the docs** → `docs/FASTAPI_SETUP.md` for full reference
3. **Test sync flow** → Create batch → Add mortality → Check sync push/pull
4. **Check system design** → `docs/SYSTEM_DESIGN.md` for architecture
5. **Monitor worker** → `pip install flower && flower -A worker.celery_app` (http://localhost:5555)

---

## Environment Variables

Key ones (see `.env.example` for all):

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/poultry_intelligence

# Redis (Celery broker)
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_SECRET=your-secret-key-at-least-32-characters-long

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend points to API
VITE_API_URL=http://localhost:8000
```

---

## Running in Production

For AWS/Render/etc., see `docs/FASTAPI_SETUP.md` → "Production deployment" section.

Quick summary:
- Use managed Postgres (Supabase, AWS RDS)
- Use managed Redis (Upstash, AWS ElastiCache)
- Deploy FastAPI + Celery worker to Render / AWS ECS
- Deploy React to Netlify / Vercel

---

Generated: 2026-09-14
