# VPS Setup Quick Checklist

Use this checklist while setting up your Hostinger VPS. Follow the detailed guide in `DEPLOYMENT_GUIDE.md`.

## Initial VPS Setup

- [ ] Connect to VPS via SSH
- [ ] Update system packages (`apt update && apt upgrade -y`)
- [ ] Create deployment user (`deploy`)
- [ ] Setup SSH keys
- [ ] Configure firewall (UFW)
  - [ ] Allow SSH (22)
  - [ ] Allow HTTP (80)
  - [ ] Allow HTTPS (443)
  - [ ] Allow app ports (3000, 3001) if needed

## Install Services

- [ ] Install Node.js 20.19.0+
- [ ] Install PostgreSQL 16
- [ ] Install Redis 7
- [ ] Install PM2 globally
- [ ] Install Nginx
- [ ] Verify all services are running

## Database Setup

- [ ] Create staging database (`schooliat_staging`)
- [ ] Create production database (`schooliat_production`)
- [ ] Create database user (or use postgres)
- [ ] Set database passwords
- [ ] Test database connections
- [ ] Configure PostgreSQL authentication

## Application Setup

- [ ] Create directory structure (`~/schooliat/`)
- [ ] Clone/copy application code
- [ ] Install dependencies (staging)
- [ ] Install dependencies (production)
- [ ] Generate Prisma client (both environments)
- [ ] Run migrations (staging)
- [ ] Run migrations (production) - **after backup!**

## Environment Variables

- [ ] Create `.env` file for staging
- [ ] Create `.env` file for production
- [ ] Set all required environment variables
- [ ] Link `.env` files to application directories
- [ ] Set proper file permissions (600)

## Nginx Configuration

- [ ] Create staging Nginx config
- [ ] Create production Nginx config
- [ ] Enable sites (create symlinks)
- [ ] Test Nginx configuration
- [ ] Reload Nginx

## SSL Certificates

- [ ] Install Certbot
- [ ] Obtain SSL for staging domain
- [ ] Obtain SSL for production domain
- [ ] Test auto-renewal
- [ ] Update Nginx configs with SSL

## PM2 Setup

- [ ] Create `ecosystem.config.js`
- [ ] Start staging application
- [ ] Start production application
- [ ] Save PM2 configuration
- [ ] Setup PM2 startup script
- [ ] Test application restarts

## GitHub Actions CI/CD

- [ ] Add GitHub Secrets:
  - [ ] `VPS_HOST`
  - [ ] `VPS_USER`
  - [ ] `VPS_SSH_KEY`
  - [ ] `STAGING_DATABASE_URL`
  - [ ] `PRODUCTION_DATABASE_URL`
  - [ ] `STAGING_JWT_SECRET`
  - [ ] `PRODUCTION_JWT_SECRET`
  - [ ] Other required secrets
- [ ] Create `.github/workflows/deploy-staging.yml`
- [ ] Create `.github/workflows/deploy-production.yml`
- [ ] Test staging deployment via GitHub Actions
- [ ] Test production deployment (manual trigger)

## Testing

- [ ] Test staging health endpoint
- [ ] Test production health endpoint
- [ ] Test API endpoints on staging
- [ ] Test API endpoints on production
- [ ] Verify database connections
- [ ] Verify Redis connections
- [ ] Check application logs
- [ ] Check Nginx logs

## Monitoring Setup

- [ ] Setup database backup script
- [ ] Add backup to crontab
- [ ] Test backup restoration
- [ ] Setup log rotation
- [ ] Configure monitoring alerts (optional)

## Security

- [ ] Firewall configured
- [ ] SSH key authentication only
- [ ] Strong database passwords
- [ ] Strong Redis password
- [ ] Strong JWT secrets
- [ ] Environment files secured (600)
- [ ] SSL certificates active
- [ ] Regular security updates scheduled

## Documentation

- [ ] Document any custom configurations
- [ ] Save important credentials securely
- [ ] Document deployment process
- [ ] Share access with team (if needed)

## Final Verification

- [ ] Staging environment fully functional
- [ ] Production environment fully functional
- [ ] CI/CD pipeline working
- [ ] Health checks passing
- [ ] All services running
- [ ] Logs accessible
- [ ] Backups working

---

## Quick Commands Reference

```bash
# Connect to VPS
ssh deploy@your-vps-ip

# Check services
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx
pm2 status

# View logs
pm2 logs
tail -f ~/schooliat/staging/shared/logs/out.log

# Restart services
pm2 restart schooliat-staging
pm2 restart schooliat-production
sudo systemctl restart nginx

# Database backup
pg_dump -U schooliat_user schooliat_production > backup.sql
```

---

**Note:** Complete each section before moving to the next. Refer to `DEPLOYMENT_GUIDE.md` for detailed instructions.

