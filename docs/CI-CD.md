# CI/CD Pipeline Documentation

## Overview

Murgi Mitra uses automated CI/CD pipelines with **GitHub Actions** only to ensure code quality, security, and reliable deployments.

**Two separate workflows:**
- **CI Pipeline** - Code quality, testing, security scanning
- **CD Pipeline** - Building and deploying to staging/production

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│           GitHub Actions CI/CD                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Push/PR to main/develop                                │
│         │                                                │
│         ├─────────────────────────┐                      │
│         │                         │                      │
│    CI Pipeline              CD Pipeline                  │
│  (.ci.yml)              (cd.yml)                         │
│         │                         │                      │
│    ┌────┴────────────────┐        │                      │
│    │                     │        │                      │
│ ┌──▼──┐ ┌──────┐ ┌──────┐  ┌─────▼──────┐               │
│ │Lint │ │Test  │ │Scan  │  │ Build      │               │
│ │     │ │      │ │      │  │ Images     │               │
│ └──┬──┘ └──┬───┘ └──┬───┘  └─────┬──────┘               │
│    │       │       │             │                       │
│    └───────┴───────┴─────────────┤                       │
│                                  │                       │
│                    ┌─────────────┴──────────────┐        │
│                    │                            │        │
│             ┌──────▼────────┐         ┌────────▼──┐     │
│             │Deploy Staging │         │Production │     │
│             │(develop only) │         │(main only)│     │
│             └───────────────┘         └────┬──────┘     │
│                                            │            │
│                                    (Manual approval)     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Workflow Details

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request to ensure code quality.

**Stages:**

1. **Lint & Code Quality**
   - Node.js: Prettier, ESLint, TypeScript type checking
   - Python: Black formatting, Flake8 linting
   - Output: Report in GitHub UI

2. **Backend Tests**
   - Framework: Pytest with coverage
   - Services: PostgreSQL, Redis
   - Output: Coverage reports to Codecov

3. **Frontend Tests**
   - Framework: Vitest + React Testing Library
   - Build verification
   - Output: Build artifacts to GH Actions

4. **Security Scanning**
   - Trivy: Filesystem vulnerability scan
   - npm audit: JavaScript dependencies
   - Output: SARIF reports to GitHub Security tab

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual trigger via `workflow_dispatch`

**Duration:** ~8-10 minutes

**Status Badge:**
```markdown
![CI Pipeline](https://github.com/your-org/murgi-mitra-site/actions/workflows/ci.yml/badge.svg)
```

---

### CD Pipeline (`.github/workflows/cd.yml`)

Builds and deploys the application. Automatically runs after CI passes.

**Stages:**

1. **Build Docker Images**
   - Builds: API, Worker, Web (Nginx)
   - Registry: GitHub Container Registry (ghcr.io)
   - Tags: branch, semver, SHA, latest
   - Caching: GitHub Actions cache for faster rebuilds

2. **Deploy Staging**
   - **Trigger:** Push to `develop` branch
   - **When:** After images build successfully
   - **Type:** Automatic deployment
   - **Checks:** Health checks validate deployment
   - **Environment URL:** `https://staging.murgi-mitra.example.com`

3. **Deploy Production**
   - **Trigger:** Push to `main` branch
   - **When:** After images build successfully
   - **Type:** Manual approval required via GitHub UI
   - **Checks:** Health checks validate deployment
   - **Environment URL:** `https://murgi-mitra.example.com`
   - **Notifications:** Slack status updates

**Triggers:**
- Push to `develop` branch → Deploy to staging
- Push to `main` branch → Deploy to production (manual)
- Manual trigger via `workflow_dispatch`

**Duration:** ~15-20 minutes (build + deploy)

---

## Environment Setup

### GitHub Secrets Required

Add these secrets to your GitHub repository:

| Secret | Description | Example |
|--------|-------------|---------|
| `SLACK_WEBHOOK` | Slack webhook for notifications | `https://hooks.slack.com/...` |
| `STAGING_DEPLOY_HOST` | Staging server hostname | `staging.murgi-mitra.com` |
| `STAGING_DEPLOY_USER` | SSH user for staging | `deploy` |
| `STAGING_DEPLOY_KEY` | Private SSH key for staging | (multiline key) |
| `PROD_DEPLOY_HOST` | Production server hostname | `murgi-mitra.com` |
| `PROD_DEPLOY_USER` | SSH user for production | `deploy` |
| `PROD_DEPLOY_KEY` | Private SSH key for production | (multiline key) |

**Setup instructions:** See `docs/CICD-SETUP.md` Step 1

### GitHub Container Registry

Docker images are pushed to: `ghcr.io/your-org/murgi-mitra-site-{api|worker|web}`

Enable in repo: **Settings → Packages → Container registry**

---

## Deployment Flow

### Staging Deployment

```
develop branch push
    ↓
CI Pipeline runs (lint, test, security)
    ↓
CD Pipeline builds Docker images
    ↓
Auto-deploys to staging server
    ↓
Health checks validate deployment
    ↓
Slack notification sent
    ↓
Live at: https://staging.murgi-mitra.example.com
```

### Production Deployment

```
main branch push
    ↓
CI Pipeline runs (lint, test, security)
    ↓
CD Pipeline builds Docker images
    ↓
Pauses - waiting for manual approval
    ↓
Developer approves in GitHub Actions UI
    ↓
Deploys to production server
    ↓
Health checks validate deployment
    ↓
Slack notification sent
    ↓
Live at: https://murgi-mitra.example.com
```

---

## Monitoring & Notifications

### Slack Integration

Automatic notifications for:
- CI pipeline status (lint, test, security results)
- Staging deployment success/failure
- Production deployment success/failure

**Setup:** Add `SLACK_WEBHOOK` secret to GitHub

**Notification format:**
```
Murgi Mitra - CI Pipeline
Status: Success
Branch: refs/heads/develop
Commit: a1b2c3d...
Author: @developer
[View Workflow button]
```

### GitHub UI

Monitor in **Actions** tab:
- Workflow runs by date
- Step-by-step logs
- Artifact download
- Re-run options

---

## Docker Image Details

### Image Sizes

| Image | Base | Size | Purpose |
|-------|------|------|---------|
| API | python:3.11-slim | ~200 MB | FastAPI backend |
| Worker | python:3.11-slim | ~180 MB | Celery async tasks |
| Web | nginx:alpine | ~20 MB | React frontend |

### Image Tags

Each build creates multiple tags:
- `latest` - Latest from default branch
- `develop` / `main` - Branch name
- `v1.0.0` - Semantic version tags
- `sha-a1b2c3d` - Git commit SHA

Example: `ghcr.io/org/murgi-mitra-web:develop`, `ghcr.io/org/murgi-mitra-web:v1.0.0`, `ghcr.io/org/murgi-mitra-web:sha-a1b2c3d`

---

## Health Checks

### Staging Health Check

```bash
curl -f https://staging.murgi-mitra.example.com/health
```

Response (200 OK):
```json
{"status": "ok", "version": "1.0.0", "timestamp": "2024-01-15T10:30:00Z"}
```

### Production Health Check

```bash
curl -f https://murgi-mitra.example.com/health
```

Health check failure triggers rollback if enabled.

---

## Troubleshooting

### CI Pipeline Failures

**Lint failure:**
- Run locally: `npm run format && npm run check`
- Fix: Format code with `npm run format`

**Test failure:**
- Run locally: `npm run test -- --run && pytest api/`
- Check logs in GitHub Actions
- Database/Redis might not be available

**Security scan failure:**
- Review Trivy report in GitHub Security tab
- Run locally: `trivy fs .`
- Update dependencies: `npm audit fix`, `pip install --upgrade ...`

### CD Pipeline Failures

**Docker build failure:**
- Check Docker logs in GitHub Actions
- Verify Dockerfile syntax: `docker build -f Dockerfile .`
- Disk space on runner might be full

**Deployment failure:**
- Verify SSH keys are correctly configured
- Check server connectivity: `ssh -i key user@host`
- View server logs: `docker-compose logs -f`

**Health check failure:**
- Check application logs: `docker logs <container>`
- Verify database/Redis: `docker ps`
- Port might already be in use

---

## Best Practices

### Branches

- **develop**: Staging deployments, bleeding edge
- **main**: Production deployments, stable releases
- **feature/***: Feature branches, CI only (no deploy)

### Commits

- Write clear commit messages
- Link to issues: `Fixes #123`
- Tag versions: `git tag v1.0.0`

### Deployments

- Test in staging first
- Use manual approval for production
- Monitor health checks post-deploy
- Have rollback plan ready

### Performance

- Leverage Docker layer caching
- Re-use workflow artifacts
- Optimize test execution time
- Archive and clean up old artifacts

---

## Local Testing

### Test CI Locally

Install [act](https://github.com/nektos/act) and run:

```bash
# Test lint job
act push -j lint

# Test backend tests
act push -j backend-test

# Test security scan
act push -j security-scan
```

### Test Deployment Script

```bash
# Test staging deployment
./scripts/deploy-staging.sh

# Test production deployment (requires manual confirmation)
./scripts/deploy-production.sh
```

---

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [act - Local GitHub Actions Testing](https://github.com/nektos/act)
