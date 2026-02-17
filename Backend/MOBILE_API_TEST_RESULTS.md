# Mobile API Test Results

**Test Date:** 2026-02-16T11:00:35.022Z

## Summary

- **Total Tests:** 78
- **Passed:** 11 ✅
- **Failed:** 67 ❌
- **Success Rate:** 14.10%

## Results by Role

### PUBLIC

- Passed: 2
- Failed: 3

#### Failed Endpoints:

- **Auth: Reset Password** (POST https://api.schooliat.com/auth/reset-password)
  - Status: 400

- **Auth: Change Password** (POST https://api.schooliat.com/auth/change-password)
  - Status: 401

- **Auth: Verify OTP** (POST https://api.schooliat.com/auth/verify-otp)
  - Status: 400

### TEACHER

- Passed: 2
- Failed: 35

#### Failed Endpoints:

- **Teacher: Get Students** (GET https://api.schooliat.com/api/v1/students?page=1&limit=50)
  - Status: 404

- **Teacher: Get Student By ID** (GET https://api.schooliat.com/api/v1/students/:id)
  - Status: 404

- **Teacher: Mark Attendance** (POST https://api.schooliat.com/api/v1/attendance/mark)
  - Status: 403

- **Teacher: Mark Bulk Attendance** (POST https://api.schooliat.com/api/v1/attendance/mark-bulk)
  - Status: 403

- **Teacher: Get Attendance** (GET https://api.schooliat.com/api/v1/attendance)
  - Status: 403

- **Teacher: Get Attendance Statistics** (GET https://api.schooliat.com/api/v1/attendance/statistics)
  - Status: 403

- **Teacher: Create Homework** (POST https://api.schooliat.com/api/v1/homework)
  - Status: 403

- **Teacher: Get Homework** (GET https://api.schooliat.com/api/v1/homework)
  - Status: 403

- **Teacher: Grade Homework** (POST https://api.schooliat.com/api/v1/homework/:id/grade)
  - Status: 404

- **Teacher: Enter Marks** (POST https://api.schooliat.com/api/v1/marks)
  - Status: 403

- **Teacher: Enter Bulk Marks** (POST https://api.schooliat.com/api/v1/marks/bulk)
  - Status: 403

- **Teacher: Get Marks** (GET https://api.schooliat.com/api/v1/marks)
  - Status: 403

- **Teacher: Calculate Result** (POST https://api.schooliat.com/api/v1/marks/calculate-result)
  - Status: 403

- **Teacher: Publish Results** (POST https://api.schooliat.com/api/v1/marks/publish-results)
  - Status: 404

- **Teacher: Get Timetables** (GET https://api.schooliat.com/api/v1/timetables)
  - Status: 403

- **Teacher: Get Timetable By ID** (GET https://api.schooliat.com/api/v1/timetables/:id)
  - Status: 404

- **Teacher: Upload Note** (POST https://api.schooliat.com/api/v1/notes)
  - Status: 404

- **Teacher: Get Notes** (GET https://api.schooliat.com/api/v1/notes)
  - Status: 404

- **Teacher: Update Note** (PUT https://api.schooliat.com/api/v1/notes/:id)
  - Status: 404

- **Teacher: Delete Note** (DELETE https://api.schooliat.com/api/v1/notes/:id)
  - Status: 404

- **Teacher: Request Leave** (POST https://api.schooliat.com/api/v1/leave/request)
  - Status: 403

- **Teacher: Get Leave Requests** (GET https://api.schooliat.com/api/v1/leave/requests)
  - Status: 404

- **Teacher: Get Leave Balance** (GET https://api.schooliat.com/api/v1/leave/balance)
  - Status: 403

- **Shared: Upload File** (POST https://api.schooliat.com/api/v1/files)
  - Status: 400

- **Shared: Get File** (GET https://api.schooliat.com/api/v1/files/:id)
  - Status: 404

- **Shared: Create Conversation** (POST https://api.schooliat.com/api/v1/communication/conversations)
  - Status: 403

- **Shared: Get Conversations** (GET https://api.schooliat.com/api/v1/communication/conversations)
  - Status: 403

- **Shared: Send Message** (POST https://api.schooliat.com/api/v1/communication/conversations/:id/messages)
  - Status: 404

- **Shared: Get Messages** (GET https://api.schooliat.com/api/v1/communication/conversations/:id/messages?page=1&limit=50)
  - Status: 403

- **Shared: Get Notifications** (GET https://api.schooliat.com/api/v1/notifications?page=1&limit=50)
  - Status: 404

- **Shared: Mark Notification as Read** (PUT https://api.schooliat.com/api/v1/notifications/:id/read)
  - Status: 404

- **Shared: Get Announcements** (GET https://api.schooliat.com/api/v1/communication/announcements)
  - Status: 404

- **Shared: Get Circulars** (GET https://api.schooliat.com/api/v1/circulars)
  - Status: 403

- **Shared: Get Calendar** (GET https://api.schooliat.com/api/v1/calendar)
  - Status: 404

- **Shared: Get Galleries** (GET https://api.schooliat.com/api/v1/gallery)
  - Status: 403

### STUDENT

- Passed: 1
- Failed: 12

#### Failed Endpoints:

- **Student: Get Profile** (GET https://api.schooliat.com/api/v1/students/:id)
  - Status: 404

- **Student: Get Attendance** (GET https://api.schooliat.com/api/v1/attendance)
  - Status: 403

- **Student: Get Attendance Statistics** (GET https://api.schooliat.com/api/v1/attendance/statistics)
  - Status: 403

- **Student: Get Homework** (GET https://api.schooliat.com/api/v1/homework)
  - Status: 403

- **Student: Submit Homework** (POST https://api.schooliat.com/api/v1/homework/:id/submit)
  - Status: 404

- **Student: Get Marks** (GET https://api.schooliat.com/api/v1/marks)
  - Status: 403

- **Student: Get Results** (GET https://api.schooliat.com/api/v1/marks/results)
  - Status: 403

- **Student: Get Timetable** (GET https://api.schooliat.com/api/v1/timetables)
  - Status: 403

- **Student: Get Notes** (GET https://api.schooliat.com/api/v1/notes)
  - Status: 404

- **Student: Get Syllabus** (GET https://api.schooliat.com/api/v1/syllabus)
  - Status: 404

- **Student: Get Fees** (GET https://api.schooliat.com/api/v1/fees)
  - Status: 403

- **Student: Get Fee Status** (GET https://api.schooliat.com/api/v1/fees/status)
  - Status: 404

### EMPLOYEE

- Passed: 6
- Failed: 17

#### Failed Endpoints:

- **Employee: Get School By ID** (GET https://api.schooliat.com/api/v1/schools/:id)
  - Status: 404

- **Employee: Create School** (POST https://api.schooliat.com/api/v1/schools)
  - Status: 400

- **Employee: Update School** (PUT https://api.schooliat.com/api/v1/schools/:id)
  - Status: 404

- **Employee: Delete School** (DELETE https://api.schooliat.com/api/v1/schools/:id)
  - Status: 400

- **Employee: Get Employees** (GET https://api.schooliat.com/api/v1/employees?page=1&limit=50)
  - Status: 404

- **Employee: Get Employee By ID** (GET https://api.schooliat.com/api/v1/employees/:id)
  - Status: 404

- **Employee: Create Employee** (POST https://api.schooliat.com/api/v1/employees)
  - Status: 404

- **Employee: Update Employee** (PUT https://api.schooliat.com/api/v1/employees/:id)
  - Status: 404

- **Employee: Delete Employee** (DELETE https://api.schooliat.com/api/v1/employees/:id)
  - Status: 404

- **Employee: Create Vendor** (POST https://api.schooliat.com/api/v1/vendors)
  - Status: 400

- **Employee: Get Vendor By ID** (GET https://api.schooliat.com/api/v1/vendors/:id)
  - Status: 404

- **Employee: Update Vendor** (PUT https://api.schooliat.com/api/v1/vendors/:id)
  - Status: 404

- **Employee: Delete Vendor** (DELETE https://api.schooliat.com/api/v1/vendors/:id)
  - Status: 400

- **Employee: Create License** (POST https://api.schooliat.com/api/v1/licenses)
  - Status: 500

- **Employee: Get License By ID** (GET https://api.schooliat.com/api/v1/licenses/:id)
  - Status: 500

- **Employee: Update License** (PUT https://api.schooliat.com/api/v1/licenses/:id)
  - Status: 500

- **Employee: Create Receipt** (POST https://api.schooliat.com/api/v1/receipts)
  - Status: 500

