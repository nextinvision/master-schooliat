# Production Deployment Fix - Sidebar Not Visible

## Issue
Deployment completed but sidebar changes (Reports, Settings, Help, Transfer Certificates) are not visible on `app.schooliat.com`.

## Root Cause
The changes are **committed locally** but may not be:
1. Pushed to `origin/main` (GitHub)
2. Built correctly on production server
3. PM2 cache not cleared

## Quick Fix

### Option 1: Push Changes to GitHub (If Not Pushed)

```bash
cd /root/master-schooliat
git push origin main
```

This will trigger automatic deployment via GitHub Actions.

### Option 2: Manual Deployment on Production Server

**SSH into production server** and run:

```bash
# Run the fix script
bash /opt/schooliat/repo/fix-production-deployment.sh
```

**OR manually run these commands:**

```bash
cd /opt/schooliat/repo
git fetch origin main
git checkout main
git reset --hard origin/main

cd dashboard
npm ci
cp /opt/schooliat/dashboard/production/shared/.env .env.production
NODE_ENV=production npm run build

rm -rf /opt/schooliat/dashboard/production/.next
cp -r .next /opt/schooliat/dashboard/production/
cp -r public /opt/schooliat/dashboard/production/ 2>/dev/null || true
cp package.json /opt/schooliat/dashboard/production/

rm -rf /opt/schooliat/dashboard/production/.next/cache

pm2 restart schooliat-dashboard-production --update-env
```

### Option 3: Hard Restart PM2 (Clear All Cache)

```bash
# On production server
pm2 delete schooliat-dashboard-production
cd /opt/schooliat/dashboard/production
pm2 start node_modules/.bin/next --name schooliat-dashboard-production -- start -p 3002
pm2 save
```

## Verification Steps

### 1. Check if Changes Are in Repository
```bash
cd /root/master-schooliat
git log --oneline -1
git show HEAD:dashboard/lib/config/menu-items.ts | grep "Reports & Analytics"
```

### 2. Check if Changes Are Pushed
```bash
git log origin/main..HEAD --oneline
# If this shows commits, they're not pushed yet
```

### 3. Check Production Build
```bash
# On production server
grep -r "Reports & Analytics" /opt/schooliat/dashboard/production/.next/ 2>/dev/null | head -1
```

### 4. Clear Browser Cache
- **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Incognito Mode**: Test in private/incognito window
- **Clear Cache**: Browser settings → Clear browsing data

## Most Likely Issue

Based on the checks:
- ✅ Changes are **committed** (in HEAD)
- ❓ Changes may **not be pushed** to `origin/main`
- ❓ Production server may have **old build cached**

## Solution

### Step 1: Push to GitHub
```bash
cd /root/master-schooliat
git push origin main
```

### Step 2: Wait for GitHub Actions
- Check GitHub Actions tab
- Wait for deployment to complete

### Step 3: If Still Not Visible
Run manual deployment on production server (Option 2 above)

## Expected Result

After fix, you should see:
- ✅ "Reports & Analytics" menu item
- ✅ "Settings" menu item
- ✅ "Help" menu item
- ✅ Students submenu with "Transfer Certificates"

## Troubleshooting

If still not working:

1. **Check PM2 Logs**
   ```bash
   pm2 logs schooliat-dashboard-production --lines 100
   ```

2. **Check Build Logs**
   - Look for errors in GitHub Actions
   - Check if build completed successfully

3. **Verify File Locations**
   ```bash
   pm2 describe schooliat-dashboard-production
   # Check "cwd" matches where build is copied
   ```

4. **Test Routes Directly**
   - `https://app.schooliat.com/admin/reports`
   - `https://app.schooliat.com/admin/settings`
   - `https://app.schooliat.com/admin/help`
   - `https://app.schooliat.com/admin/transfer-certificates`

---

**Quick Action**: Run `git push origin main` first, then check if automatic deployment works!

