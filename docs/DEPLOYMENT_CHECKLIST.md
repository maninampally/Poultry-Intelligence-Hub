# Deployment Checklist - Murgi Mitra

Comprehensive checklist covering CI/CD setup, infrastructure preparation, security review, and post-deployment verification.

---

## 1. CI/CD Pipeline Setup

### GitHub Actions Configuration

- [ ] Repository has `.github/workflows/ci.yml` (linting, testing, security)
- [ ] Repository has `.github/workflows/cd.yml` (build, deploy)
- [ ] GitHub Container Registry enabled (`Settings → Packages`)
- [ ] GitHub Secrets configured (`Settings → Secrets and variables → Actions`):
  - [ ] `SLACK_WEBHOOK` (optional, for notifications)
  - [ ] `STAGING_DEPLOY_KEY` (SSH private key)
  - [ ] `STAGING_DEPLOY_HOST` (server hostname)
  - [ ] `STAGING_DEPLOY_USER` (usually 'deploy')
  - [ ] `PROD_DEPLOY_KEY` (SSH private key)
  - [ ] `PROD_DEPLOY_HOST` (server hostname)
  - [ ] `PROD_DEPLOY_USER` (usually 'deploy')

### Local Testing Before Deployment

```bash
[ ] npm run format -- --check  # Frontend linting
[ ] npm run check              # TypeScript type checking
[ ] npm run test -- --run      # Frontend tests
[ ] pytest api/ --cov=api      # Backend tests with coverage
[ ] docker-compose build       # Build all images locally
[ ] docker-compose up -d       # Start services locally
[ ] curl http://localhost:8000/health  # Verify API health
```

---

## 2. Infrastructure Setup

### Staging Server Preparation

- [ ] Ubuntu 22.04+ LTS or RHEL 8+ server provisioned
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Deploy user created: `sudo useradd -m deploy`
- [ ] Deploy user added to docker group: `sudo usermod -aG docker deploy`
- [ ] SSH directory created: `mkdir -p ~/.ssh`
- [ ] Deployment directory created: `sudo mkdir -p /app/murgi-mitra-site`
- [ ] Permissions set: `sudo chown deploy:deploy /app/murgi-mitra-site`
- [ ] Git repository cloned
- [ ] `.env` file configured (copy from `.env.example`)
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (self-signed OK for staging)
- [ ] PostgreSQL database initialized
- [ ] Redis instance running
- [ ] Health endpoint accessible: `curl https://staging.murgi-mitra.example.com/health`

### Production Server Preparation

- [ ] Ubuntu 22.04+ LTS or RHEL 8+ server provisioned
- [ ] Docker installed and configured
- [ ] Docker Compose installed and configured
- [ ] Deploy user created with sudo privileges
- [ ] Deploy user added to docker group
- [ ] Deployment directory created and owned by deploy user
- [ ] Git repository cloned with production branch tracked
- [ ] `.env.production` file configured with:
  - [ ] Strong DATABASE_URL with secure password
  - [ ] Generate secure JWT_SECRET (min 64 characters)
  - [ ] ALLOWED_ORIGINS set to production domain only
  - [ ] NODE_ENV=production
  - [ ] PYTHONUNBUFFERED=1
- [ ] SSL certificate installed (Let's Encrypt via Certbot)
- [ ] Automatic certificate renewal configured
- [ ] PostgreSQL production instance configured
- [ ] Database SSL connections enabled
- [ ] Automated backups configured (daily minimum)
- [ ] Redis production instance with persistence
- [ ] Nginx reverse proxy configured
- [ ] HTTP to HTTPS redirect enabled
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Rate limiting configured in Nginx
- [ ] Health endpoint accessible: `curl https://murgi-mitra.example.com/health`

---

## 3. Security Review

### ✅ Environment Variables

- [ ] No hardcoded secrets in code
- [ ] JWT_SECRET securely generated (min 64 chars)
- [ ] DATABASE_URL uses strong password
- [ ] ALLOWED_ORIGINS matches production domain
- [ ] Debug mode disabled (NODE_ENV=production)
- [ ] No localhost URLs in production config

### ✅ Database Security

- [ ] PostgreSQL SSL connections enabled
- [ ] Database user has minimal required permissions
- [ ] Row-level security policies configured
- [ ] Connection limits set and monitored
- [ ] Regular backups configured and tested
- [ ] Backup restoration tested

### ✅ API Security

- [ ] Rate limiting enabled and tested
- [ ] Input validation on all endpoints
- [ ] CORS configured for production domain only
- [ ] Security headers set (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] SQL injection vulnerabilities tested and resolved
- [ ] XSS vulnerabilities tested and resolved
- [ ] Authentication tokens expire appropriately
- [ ] JWT signature verification working

### ✅ Infrastructure Security

- [ ] SSH keys configured (no password SSH)
- [ ] Firewall rules restrict access (22, 80, 443 only)
- [ ] Unauthorized users cannot SSH to server
- [ ] Docker daemon not exposed to internet
- [ ] Container resource limits set (CPU, memory)
- [ ] Secrets not logged in application logs

---

## 4. Staging Deployment

### Pre-Deployment Staging

- [ ] All tests pass locally
- [ ] Code reviewed and approved
- [ ] Commit message follows conventions
- [ ] Feature branch created from develop

### Deploy to Staging

```bash
# Option 1: Automatic via GitHub Actions
[ ] Push to develop branch
[ ] Wait for CI pipeline to complete
[ ] CD pipeline auto-deploys to staging

# Option 2: Manual deployment
[ ] ./scripts/deploy-staging.sh
[ ] Verify deployment successful
```

### Post-Deployment Staging Verification

- [ ] All containers running: `docker-compose ps`
- [ ] No error logs: `docker-compose logs --tail=50`
- [ ] API health check: `curl http://localhost:8000/health`
- [ ] Frontend loads: `curl -L http://localhost:3000`
- [ ] Database responsive: `docker-compose exec postgres pg_isready`
- [ ] Redis responsive: `docker-compose exec redis redis-cli ping`
- [ ] Create test farm record
- [ ] Log test mortality event
- [ ] View dashboard loads correctly
- [ ] No 500 errors in logs
- [ ] Slack notification received (if configured)

### Staging Testing

- [ ] User registration works
- [ ] Login functionality works
- [ ] Farm creation works
- [ ] Batch creation works
- [ ] Mortality logging works
- [ ] Sync operations work offline/online
- [ ] API documentation accessible (`/docs`)
- [ ] Health checks passing

---

## 5. Production Deployment

### Pre-Deployment Production

- [ ] Staging deployment verified and tested
- [ ] Create Pull Request from develop to main
- [ ] Code review completed and approved
- [ ] All CI tests passing
- [ ] Security scan completed with no critical issues
- [ ] Load testing completed successfully
- [ ] Backup procedures tested and working
- [ ] Monitoring configured and tested
- [ ] On-call team notified and available

### Deploy to Production

```bash
# Production deployment requires manual approval
[ ] Merge PR to main branch
[ ] CI pipeline runs (lint, test, security)
[ ] CD pipeline builds images
[ ] Manual approval prompt appears in GitHub Actions
[ ] Review deployment carefully
[ ] Approve deployment in GitHub Actions UI
[ ] Monitor deployment progress
```

### Post-Deployment Production Verification

**Immediate (within 5 minutes):**
- [ ] All containers running: `docker-compose -f docker-compose.production.yml ps`
- [ ] No error logs: `docker-compose -f docker-compose.production.yml logs --tail=100`
- [ ] API responds: `curl https://murgi-mitra.example.com/health`
- [ ] Frontend loads: `curl -L https://murgi-mitra.example.com`
- [ ] SSL certificate valid and not expired
- [ ] Database connected and responsive
- [ ] Redis responsive

**Short-term (first hour):**
- [ ] Monitor error rates (should be <1%)
- [ ] Monitor API response times (p95 <500ms)
- [ ] Monitor CPU and memory usage
- [ ] Check application logs for warnings
- [ ] Verify user authentication works
- [ ] Test core features (farm, batch, mortality)
- [ ] Monitor Slack notifications

**Ongoing (next 24 hours):**
- [ ] Monitor daily error rates
- [ ] Check database performance
- [ ] Verify sync operations working
- [ ] Monitor disk space usage
- [ ] Review security logs
- [ ] Verify backups created successfully

---

## 6. Rollback Procedures

### Automatic Rollback

Health check failures trigger automatic rollback:
- [ ] Deployment fails health check
- [ ] Pipeline automatically reverts to previous version
- [ ] Previous version deployed
- [ ] Health restored
- [ ] Team notified via Slack

### Manual Rollback - Staging

```bash
# SSH to staging server
ssh deploy@staging.murgi-mitra.example.com

# View git history
git log --oneline -10

# Revert to previous version
git checkout <previous-commit-hash>

# Restart services
docker-compose pull
docker-compose up -d
docker-compose exec -T api alembic upgrade head

# Verify
curl http://localhost:8000/health
```

### Manual Rollback - Production

```bash
# SSH to production server
ssh deploy@murgi-mitra.example.com

# Create backup before rollback
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump \
    -U postgres poultry_intelligence > backup_before_rollback.sql

# View git history
git log --oneline -20

# Revert to previous stable version
git checkout <previous-stable-commit-hash>

# Restart services carefully
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
docker-compose -f docker-compose.production.yml exec -T api alembic upgrade head

# Verify health
curl https://murgi-mitra.example.com/health

# Notify team
# Slack message: "Production rolled back to [version] due to [reason]"
```

---

## 7. Troubleshooting

### Build Fails in CI/CD

**Check:**
- [ ] Dockerfile syntax correct
- [ ] All files referenced in Dockerfile exist
- [ ] Docker daemon running
- [ ] Disk space available on CI runner
- [ ] No breaking changes in dependencies

**Fix:**
```bash
[ ] docker build -f Dockerfile -t murgi-mitra-web .
[ ] Check Docker logs for details
[ ] Fix issues locally and test
[ ] Push fixed code
```

### Tests Failing

**Check:**
- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] Database migrations applied
- [ ] Test fixtures loaded
- [ ] Environment variables set

**Fix:**
```bash
[ ] docker-compose down -v
[ ] docker-compose up -d postgres redis
[ ] npm run test -- --run
[ ] pytest api/ -v
```

### Deployment Failed

**Check:**
- [ ] SSH key configured correctly
- [ ] Deploy user has permissions
- [ ] Firewall allows SSH connection
- [ ] Server disk space available
- [ ] Docker daemon running
- [ ] Ports 3000, 8000 not in use

**Fix:**
```bash
[ ] ssh -i key deploy@host "docker ps"
[ ] Free up disk space if needed
[ ] Restart Docker: sudo systemctl restart docker
[ ] Try deployment script again
```

### Health Check Fails After Deployment

**Check:**
- [ ] API container running: `docker ps | grep api`
- [ ] Database connected: `docker logs <api-container>`
- [ ] Redis connected: `docker logs <api-container>`
- [ ] Port 8000 accessible from host
- [ ] Logs for error messages

**Fix:**
```bash
[ ] docker-compose logs -f api
[ ] docker-compose exec postgres psql -U postgres -c "SELECT 1"
[ ] docker-compose exec redis redis-cli ping
[ ] docker-compose restart api
```

### Staging Not Auto-Deploying

**Check:**
- [ ] Commit on develop branch
- [ ] CI pipeline completed successfully
- [ ] No syntax errors in `.github/workflows/cd.yml`
- [ ] SSH keys in GitHub secrets correct
- [ ] Deploy server reachable

**Fix:**
```bash
[ ] ./scripts/deploy-staging.sh  # Manual deployment
[ ] Check GitHub Actions logs
[ ] Verify SSH key: ssh -i key deploy@host "docker ps"
```

---

## 8. Monitoring & Maintenance

### Daily Checks

- [ ] Production health endpoint responding
- [ ] Error rate <1%
- [ ] API response time <500ms (p95)
- [ ] No critical errors in logs
- [ ] Disk space >20% available
- [ ] Database connections healthy

### Weekly

- [ ] Review error logs and patterns
- [ ] Check dependency security updates
- [ ] Monitor CPU/memory trends
- [ ] Verify backups completed
- [ ] Review user activity metrics

### Monthly

- [ ] Test backup restoration
- [ ] Review and update documentation
- [ ] Update base Docker images
- [ ] Review SSL certificate expiration
- [ ] Run security scanning
- [ ] Performance trend analysis

---

## 9. Post-Deployment Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| DevOps Engineer | _________________ | _______ | ☐ Approved |
| Backend Lead | _________________ | _______ | ☐ Approved |
| Security Review | _________________ | _______ | ☐ Approved |
| Product Manager | _________________ | _______ | ☐ Approved |

**Deployment Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Any Incidents During Deployment:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 10. Quick Reference Links

- **GitHub Actions Setup:** See `.github/workflows/ci.yml` and `.github/workflows/cd.yml`
- **CI/CD Documentation:** See `docs/CI-CD.md`
- **Deployment Scripts:** `scripts/deploy-staging.sh` and `scripts/deploy-production.sh`
- **Environment Template:** `.env.example` and `.env.production`
- **Docker Configuration:** `docker-compose.yml` and `docker-compose.production.yml`
- **System Design:** `docs/SYSTEM_DESIGN.md`

---

**Last Updated:** September 18, 2026
**Version:** 1.0
**Status:** Production Ready
