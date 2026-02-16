# Mobile API Test Suite

This test script comprehensively tests all mobile API endpoints for the three user types: Teacher, Student, and Employee (Company).

## Prerequisites

1. **Backend server must be running**
   ```bash
   cd /root/master-schooliat/Backend
   npm start
   # OR
   npm run dev
   ```

2. **Database must be set up and seeded**
   ```bash
   npm run prisma:migrate
   npm run seed
   ```

3. **Test users must exist** in the database with the following roles:
   - Teacher user (role: `TEACHER`)
   - Student user (role: `STUDENT`)
   - Employee user (role: `EMPLOYEE`)

## Usage

### Basic Usage

```bash
cd /root/master-schooliat/Backend
npm run test:mobile
```

### With Custom API URL

```bash
API_URL=http://localhost:3000 npm run test:mobile
```

### With Custom Credentials

```bash
TEACHER_EMAIL=teacher@example.com \
TEACHER_PASSWORD=password123 \
STUDENT_EMAIL=student@example.com \
STUDENT_PASSWORD=password123 \
EMPLOYEE_EMAIL=employee@example.com \
EMPLOYEE_PASSWORD=password123 \
npm run test:mobile
```

### Using .env file

Create a `.env` file in the Backend directory:

```env
API_URL=http://localhost:3000
TEACHER_EMAIL=teacher@example.com
TEACHER_PASSWORD=password123
STUDENT_EMAIL=student@example.com
STUDENT_PASSWORD=password123
EMPLOYEE_EMAIL=employee@example.com
EMPLOYEE_PASSWORD=password123
```

Then run:
```bash
npm run test:mobile
```

## What Gets Tested

### Authentication APIs
- ✅ Request OTP
- ✅ Forgot Password
- ✅ Login (for all three user types)

### Teacher APIs
- ✅ Dashboard
- ✅ Get Students
- ✅ Get Student by ID
- ✅ Mark Attendance
- ✅ Get Attendance
- ✅ Get Attendance Statistics
- ✅ Create Homework
- ✅ Get Homework
- ✅ Enter Marks
- ✅ Get Marks
- ✅ Get Timetables
- ✅ Get Notes
- ✅ Get Leave Requests
- ✅ Get Leave Balance

### Student APIs
- ✅ Dashboard
- ✅ Get Profile
- ✅ Get Attendance
- ✅ Get Attendance Statistics
- ✅ Get Homework
- ✅ Submit Homework
- ✅ Get Marks
- ✅ Get Results
- ✅ Get Timetable
- ✅ Get Notes
- ✅ Get Syllabus
- ✅ Get Fees
- ✅ Get Fee Status

### Employee (Company) APIs
- ✅ Dashboard
- ✅ Get Schools
- ✅ Get School by ID
- ✅ Get Employees
- ✅ Get Employee by ID
- ✅ Get Vendors
- ✅ Get Vendor by ID
- ✅ Get Licenses
- ✅ Get License by ID
- ✅ Get Receipts
- ✅ Get School Statistics

### Shared APIs
- ✅ Get Notifications
- ✅ Mark Notification as Read
- ✅ Get Announcements
- ✅ Get Circulars
- ✅ Get Events
- ✅ Get Calendar
- ✅ Get Gallery

## Output

The test script provides:
- ✅ Color-coded output (green for success, yellow for warnings, red for errors)
- ✅ Detailed test results for each endpoint
- ✅ Summary statistics at the end
- ✅ Breakdown by user type

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║     SchooliAt Mobile API Test Suite                     ║
╚═══════════════════════════════════════════════════════════╝

Base URL: http://localhost:3000
Platform: android

✅ [TEACHER] GET /statistics/dashboard - 200 - Dashboard data fetched successfully
✅ [STUDENT] GET /attendance - 200 - Attendance fetched successfully
✅ [EMPLOYEE] GET /schools - 200 - Schools fetched successfully

📊 TEST SUMMARY
═══════════════════════════════════════════════════════════

✅ Successful: 45
⚠️  Warnings (4xx): 3
❌ Errors: 0
📊 Total: 48

Breakdown by User Type:
  TEACHER: 15 success, 1 warnings, 0 errors (16 total)
  STUDENT: 12 success, 1 warnings, 0 errors (13 total)
  EMPLOYEE: 10 success, 1 warnings, 0 errors (11 total)
  SHARED: 8 success, 0 warnings, 0 errors (8 total)
```

## Troubleshooting

### Server Not Running
If you see `Error: fetch failed`, make sure the backend server is running:
```bash
cd /root/master-schooliat/Backend
npm start
```

### Authentication Failures
If authentication fails:
1. Check that test users exist in the database
2. Verify credentials are correct
3. Ensure users have the correct roles (TEACHER, STUDENT, EMPLOYEE)
4. Check that users are not soft-deleted

### 401 Unauthorized Errors
- Token may have expired (tokens expire after 48 hours)
- User may not have the correct role
- Platform header may be incorrect (should be 'android' or 'ios' for mobile)

### 403 Forbidden Errors
- User may not have required permissions
- Resource may belong to a different school/user

### 404 Not Found Errors
- Resource may not exist
- ID may be incorrect
- Resource may be soft-deleted

## Creating Test Users

If test users don't exist, you can create them using the seed script or manually:

```bash
# Run seed script (creates default users)
npm run seed
```

Or create users via API (requires admin access):
```bash
# Create Teacher
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "request": {
      "email": "teacher@example.com",
      "password": "password123",
      "firstName": "Test",
      "lastName": "Teacher",
      "roleId": "<teacher-role-id>",
      "schoolId": "<school-id>",
      "userType": "SCHOOL"
    }
  }'
```

## Notes

- The test script uses the `android` platform by default
- Some tests may fail if required resources (classes, subjects, etc.) don't exist
- The script creates some test resources but may need existing data for full testing
- Rate limiting may affect test results if running multiple times quickly

## Customization

You can modify the test script (`test-mobile-apis.js`) to:
- Add more test cases
- Test specific endpoints
- Change test data
- Add custom assertions
- Export results to JSON/CSV

## Integration with CI/CD

You can integrate this test suite into your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Test Mobile APIs
  run: |
    cd Backend
    npm run test:mobile
  env:
    API_URL: http://localhost:3000
    TEACHER_EMAIL: ${{ secrets.TEACHER_EMAIL }}
    TEACHER_PASSWORD: ${{ secrets.TEACHER_PASSWORD }}
    STUDENT_EMAIL: ${{ secrets.STUDENT_EMAIL }}
    STUDENT_PASSWORD: ${{ secrets.STUDENT_PASSWORD }}
    EMPLOYEE_EMAIL: ${{ secrets.EMPLOYEE_EMAIL }}
    EMPLOYEE_PASSWORD: ${{ secrets.EMPLOYEE_PASSWORD }}
```

