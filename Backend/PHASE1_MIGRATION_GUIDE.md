# Phase 1 Migration & Testing Guide

This guide covers the database migration and API testing for Phase 1 modules.

## Prerequisites

1. **Database Setup**
   - PostgreSQL database running and accessible
   - Database credentials configured in `.env` file
   - Connection string format: `DATABASE_URL="postgresql://user:password@host:port/database"`

2. **Environment Variables**
   - Ensure `.env` file exists with proper database credentials
   - Set `API_URL` if testing against remote server (default: `http://localhost:3000`)

3. **Dependencies**
   - Node.js >= 20.19.0
   - npm >= 10.0.0
   - All npm packages installed (`npm install`)

## Database Migration

### Step 1: Review Schema Changes

Before running migrations, review the schema changes in `src/prisma/db/schema.prisma`:

- New models: `Attendance`, `Timetable`, `Homework`, `LeaveRequest`, `Marks`, `Result`, `Conversation`, `Message`, `Notification`, `OTP`, `PasswordResetToken`, `ParentChildLink`, `AuditLog`
- New enums: `AttendanceStatus`, `SubmissionStatus`, `LeaveStatus`, `ConversationType`, `NotificationType`, `OTPType`, `PasswordResetTokenType`
- New permissions for all Phase 1 modules

### Step 2: Run Migration

**Option A: Using the migration script (Recommended)**
```bash
npm run migrate:phase1
```

**Option B: Manual migration**
```bash
# Format schema
npm run prisma:format

# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate:create -- --name phase1_modules

# Apply migration
npm run prisma:migrate
```

### Step 3: Verify Migration

Check migration status:
```bash
npm run migrate:status
```

Or manually:
```bash
npm run prisma:migrate:status
```

### Step 4: Verify Database Schema

Open Prisma Studio to visually verify the schema:
```bash
npx prisma studio --schema=src/prisma/db/schema.prisma
```

## API Testing

### Phase 1 Specific Tests

Run comprehensive Phase 1 API tests:
```bash
npm run test:phase1
```

Or directly:
```bash
node test-phase1-apis.js
```

### All API Tests

Run all API tests (including Phase 1):
```bash
npm run test:all
```

Or directly:
```bash
node test-all-apis.js
```

### Test Configuration

Set environment variables for testing:
```bash
# For local testing
export API_URL=http://localhost:3000
export TEST_EMAIL=admin@schooliat.com
export TEST_PASSWORD=Admin@123

# For production/staging testing
export API_URL=https://your-api-url.com
```

## Phase 1 Modules Tested

The test script covers the following modules:

1. **Authentication**
   - OTP request/verification
   - Password recovery
   - Password change

2. **Attendance Management**
   - Mark attendance (daily/period-wise)
   - Bulk attendance entry
   - Attendance reports
   - Student/class attendance queries

3. **Timetable Management**
   - Create/update timetables
   - Conflict detection
   - Class/teacher/subject views
   - Print-friendly format

4. **Homework & Assignments**
   - Create homework
   - MCQ assignments with auto-grading
   - Submit homework
   - Grade homework
   - View submissions

5. **Marks & Results**
   - Enter marks (single/bulk)
   - Calculate results
   - Publish results
   - View marks and results

6. **Leave Management**
   - Create leave requests
   - Approve/reject leaves
   - Leave balance tracking
   - Leave calendar view

7. **Communication & Notifications**
   - Create conversations
   - Send messages
   - Create announcements
   - Manage notifications

8. **Fees (Enhanced)**
   - Fee installments
   - Payment recording
   - Late fee calculation
   - Fee analytics

## Troubleshooting

### Migration Issues

**Error: Authentication failed**
- Check database credentials in `.env`
- Verify database is running and accessible
- Check network connectivity

**Error: Migration already exists**
- Check existing migrations in `prisma/migrations/`
- Use `prisma migrate reset` to start fresh (⚠️ **WARNING**: This deletes all data)

**Error: Schema drift detected**
- Run `prisma migrate resolve` to mark migrations as applied
- Or create a new migration to sync schema

### Testing Issues

**Error: Connection refused**
- Ensure API server is running (`npm start` or `npm run dev`)
- Check `API_URL` environment variable
- Verify server port matches URL

**Error: Authentication failed**
- Check `TEST_EMAIL` and `TEST_PASSWORD` environment variables
- Verify user exists in database
- Check user permissions/role

**Error: 403 Forbidden**
- Verify user has required permissions
- Check role assignments
- Ensure school context is correct

## Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] Prisma Client generated
- [ ] Database schema verified
- [ ] All Phase 1 endpoints tested
- [ ] Authentication working
- [ ] Permissions assigned correctly
- [ ] Sample data created (if needed)

## Next Steps

After successful migration and testing:

1. **Seed Data** (Optional)
   ```bash
   npm run seed
   ```

2. **Update API Documentation**
   - Update OpenAPI/Swagger docs
   - Document new endpoints
   - Update request/response examples

3. **Deploy to Staging**
   - Run migrations on staging database
   - Test all endpoints on staging
   - Verify data integrity

4. **Production Deployment**
   - Create production migration plan
   - Backup existing database
   - Run migrations during maintenance window
   - Verify all systems operational

## Support

For issues or questions:
- Check Prisma documentation: https://www.prisma.io/docs
- Review API logs for detailed error messages
- Check database logs for migration issues

