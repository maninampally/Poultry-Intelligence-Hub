# Murgi Mitra

A practical operating companion for independent Indian broiler farmers. Tracks birds, feed, mortality, expenses, and batch performance — locally or in the cloud.

---

## ✨ Features

- **Offline-first** — works fully in the browser with no account required (demo mode)
- **Cloud sync** — sign up to sync across devices via the FastAPI backend + PostgreSQL
- **Multi-tenant** — each farm business is an isolated organization with Owner / Admin / Worker roles
- **Append-only records** — mortality and feed records preserve history; corrections don't overwrite originals
- **Smart analytics** — dashboards with cost breakdowns, feed runway, mortality trends, weight progress

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TypeScript + Tailwind + shadcn/ui |
| **Backend** | FastAPI (Python 3.11) + asyncpg + SQLAlchemy |
| **Background Jobs** | Celery + Redis |
| **Database** | PostgreSQL 17 with Row-Level Security (RLS) |
| **Authentication** | JWT + bcrypt |
| **Deployment** | Docker + Docker Compose + GitHub Actions |
| **Reverse Proxy** | Nginx |

---

## 🚀 Quick Start (Development)

Get the app running locally in 5 minutes:

### Option 1: Docker Compose (Easiest)

```bash
docker-compose up --build
```

This starts:
- ✅ PostgreSQL database
- ✅ Redis cache/queue
- ✅ FastAPI backend (port 8000)
- ✅ Celery worker
- ✅ React frontend via Nginx (port 3000)

**Access:**
- **Frontend:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### Option 2: Manual Setup (Development)

```bash
# Terminal 1: Frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Terminal 2: Backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Terminal 3: Worker
pip install -r requirements.txt
celery -A worker.celery_app worker --loglevel=info

# Terminal 4: Database
# Use existing PostgreSQL or docker-compose up postgres redis
```

See **[QUICKSTART.md](QUICKSTART.md)** for detailed setup and troubleshooting.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[QUICKSTART.md](QUICKSTART.md)** | Local development setup (Docker or manual) |
| **[docs/CI-CD.md](docs/CI-CD.md)** | GitHub Actions CI/CD pipeline architecture |
| **[docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** | Pre-deployment security review & post-deployment verification |
| **[DEPLOY.md](DEPLOY.md)** | Production deployment options (Render, AWS, Kubernetes) |
| **[docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)** | System architecture and scalability design |
| **[docs/FASTAPI_SETUP.md](docs/FASTAPI_SETUP.md)** | Backend API routes and setup reference |
| **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** | Database schema and entity relationships |
| **[docs/SYNC_PROTOCOL.md](docs/SYNC_PROTOCOL.md)** | Offline sync protocol specification |

---

## 📁 Project Structure

```
murgi-mitra-site/
├── client/                    # React SPA (Vite)
│   └── src/
│       ├── pages/            # Dashboard, Login, Farms, Batches
│       ├── components/       # UI components & feature modules
│       ├── lib/              # Utilities, API client, context
│       └── assets/           # Icons, images, illustrations
│
├── api/                       # FastAPI backend (Python)
│   ├── main.py               # App initialization
│   ├── db.py                 # Database configuration
│   ├── auth.py               # JWT authentication
│   ├── middleware/           # Rate limiting, security headers
│   └── routes/               # API endpoints (farms, batches, sync, etc.)
│
├── worker/                    # Celery background jobs
│   ├── celery_app.py        # Celery configuration
│   └── tasks.py             # Background job handlers
│
├── .github/workflows/        # GitHub Actions CI/CD
│   ├── ci.yml               # Linting, testing, security scanning
│   └── cd.yml               # Docker builds, staging/production deployment
│
├── docs/                      # Comprehensive documentation
│   ├── CI-CD.md             # Pipeline architecture
│   ├── DEPLOYMENT_CHECKLIST.md # Pre/post deployment
│   ├── SYSTEM_DESIGN.md     # Architecture decisions
│   ├── FASTAPI_SETUP.md     # Backend API reference
│   ├── DATA_MODEL.md        # Database schema
│   └── SYNC_PROTOCOL.md     # Offline sync spec
│
├── docker-compose.yml         # Local development services
├── docker-compose.production.yml # Production service definitions
├── Dockerfile                 # React/Nginx frontend build
├── Dockerfile.api             # FastAPI backend build
├── Dockerfile.worker          # Celery worker build
│
├── .env.example              # Environment template
├── .env.production           # Production environment
├── requirements.txt          # Python dependencies
└── package.json              # Node.js dependencies
```

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**Essential variables:**

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/poultry_intelligence

# Cache & Jobs
REDIS_URL=redis://localhost:6379/0

# Authentication
JWT_SECRET=your-secret-key-min-64-characters-for-production

# API Configuration
API_URL=http://localhost:8000          # Development
VITE_API_URL=http://localhost:8000     # Frontend API endpoint

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Environment
NODE_ENV=development
PYTHONUNBUFFERED=1
```

See `.env.example` for complete list of variables.

---

## 🔐 Authentication & Authorization

### Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full CRUD on all org data, invite/remove members, manage roles |
| **Admin** | Full CRUD on farm/batch/mortality data, view organization |
| **Worker** | Log mortality/feed events on assigned sheds only |

### JWT Authentication

All API endpoints (except `/auth/register`, `/auth/login`) require:

```
Authorization: Bearer <jwt-token>
```

Tokens expire after 24 hours. Refresh via `/auth/refresh`.

---

## 📡 API Endpoints

### Authentication

```
POST   /api/v1/auth/register        # Create account
POST   /api/v1/auth/login           # Get JWT token
POST   /api/v1/auth/refresh         # Refresh expired token
GET    /api/v1/auth/me              # Current user + org info
```

### Farms

```
GET    /api/v1/farms                # List user's farms
POST   /api/v1/farms                # Create farm
GET    /api/v1/farms/:id            # Farm details
PUT    /api/v1/farms/:id            # Update farm
```

### Batches

```
GET    /api/v1/batches              # List batches
POST   /api/v1/batches              # Create batch
GET    /api/v1/batches/:id          # Batch details
POST   /api/v1/batches/:id/close    # Close batch
```

### Mortality Logs

```
GET    /api/v1/batches/:id/mortality      # Mortality entries
POST   /api/v1/batches/:id/mortality      # Log mortality (idempotent)
```

### Sync (Offline Support)

```
POST   /api/v1/sync/push            # Upload local changes
GET    /api/v1/sync/pull            # Download server changes
```

**OpenAPI docs:** http://localhost:8000/docs

---

## 🚢 Production Deployment

### Recommended Platforms

1. **Render** (recommended for MVP) — managed platform with auto-scaling
2. **AWS ECS** — containerized services with RDS + ElastiCache
3. **Kubernetes** — self-hosted or managed (GKE, EKS, AKS)
4. **Dokku** — self-hosted, lightweight alternative to Heroku

### Deployment Steps

1. **Prepare servers** — See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
2. **Configure CI/CD** — See [docs/CI-CD.md](docs/CI-CD.md)
3. **Deploy to staging** — Automatic on push to `develop` branch
4. **Deploy to production** — Manual approval on push to `main` branch
5. **Monitor health** — Health checks and alerting

For detailed deployment guide, see **[DEPLOY.md](DEPLOY.md)**.

---

## 🔄 Sync Protocol (Offline Support)

Murgi Mitra supports **offline-first sync**:

```
1. User makes changes locally (no network needed)
2. Changes queued to local IndexedDB
3. When online, POST changes to /api/v1/sync/push
4. Server applies idempotently, returns server state
5. GET /api/v1/sync/pull to merge changes from other devices
6. Conflicts detected and resolved locally
```

For complete specification, see **[docs/SYNC_PROTOCOL.md](docs/SYNC_PROTOCOL.md)**.

---

## 📊 Database Schema

Key tables:

- `organizations` — Farm businesses
- `users` — Team members with roles
- `farms` — Physical farm locations
- `batches` — Bird cohorts (100-10k birds)
- `mortality_entries` — Individual mortality logs (append-only)
- `feed_movements` — Feed usage tracking
- `expenses` — Cost records
- `sync_operations` — Offline changes for client sync
- `device_registrations` — Device identifiers for sync

All tables have **Row-Level Security (RLS)** to prevent cross-organization data leakage.

See **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** for full schema.

---

## 🧪 Testing

### Frontend Tests

```bash
npm run test -- --run          # Run once
npm run test                   # Watch mode
```

### Backend Tests

```bash
pytest api/ --cov=api         # With coverage
pytest api/ -v                # Verbose
```

### E2E Tests

```bash
npm run test:e2e -- --run     # Playwright E2E
```

---

## 🐳 Docker

### Build Images

```bash
# Frontend (Nginx)
docker build -f Dockerfile -t murgi-mitra-web .

# Backend (FastAPI)
docker build -f Dockerfile.api -t murgi-mitra-api .

# Worker (Celery)
docker build -f Dockerfile.worker -t murgi-mitra-worker .
```

### Production Deployment

```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔒 Security

### Features

- ✅ **JWT authentication** with bcrypt password hashing
- ✅ **Row-Level Security (RLS)** in PostgreSQL
- ✅ **CORS** configured for production domains only
- ✅ **Rate limiting** to prevent abuse
- ✅ **Input validation** on all API endpoints
- ✅ **SQL injection prevention** via parameterized queries
- ✅ **XSS protection** via Content Security Policy headers
- ✅ **HTTPS/TLS** with auto-renewal (Let's Encrypt)

### Pre-Deployment Checklist

Before production, verify:
- ✅ All secrets securely managed (not in code)
- ✅ Database passwords are strong and rotated
- ✅ SSL certificates installed and valid
- ✅ Firewall rules restrict to ports 80, 443, 22
- ✅ Rate limiting configured and tested
- ✅ Monitoring and alerting enabled

See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for detailed security review.

---

## 🐛 Troubleshooting

### Docker Compose won't start?

```bash
# Check for port conflicts
docker ps
lsof -i :3000
lsof -i :8000

# Clean up and retry
docker-compose down -v
docker-compose up --build
```

### Tests failing?

```bash
# Backend tests need PostgreSQL
docker-compose up postgres redis
pytest api/ -v

# Frontend tests
npm run test -- --run
```

### Database issues?

```bash
# Check database connection
docker-compose exec postgres psql -U postgres -d poultry_intelligence -c "SELECT 1"

# View logs
docker-compose logs -f postgres
```

### Health check failing?

```bash
# API health
curl http://localhost:8000/health

# Check API logs
docker-compose logs -f api

# Database connection
docker-compose exec postgres pg_isready
```

For more troubleshooting tips, see [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md#7-troubleshooting).

---

## 📝 Development Workflow

### Branch Strategy

- `main` — Production deployments (stable, tested)
- `develop` — Staging deployments (integration branch)
- `feature/*` — Feature branches (PR to develop)

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/mortality-export

# Make changes and commit
git add .
git commit -m "feat: add mortality export to CSV"

# Push and create PR
git push origin feature/mortality-export

# After PR review and merge to develop:
# → Automatic staging deployment

# After merge to main:
# → Build Docker images
# → Staging verification
# → Manual approval for production
# → Production deployment
```

### Commit Message Convention

```
feat: add new feature
fix: bug fix
docs: documentation only
style: formatting
refactor: restructure code
test: add tests
ci: CI/CD configuration
chore: dependencies, build tools
```

---

## 📞 Support & Contributing

### Report Issues

File issues on GitHub with:
- **Descriptive title**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (OS, browser, Docker version)

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Submit a pull request with description

---

## 📄 License

[Specify your license - MIT, Apache 2.0, Commercial, etc.]

---

## 👥 Team

- **Project Lead:** [Name]
- **Backend Engineer:** [Name]
- **Frontend Engineer:** [Name]
- **DevOps/Infrastructure:** [Name]

---

**Last Updated:** September 18, 2026
**Status:** Production Ready
