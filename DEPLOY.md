# Production Deployment Guide

Deploy Poultry Intelligence to production (Render, AWS, or similar).

---

## Pre-deployment Checklist

- [ ] All migrations applied to Postgres
- [ ] Environment variables configured (DATABASE_URL, REDIS_URL, JWT_SECRET)
- [ ] Frontend tested locally with FastAPI backend
- [ ] Docker Compose runs locally without errors
- [ ] Celery worker processes tasks (test with dummy task)
- [ ] Sync push/pull tested end-to-end
- [ ] RLS policies verified (cross-org access blocked)

---

## Deployment Options

### Option 1: Render (Recommended for MVP)

Managed platform, auto-scaling, minimal DevOps.

#### Services

1. **Web Service: FastAPI API**
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn api.main:app --host 0.0.0.0 --port 8000`
   - Environment: Attach PostgreSQL + Redis databases
   - Auto-scaling: 2–5 instances (scale on CPU/memory)

2. **Background Worker: Celery**
   - Build: Same as FastAPI
   - Start: `celery -A worker.celery_app worker --loglevel=info --concurrency=4`
   - Scaling: 1–4 workers (add instances as queue depth grows)

3. **Static Site: React Frontend**
   - Build: `npm install && npm run build`
   - Publish dir: `dist`
   - Environment: `VITE_API_URL=https://api.murgimitra.com`
   - CDN: Render includes CloudFlare CDN

#### Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@prod-db.internal:5432/poultry_intelligence
REDIS_URL=redis://prod-redis.internal:6379/0
JWT_SECRET=<generate 32+ chars: openssl rand -hex 32>
ALLOWED_ORIGINS=https://app.murgimitra.com,https://api.murgimitra.com
NODE_ENV=production
```

#### DNS Setup

Point your domain DNS to Render:
```
app.murgimitra.com  → CNAME render.com frontend
api.murgimitra.com  → CNAME render.com fastapi service
```

#### Deploy

```bash
# Connect repo to Render via GitHub
# Render auto-deploys on push to main branch
git push origin main
```

---

### Option 2: AWS ECS (For scale)

Horizontal pod autoscaling, multi-region ready.

#### Infrastructure

```
AWS ALB (Application Load Balancer)
  ├── FastAPI Service (ECS on 8000)
  │   └── Auto-scale 2–10 instances (CPU > 70%)
  ├── Celery Worker (ECS on background)
  │   └── Auto-scale 1–4 workers
  └── React Static (CloudFront CDN)

RDS Postgres (Supabase or managed)
  └── Multi-AZ for HA

ElastiCache Redis
  └── cluster mode for scale
```

#### Deploy Docker

```bash
# 1. Push image to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker build -f Dockerfile.api -t murgi-api:latest .
docker tag murgi-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/murgi-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/murgi-api:latest

# Similar for Dockerfile.worker

# 2. Create ECS task definitions pointing to ECR images
# 3. Create ECS services with auto-scaling policies
# 4. Attach load balancer
# 5. Configure CloudFront for React frontend
```

#### Scaling Policies

| Service | Trigger | Scale To |
|---------|---------|----------|
| FastAPI | CPU > 70% for 1 min | +1 instance |
| FastAPI | CPU < 30% for 5 min | -1 instance |
| Worker | Queue depth > 100 | +1 worker |
| Worker | Queue depth < 10 | -1 worker |

---

### Option 3: Kubernetes (For 100k+ farmers)

Cloud-agnostic, maximum flexibility, steep learning curve.

#### Helm Chart

```yaml
# values.yaml
fastapi:
  replicas: 3
  resources:
    requests: {cpu: 500m, memory: 512Mi}
    limits: {cpu: 1000m, memory: 1Gi}
  autoscaling: {minReplicas: 2, maxReplicas: 10, targetCPU: 70}

celery:
  replicas: 2
  concurrency: 4
  autoscaling: {minReplicas: 1, maxReplicas: 8}

postgres:
  # Use managed RDS/Cloud SQL, not pod
  connectionString: postgresql://...

redis:
  # Use managed Upstash / ElastiCache, not pod
  connectionString: redis://...
```

#### Deploy

```bash
helm install murgi ./helm/murgi --namespace default
kubectl get pods  # Monitor pods
kubectl logs -f pod/murgi-api-xyz  # View logs
```

---

## Database Setup

### Supabase (Recommended)

1. Create project at https://supabase.com
2. Get connection string from Settings → Database
3. Run migrations:
   ```bash
   DATABASE_URL=postgresql://... supabase db push
   ```
4. Enable RLS on all tables (default in our migrations)
5. Set up read replica for dashboard queries (optional, Supabase Pro+)

### AWS RDS

1. Create Postgres instance (t3.small minimum, 20GB storage)
2. Enable backups (automatic daily)
3. Set parameter group to enable RLS
4. Get endpoint from AWS console
5. Run migrations:
   ```bash
   psql postgresql://... < supabase/migrations/001_auth_init.sql
   # ... etc
   ```

### Google Cloud SQL

Similar to RDS, use managed Postgres instance with backups.

---

## Redis Setup

### Upstash (Easy, no infra)

1. Create DB at https://upstash.com
2. Get connection string (redis://...)
3. Set `REDIS_URL` environment variable
4. Done

### AWS ElastiCache

1. Create Redis cluster (cache.t3.micro minimum)
2. Enable encryption at rest + in transit
3. Set security group to allow app access
4. Get endpoint
5. Set `REDIS_URL=redis://endpoint:6379/0`

### Self-hosted

Only if you have Redis ops expertise. Generally not recommended for MVP.

---

## CI/CD Pipeline

### GitHub Actions (Optional)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest tests/  # If you add tests

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Deploy to Render / AWS / etc
```

---

## Monitoring & Observability

### Application Logging

```python
# In FastAPI (already set up with Python logging)
import logging
logger = logging.getLogger(__name__)
logger.info(f"Sync push from {auth.user_id}")

# Send to Cloudwatch / Datadog / etc via handlers
```

### Errors

Set up Sentry:

```bash
pip install sentry-sdk

# In api/main.py
import sentry_sdk
sentry_sdk.init(
    dsn="https://your-sentry-key@sentry.io/project-id",
    traces_sample_rate=0.1,
    environment="production"
)
```

### Performance

```bash
pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-jaeger

# Export metrics to Datadog / New Relic / Jaeger
```

### Database

Enable `pg_stat_statements`:

```sql
CREATE EXTENSION pg_stat_statements;
SELECT query, calls, mean_time FROM pg_stat_statements
  ORDER BY mean_time DESC LIMIT 10;
```

### Worker Health

Monitor Celery with Flower:

```bash
pip install flower
celery -A worker.celery_app events &
flower -A worker.celery_app --port 5555
# http://api.murgimitra.com:5555 (with auth)
```

---

## Secrets Management

### Never commit secrets

```bash
# .env should be .gitignored
# Use environment variables or secrets manager
```

### Render Secrets

Settings → Environment → Add Secret:
```
DATABASE_URL: postgresql://...
REDIS_URL: redis://...
JWT_SECRET: <random 32 chars>
```

### AWS Secrets Manager

```bash
aws secretsmanager create-secret --name murgi/prod --secret-string '{
  "DATABASE_URL": "postgresql://...",
  "REDIS_URL": "redis://...",
  "JWT_SECRET": "..."
}'

# In ECS task definition, reference secret ARN
```

---

## Backup & Disaster Recovery

### Database

- **Supabase:** Automatic daily backups, 14-day retention
- **AWS RDS:** Enable automated backups, 35-day retention
- Test restore: Monthly restore to staging environment

### Redis

- Not critical (temporary queue); ephemeral data
- Can rebuild from scratch if lost
- Optional: Enable AOF (append-only file) for persistence

### Code

- GitHub is your backup
- Tag production releases: `git tag v1.0.0 && git push origin v1.0.0`

---

## Performance Tuning

### Database Connection Pool

Currently: `min_size=5, max_size=20`

Increase for higher throughput:

```python
# api/db.py
await asyncpg.create_pool(
    database_url,
    min_size=10,   # ← increase
    max_size=50,   # ← increase
)
```

### Celery Concurrency

Currently: Default workers

Tune for your hardware:

```bash
# For 4vCPU machine
celery -A worker.celery_app worker --concurrency=8 --prefetch-multiplier=4
```

### Database Indexes

Already in migrations:
- `(org_id, batch_id, occurred_at)` on farm_events
- `(org_id)` on batch_metrics
- `(org_id, device_id, idempotency_key)` on sync_idempotency

Add if slow queries appear:
```sql
CREATE INDEX idx_batch_metrics_live ON batch_metrics(org_id, live_birds DESC);
```

---

## Security Checklist

- [ ] JWT_SECRET is 32+ random characters (not in code)
- [ ] DATABASE_URL uses credentials, not hardcoded password
- [ ] HTTPS enforced (Render/AWS auto-provision SSL)
- [ ] CORS allows only your frontend domain
- [ ] Database has RLS policies (verify with `\d table_name`)
- [ ] No debug mode in production (`NODE_ENV=production`)
- [ ] Secrets not logged (check logs for DATABASE_URL)
- [ ] Rate limiting configured (optional, Redis-based)
- [ ] Backups automated + tested

---

## Health Checks

### API

```bash
curl https://api.murgimitra.com/health
# {
#   "status": "ok",
#   "timestamp": "2026-09-14T12:00:00.000000",
#   "version": "1.0.0"
# }
```

Set up monitoring (UptimeRobot, Pingdom):
```
Check: https://api.murgimitra.com/health
Interval: 5 minutes
Retry: 3 times before alert
```

### Worker

```bash
celery -A worker.celery_app inspect active
celery -A worker.celery_app inspect stats
```

Flower dashboard:
```
https://flower.murgimitra.com (internal only)
```

---

## Rollback Plan

If deployment goes wrong:

1. **Revert code:** `git revert HEAD && git push origin main`
2. **Render auto-redeploys** previous version
3. **Database:** No schema changes in this release (migrations are additive)
4. **Redis:** Ephemeral; queue will rebuild automatically

---

## Post-Deployment

1. Test sync flow end-to-end (farmer → API → worker → metrics → pull)
2. Monitor logs for errors (Sentry, Datadog, CloudWatch)
3. Check database load (pg_stat_statements)
4. Verify backups working (Supabase console)
5. Run security scan (OWASP Top 10)
6. Load test (simulate 1000 farmers syncing)

---

## Costs (Monthly Estimate)

| Service | Plan | Cost |
|---------|------|------|
| Postgres (Supabase) | Pro | $25 |
| Redis (Upstash) | Pay-as-you-go | $5–50 |
| FastAPI (Render) | Standard | $12/instance × 2–3 = $24–36 |
| Worker (Render) | Standard | $12/instance × 1–2 = $12–24 |
| Frontend (Netlify/Render) | Free | $0 |
| **Total** | | **$65–135/month** |

At 100,000 farmers with regional deployment + monitoring, expect **$1,000–2,000/month**.

---

## Support

- API docs: https://api.murgimitra.com/docs
- System design: See `docs/SYSTEM_DESIGN.md`
- Setup guide: See `docs/FASTAPI_SETUP.md`
- Local dev: See `QUICKSTART.md`

---

Generated: 2026-09-14
