# Immediate Fix for Production Sidebar Issue

## Problem
Changes deployed but not visible on `app.schooliat.com`

## Root Cause
**Deployment path mismatch**: 
- Workflow copies build to `/opt/schooliat/dashboard/production/`
- PM2 runs from `/opt/schooliat/dashboard/production/current/`

## Immediate Solution

### Option 1: Update GitHub Actions Workflow (Recommended)

I've updated the workflow file to fix the path issue. You need to:

1. **Commit the updated workflow**:
   ```bash
   cd /root/master-schooliat
   git add .github/workflows/deploy-production.yml
   git commit -m "fix: correct dashboard production deployment path"
   git push origin main
   ```

2. **Wait for automatic deployment** or manually trigger it

### Option 2: Quick Manual Fix on Production Server

SSH into production server and run:

```bash
cd /opt/schooliat/repo
git fetch origin main
git checkout main
git reset --hard origin/main

cd dashboard
npm ci
cp /opt/schooliat/dashboard/production/shared/.env .env.production
NODE_ENV=production npm run build

# Fix: Copy to correct location where PM2 runs
mkdir -p /opt/schooliat/dashboard/production/current
rm -rf /opt/schooliat/dashboard/production/current/.next
cp -r .next /opt/schooliat/dashboard/production/current/
cp -r public /opt/schooliat/dashboard/production/current/ 2>/dev/null || true
cp package.json /opt/schooliat/dashboard/production/current/

# Clear cache
rm -rf /opt/schooliat/dashboard/production/current/.next/cache

# Hard restart
pm2 delete schooliat-dashboard-production
cd /opt/schooliat/dashboard/production/current
pm2 start node_modules/.bin/next --name schooliat-dashboard-production -- start -p 3002
pm2 save
```

### Option 3: Verify PM2 Configuration

Check where PM2 is actually running from:

```bash
pm2 describe schooliat-dashboard-production
```

Look for `cwd` (current working directory). It should be:
- `/opt/schooliat/dashboard/production/current` OR
- `/opt/schooliat/dashboard/production`

Then copy build to that location.

## After Fix

1. **Clear browser cache**: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. **Test in incognito mode**
3. **Verify menu items appear**:
   - Reports & Analytics
   - Settings
   - Help
   - Students submenu with Transfer Certificates

## Quick Check Commands

```bash
# On production server - verify build location
ls -la /opt/schooliat/dashboard/production/current/.next/

# Check if menu items in build
grep -r "Reports & Analytics" /opt/schooliat/dashboard/production/current/.next/ 2>/dev/null | head -1

# Check PM2 status
pm2 status schooliat-dashboard-production
pm2 logs schooliat-dashboard-production --lines 20
```

---

**Recommended**: Use Option 1 (update workflow) for permanent fix, then Option 2 for immediate fix.

