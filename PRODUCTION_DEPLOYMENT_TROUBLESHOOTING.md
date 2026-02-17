# Production Deployment Troubleshooting

## Issue: Changes Not Visible on Production

### Problem
Deployment completed but sidebar changes (Reports, Settings, Help, Transfer Certificates) are not visible on `app.schooliat.com`.

## Root Cause Analysis

### Possible Issues:

1. **Changes Not Committed/Pushed**
   - Changes exist locally but not in repository
   - GitHub Actions pulls from repository, not local files

2. **Build Cache Issues**
   - Next.js build cache not cleared
   - Old build files still being served

3. **PM2 Process Not Restarted Properly**
   - Process restarted but using old build
   - Build not copied to correct location

4. **Browser Cache**
   - Browser serving cached JavaScript/CSS
   - Service worker cache

5. **Deployment Path Mismatch**
   - Build copied to wrong directory
   - PM2 running from different directory

## Solution Steps

### Step 1: Verify Changes Are Committed

```bash
cd /root/master-schooliat
git status
git log --oneline -5
```

**If changes are NOT committed:**
```bash
git add dashboard/lib/config/menu-items.ts dashboard/components/layout/sidebar.tsx
git commit -m "feat: update sidebar with Reports, Settings, Help, and Transfer Certificates"
git push origin main
```

### Step 2: Check Deployment Workflow

The deployment workflow should:
1. Pull latest code from `main` branch
2. Build dashboard in `/opt/schooliat/repo/dashboard`
3. Copy `.next` to `/opt/schooliat/dashboard/production/`
4. Restart PM2 process

**Issue Found**: The workflow copies to `/opt/schooliat/dashboard/production/` but PM2 might be running from `/opt/schooliat/dashboard/production/current/`

### Step 3: Manual Deployment Fix (If Needed)

If automatic deployment didn't work, manually deploy:

```bash
# SSH into production server
ssh user@your-vps-ip

# Navigate to repo
cd /opt/schooliat/repo

# Pull latest code
git fetch origin main
git checkout main
git reset --hard origin/main

# Build dashboard
cd dashboard
npm ci
cp /opt/schooliat/dashboard/production/shared/.env .env.production
NODE_ENV=production npm run build

# Clear old build and copy new one
rm -rf /opt/schooliat/dashboard/production/.next
cp -r .next /opt/schooliat/dashboard/production/
cp -r public /opt/schooliat/dashboard/production/ 2>/dev/null || true
cp package.json /opt/schooliat/dashboard/production/

# Hard restart PM2 (clears cache)
pm2 delete schooliat-dashboard-production
pm2 start ecosystem.config.js --only schooliat-dashboard-production
# OR if using separate start command:
cd /opt/schooliat/dashboard/production
pm2 start node_modules/.bin/next --name schooliat-dashboard-production -- start -p 3002

# Clear Next.js cache
rm -rf /opt/schooliat/dashboard/production/.next/cache
```

### Step 4: Verify Build Contains Changes

```bash
# On production server
cd /opt/schooliat/dashboard/production
grep -r "Reports & Analytics" .next/ 2>/dev/null | head -3
grep -r "STUDENTS_SUBMENU" .next/ 2>/dev/null | head -3
```

### Step 5: Clear Browser Cache

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear Cache**: Browser settings → Clear browsing data → Cached images and files
3. **Incognito Mode**: Test in incognito/private window
4. **Service Worker**: Unregister service worker if present

### Step 6: Check PM2 Status

```bash
pm2 status
pm2 logs schooliat-dashboard-production --lines 50
pm2 restart schooliat-dashboard-production --update-env
```

### Step 7: Verify File Locations

Check if PM2 is running from correct directory:

```bash
pm2 describe schooliat-dashboard-production
# Check "cwd" (current working directory)
# Should be: /opt/schooliat/dashboard/production/current
# OR: /opt/schooliat/dashboard/production
```

## Quick Fix Script

Create and run this script on production server:

```bash
#!/bin/bash
# Quick deployment fix script

echo "=== Dashboard Production Deployment Fix ==="

cd /opt/schooliat/repo
echo "1. Pulling latest code..."
git fetch origin main
git checkout main
git reset --hard origin/main

cd dashboard
echo "2. Installing dependencies..."
npm ci

echo "3. Loading environment..."
cp /opt/schooliat/dashboard/production/shared/.env .env.production

echo "4. Building dashboard..."
NODE_ENV=production npm run build

echo "5. Copying build..."
rm -rf /opt/schooliat/dashboard/production/.next
cp -r .next /opt/schooliat/dashboard/production/
cp -r public /opt/schooliat/dashboard/production/ 2>/dev/null || true
cp package.json /opt/schooliat/dashboard/production/

echo "6. Clearing Next.js cache..."
rm -rf /opt/schooliat/dashboard/production/.next/cache

echo "7. Restarting PM2..."
pm2 restart schooliat-dashboard-production --update-env

echo "8. Verifying build..."
if grep -r "Reports & Analytics" /opt/schooliat/dashboard/production/.next/ 2>/dev/null | head -1; then
    echo "✅ Build contains new menu items!"
else
    echo "❌ Build does NOT contain new menu items - check build logs"
fi

echo "=== Deployment Fix Complete ==="
pm2 status
```

## Verification Checklist

After deployment, verify:

- [ ] Changes are committed to `main` branch
- [ ] GitHub Actions workflow completed successfully
- [ ] Build contains new menu items (grep check)
- [ ] PM2 process restarted
- [ ] Browser cache cleared
- [ ] Hard refresh shows new menu items
- [ ] All routes work: `/admin/reports`, `/admin/settings`, `/admin/help`, `/admin/transfer-certificates`

## Common Issues & Solutions

### Issue 1: "Changes not in build"
**Solution**: Ensure changes are committed and pushed before deployment

### Issue 2: "PM2 using old build"
**Solution**: Delete and restart PM2 process, clear `.next/cache`

### Issue 3: "Browser showing old version"
**Solution**: Hard refresh, clear cache, test in incognito

### Issue 4: "Build path mismatch"
**Solution**: Verify PM2 `cwd` matches where build is copied

## Next Steps

1. **Commit and Push Changes** (if not done)
2. **Run Manual Deployment** (if automatic failed)
3. **Clear Browser Cache** and test
4. **Verify in Production** - check `app.schooliat.com`

---

**If issue persists**, check:
- PM2 logs: `pm2 logs schooliat-dashboard-production`
- Build logs from GitHub Actions
- Nginx error logs: `tail -f /var/log/nginx/error.log`

