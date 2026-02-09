# Phase 1 Migration Execution Guide

## Environment Setup Summary

### Staging Environment
- **Location**: `/opt/schooliat/backend/staging/shared/.env`
- **Database**: `schooliat_staging`
- **Port**: 3001
- **Redis DB**: 0
- **API URL**: Configured in environment file

### Production Environment
- **Location**: `/opt/schooliat/backend/production/shared/.env`
- **Database**: `schooliat_production`
- **Port**: 3000
- **Redis DB**: 1
- **API URL**: Configured in environment file

## Migration Process

### Step 1: Migrate Staging (Recommended First)

```bash
cd /root/master-schooliat/Backend
npm run migrate:staging
```

Or directly:
```bash
bash scripts/migrate-staging.sh
```

**What it does:**
1. Loads staging environment variables
2. Formats Prisma schema
3. Generates Prisma Client
4. Creates migration file (if needed)
5. Applies migration to staging database

### Step 2: Test Staging APIs

```bash
npm run test:staging
```

Or directly:
```bash
bash scripts/test-staging-apis.sh
```

### Step 3: Migrate Production (After Staging Verification)

```bash
npm run migrate:production
```

Or directly:
```bash
bash scripts/migrate-production.sh
```

**What it does:**
1. Creates database backup
2. Loads production environment variables
3. Formats Prisma schema
4. Generates Prisma Client
5. Applies migration to production database

### Step 4: Test Production APIs

```bash
npm run test:production
```

Or directly:
```bash
bash scripts/test-production-apis.sh
```

## Quick Commands

### Migrate Both Environments
```bash
bash scripts/migrate-both-environments.sh
```

### Check Migration Status
```bash
npm run migrate:status
```

### Test All APIs (Local)
```bash
npm run test:phase1
npm run test:all
```

## Migration Checklist

### Pre-Migration
- [ ] Review schema changes in `src/prisma/db/schema.prisma`
- [ ] Verify environment files exist
- [ ] Check database connectivity
- [ ] Backup production database (automatic in script)

### Staging Migration
- [ ] Run staging migration
- [ ] Verify migration success
- [ ] Test staging APIs
- [ ] Check for errors in logs

### Production Migration
- [ ] Confirm staging is working correctly
- [ ] Run production migration
- [ ] Verify migration success
- [ ] Test production APIs
- [ ] Monitor application logs

### Post-Migration
- [ ] Verify all new tables exist
- [ ] Check indexes are created
- [ ] Test key endpoints
- [ ] Monitor application performance
- [ ] Update API documentation

## Troubleshooting

### Migration Fails

**Error: Database connection failed**
- Check database is running: `systemctl status postgresql`
- Verify DATABASE_URL in environment file
- Check network connectivity

**Error: Migration already applied**
- Check migration status: `npm run migrate:status`
- Review `prisma/migrations/` directory
- Use `prisma migrate resolve` if needed

**Error: Schema drift detected**
- Review existing migrations
- Create new migration to sync
- Or reset migrations (⚠️ **WARNING**: Data loss)

### API Tests Fail

**Error: Authentication failed**
- Check TEST_EMAIL and TEST_PASSWORD
- Verify user exists in database
- Check JWT_SECRET is set

**Error: 403 Forbidden**
- Verify user permissions
- Check role assignments
- Ensure school context is correct

**Error: Connection refused**
- Check API server is running
- Verify API_URL is correct
- Check firewall rules

## Rollback Procedure

If migration causes issues:

1. **Restore from backup** (production only):
   ```bash
   psql -U schooliat_user -d schooliat_production < /opt/schooliat/shared/backups/production-pre-migration-*.sql
   ```

2. **Revert migration**:
   ```bash
   # Navigate to migrations directory
   cd prisma/migrations
   # Find the migration to revert
   # Manually revert the SQL changes
   ```

3. **Restart services**:
   ```bash
   pm2 restart schooliat-backend-staging
   pm2 restart schooliat-backend-production
   ```

## Support

For issues:
- Check Prisma logs: `prisma migrate status`
- Review application logs: `pm2 logs`
- Check database logs: `tail -f /var/log/postgresql/postgresql-*.log`

