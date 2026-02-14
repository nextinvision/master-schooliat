# Production Login Network Error - Root Cause & Fix

## Problem
Production login was failing with "Network error" message.

## Root Cause Analysis

### Primary Issue: Missing API Client File
The `dashboard/lib/api/client.ts` file was deleted, but **ALL hooks and components** were still importing from it:
- 25+ hook files importing `get`, `post`, `put`, `del`, `patch` from `@/lib/api/client`
- `auth.ts` importing `post` from `./client`
- This caused build failures and runtime errors

### Secondary Issue: Auth Import
`auth.ts` had an unused import from the deleted client file, though it uses `fetch` directly.

## Root-Level Solution Implemented

### 1. Recreated API Client (`lib/api/client.ts`)
- ✅ Complete API client with all HTTP methods (get, post, put, del, patch)
- ✅ Token management from sessionStorage
- ✅ Error handling with ApiError class
- ✅ Event emission for unauthorized/forbidden errors
- ✅ Network error handling
- ✅ File upload support
- ✅ Proper BASE_URL configuration using `NEXT_PUBLIC_API_URL`

### 2. Fixed Auth Import (`lib/api/auth.ts`)
- ✅ Removed unused `post` import from deleted client
- ✅ Added validation for API URL
- ✅ Uses `fetch` directly (no dependency on client)

### 3. API URL Configuration
The API client uses:
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.schooliat.com";
```

**For Production:**
- Must be set in `.env.production` file
- Deployment script copies from `/opt/schooliat/dashboard/production/shared/.env`
- Next.js embeds `NEXT_PUBLIC_*` variables at build time

## Files Fixed

1. ✅ `/dashboard/lib/api/client.ts` - Recreated complete API client
2. ✅ `/dashboard/lib/api/auth.ts` - Removed broken import

## Verification

- ✅ API client recreated with all required methods
- ✅ All hooks can now import from client
- ✅ Auth uses fetch directly (no client dependency)
- ✅ Build should succeed (pending TypeScript fix in photo-upload.tsx)

## Next Steps for Production

1. **Verify Environment Variable:**
   ```bash
   # On production server
   cat /opt/schooliat/dashboard/production/shared/.env | grep NEXT_PUBLIC_API_URL
   ```
   
   Should contain:
   ```env
   NEXT_PUBLIC_API_URL=https://api.schooliat.com
   # or your actual API URL
   ```

2. **Redeploy:**
   - The fix has been committed to `main` branch
   - Next deployment will include the restored API client
   - Login should work after deployment

3. **Test Login:**
   - After deployment, test login functionality
   - Check browser console for any API errors
   - Verify API URL is correct in network requests

## Status

✅ **Root Cause:** Missing API client file  
✅ **Solution:** Recreated complete API client  
✅ **Committed:** Changes pushed to main branch  
⏳ **Pending:** Production deployment

---

**Fix Date:** Current  
**Commit:** `f0ac816 - fix: restore API client and fix auth imports for production login`

