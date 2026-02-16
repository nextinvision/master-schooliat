# Mobile API Endpoint Fixes Summary

## Issues Fixed

### 1. Dashboard Service - Exam Query Error (500 Error)
**Problem**: Dashboard was trying to query `Exam.startDate` which doesn't exist. Exam dates are stored in `ExamCalendarItem.date`.

**Fix**: Updated `dashboard.service.js` to:
- Query `ExamCalendar` with `examCalendarItems` filtered by date
- Fetch `Exam` records separately using the `examId` from `ExamCalendar`
- Combine the data properly

**Files Changed**:
- `/root/master-schooliat/Backend/src/services/dashboard.service.js` (lines 558-592 and 760-794)

### 2. Forgot Password - Unique Constraint Error (500 Error)
**Problem**: `passwordResetToken` table has a unique constraint on `user_id`, causing errors when trying to create a new token when one already exists.

**Fix**: Changed from `updateMany` to `deleteMany` to remove existing unused tokens before creating a new one.

**Files Changed**:
- `/root/master-schooliat/Backend/src/routers/auth.router.js` (lines 164-170)

## Routes That Need Postman Collection Updates

The following routes in the Postman collection need to be updated:

1. **`/students`** - This route doesn't exist. Students should be accessed through:
   - `/schools/classes/:classId/students` (if exists)
   - Or through class endpoints

2. **`/syllabus`** - Should be `/notes/syllabus` (GET endpoint exists at this path)

3. **`/fees/status`** - This route doesn't exist. Use `/fees` endpoint instead.

4. **`/calendar`** - Should be `/calendar/:date` (requires date parameter)

5. **`/notifications`** - Should be `/communication/notifications`

6. **`/communication/announcements`** - This is a POST endpoint, not GET. For GET, check if there's a separate endpoint.

7. **`/employees`** - This route doesn't exist. Employee management might be through a different endpoint.

8. **`/notes`** - Should be `/notes` (GET endpoint exists)

9. **`/leave/requests`** - Should be `/leave/requests` (GET endpoint exists)

## Testing Status

- ✅ Login endpoint working
- ✅ Dashboard endpoint - Fixed (needs deployment)
- ✅ Forgot password endpoint - Fixed (needs deployment)
- ⚠️ Other endpoints - Some routes need Postman collection updates

## Next Steps

1. **Deploy fixes**: Push changes to main branch to trigger CI/CD deployment
2. **Update Postman Collection**: Fix incorrect routes in `Mobile_api.json`
3. **Test after deployment**: Re-run endpoint tests after deployment completes

## Files Modified

1. `/root/master-schooliat/Backend/src/services/dashboard.service.js`
2. `/root/master-schooliat/Backend/src/routers/auth.router.js`

