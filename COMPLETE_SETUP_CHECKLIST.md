# Complete VPS Setup Checklist - All Applications

Quick checklist for deploying Landing, Dashboard, and Backend on single Hostinger VPS.

## Initial VPS Setup

- [ ] Connect to VPS via SSH (as root)
- [ ] Update system packages
- [ ] Setup SSH keys (optional)
- [ ] Configure firewall (UFW)
  - [ ] Allow SSH (22)
  - [ ] Allow HTTP (80)
  - [ ] Allow HTTPS (443)
  - [ ] Allow app ports (3000, 3001, 3002, 3003)

## Install Services

- [ ] Install Node.js 20.19.0+
- [ ] Install PostgreSQL 16
- [ ] Install Redis 7
- [ ] Install PM2 globally
- [ ] Install Nginx
- [ ] Verify all services running

## Database Setup

- [ ] Create staging database (`schooliat_staging`)
- [ ] Create production database (`schooliat_production`)
- [ ] Create database user(s)
- [ ] Set database passwords
- [ ] Test database connections (both)
- [ ] Configure PostgreSQL authentication
- [ ] Tune PostgreSQL for 4GB RAM
- [ ] Configure Redis (DB 0 for staging, DB 1 for production)
- [ ] Setup MinIO buckets (staging & production)

## Directory Structure

- [ ] Create `/opt/schooliat` directory
- [ ] Create backend directories (staging & production)
- [ ] Create dashboard directories (staging & production)
- [ ] Create landing directories
- [ ] Create shared directories
- [ ] Clone repository (main & develop branches)

## Backend API Setup

- [ ] Production:
  - [ ] Install dependencies
  - [ ] Generate Prisma client
  - [ ] Run database migrations
  - [ ] Seed database (optional - initial setup only)
  - [ ] Create `.env` file
  - [ ] Link `.env` file
- [ ] Staging:
  - [ ] Install dependencies
  - [ ] Generate Prisma client
  - [ ] Run database migrations
  - [ ] Seed database (optional - for testing)
  - [ ] Create `.env` file
  - [ ] Link `.env` file
- [ ] Test both environments locally

## Dashboard Setup

- [ ] Install dependencies
- [ ] Create `.env` file
- [ ] Link `.env` file
- [ ] Build Next.js application
- [ ] Verify build
- [ ] Test dashboard locally

## Landing Page Setup

- [ ] Install dependencies
- [ ] Build static export
- [ ] Verify `out/` directory
- [ ] Copy to `/var/www/schooliat-landing`
- [ ] Set proper permissions

## Nginx Configuration

- [ ] Create landing page config (production)
- [ ] Create dashboard config (production)
- [ ] Create backend API config (production)
- [ ] Create dashboard staging config
- [ ] Create backend API staging config
- [ ] Enable all sites
- [ ] Test Nginx configuration
- [ ] Reload Nginx

## SSL Certificates

- [ ] Install Certbot
- [ ] Obtain SSL for production domains:
  - [ ] Landing (`schooliat.com`)
  - [ ] Dashboard (`app.schooliat.com`)
  - [ ] API (`api.schooliat.com`)
- [ ] Obtain SSL for staging domains:
  - [ ] Dashboard (`staging-app.schooliat.com`)
  - [ ] API (`staging-api.schooliat.com`)
- [ ] Test auto-renewal
- [ ] Verify HTTPS working for all domains

## PM2 Setup

- [ ] Create `ecosystem.config.js`
- [ ] Configure backend production process
- [ ] Configure backend staging process
- [ ] Configure dashboard production process
- [ ] Configure dashboard staging process
- [ ] Start all processes (4 total)
- [ ] Save PM2 configuration
- [ ] Setup PM2 startup script
- [ ] Test process restarts

## Environment Variables

- [ ] Backend production `.env` configured
- [ ] Backend staging `.env` configured
- [ ] Dashboard production `.env` configured
- [ ] Dashboard staging `.env` configured
- [ ] All secrets set (different for staging/production)
- [ ] File permissions set (600)
- [ ] All environment files linked

## GitHub Actions CI/CD

- [ ] Add GitHub Secrets:
  - [ ] `VPS_HOST`
  - [ ] `VPS_USER` (root)
  - [ ] `VPS_SSH_KEY`
  - [ ] `STAGING_DATABASE_URL`
  - [ ] `PRODUCTION_DATABASE_URL`
  - [ ] `STAGING_JWT_SECRET`
  - [ ] `PRODUCTION_JWT_SECRET`
  - [ ] Other required secrets
- [ ] Create staging deployment workflow (`.github/workflows/deploy-staging.yml`)
- [ ] Create production deployment workflow (`.github/workflows/deploy-production.yml`)
- [ ] Test staging deployment (push to `develop`)
- [ ] Test production deployment (push to `main` or manual trigger)

## Testing

- [ ] Production:
  - [ ] Landing page accessible (`schooliat.com`)
  - [ ] Dashboard accessible (`app.schooliat.com`)
  - [ ] Backend API accessible (`api.schooliat.com`)
  - [ ] Health endpoints working
- [ ] Staging:
  - [ ] Dashboard accessible (`staging-app.schooliat.com`)
  - [ ] Backend API accessible (`staging-api.schooliat.com`)
  - [ ] Health endpoints working
- [ ] Database connections working (both databases)
- [ ] Redis connections working (both DBs)
- [ ] MinIO buckets accessible (both buckets)
- [ ] SSL certificates active (all domains)
- [ ] All applications responding

## Resource Optimization

- [ ] PostgreSQL tuned for 4GB RAM
- [ ] PM2 memory limits set
- [ ] Swap space configured (if needed)
- [ ] Memory usage monitored
- [ ] CPU usage acceptable

## Monitoring Setup

- [ ] Database backup script created (backs up both databases)
- [ ] Backup added to crontab
- [ ] Log rotation configured
- [ ] Health check endpoints tested (staging & production)
- [ ] Monitoring alerts setup (optional)
- [ ] Verify backups include both staging and production

## Security

- [ ] Firewall configured
- [ ] SSH key authentication only
- [ ] Strong database passwords
- [ ] Strong Redis password
- [ ] Strong JWT secrets
- [ ] Environment files secured
- [ ] SSL certificates active
- [ ] Regular security updates

## Final Verification

- [ ] Production:
  - [ ] Landing page: https://schooliat.com
  - [ ] Dashboard: https://app.schooliat.com
  - [ ] Backend API: https://api.schooliat.com
- [ ] Staging:
  - [ ] Dashboard: https://staging-app.schooliat.com
  - [ ] Backend API: https://staging-api.schooliat.com
- [ ] All services running
- [ ] PM2 processes healthy (4 processes)
- [ ] Nginx serving correctly (all 5 configs)
- [ ] Databases accessible (both staging & production)
- [ ] Redis working (both DBs)
- [ ] MinIO buckets accessible (both)
- [ ] Logs accessible (all environments)
- [ ] Backups working (both databases)

---

## Quick Commands

```bash
# Check all services
pm2 status
systemctl status postgresql redis-server nginx

# View logs
pm2 logs
tail -f /opt/schooliat/backend/production/shared/logs/out.log
tail -f /opt/schooliat/backend/staging/shared/logs/out.log

# Restart services
pm2 restart all
systemctl reload nginx

# Deploy updates - Production
cd /opt/schooliat/backend/production/current && git pull && npm ci --production && pm2 restart schooliat-backend-production
cd /opt/schooliat/dashboard/production/current && git pull && npm ci --production && npm run build && pm2 restart schooliat-dashboard-production
cd /opt/schooliat/landing/current && git pull && npm ci --production && npm run build && cp -r out/* /var/www/schooliat-landing/

# Deploy updates - Staging
cd /opt/schooliat/backend/staging/current && git pull && npm ci --production && pm2 restart schooliat-backend-staging
cd /opt/schooliat/dashboard/staging/current && git pull && npm ci --production && npm run build && pm2 restart schooliat-dashboard-staging
```

---

**Note:** Follow `COMPLETE_DEPLOYMENT_GUIDE.md` for detailed instructions.

