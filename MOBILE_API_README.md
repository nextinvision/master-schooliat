# Mobile API Documentation & Client

This directory contains comprehensive API documentation and a TypeScript client for the SchooliAt mobile application.

## Files Created

### 1. `MOBILE_API_DOCUMENTATION.md`
Complete API documentation for the mobile application covering:
- **Authentication APIs** - Login, password reset, OTP verification
- **Teacher APIs** - Dashboard, students, attendance, homework, marks, timetable, notes, leave management
- **Student APIs** - Dashboard, profile, attendance, homework, marks, results, timetable, notes, syllabus, fees
- **Employee (Company) APIs** - Dashboard, schools management, employees management, vendors, licenses, receipts, statistics
- **Shared APIs** - File uploads, notifications, announcements, circulars, events, calendar, gallery

### 2. `mobile-api-client.ts`
TypeScript API client with:
- Full type definitions for all API responses
- Organized methods by user type (teacher, student, employee)
- Automatic token management
- Error handling
- File upload support
- Platform-specific headers (android/ios)

## User Types Supported

The mobile application supports three types of login:

1. **Teacher** (`TEACHER` role)
   - Can manage classes, students, attendance
   - Create and grade homework
   - Enter marks and calculate results
   - View and manage timetables
   - Upload notes and syllabus
   - Request leave

2. **Student** (`STUDENT` role)
   - View own attendance and statistics
   - View and submit homework
   - View marks and results
   - View timetable
   - Access notes and syllabus
   - View fee status

3. **Employee** (`EMPLOYEE` role - SchooliAt company employees)
   - Manage schools (CRUD operations)
   - Manage employees (CRUD operations)
   - Manage vendors
   - Manage licenses
   - Create receipts
   - View statistics

## Platform Support

- **Android** - All three user types
- **iOS** - All three user types
- **Web** - Not supported for these roles (only SUPER_ADMIN and SCHOOL_ADMIN use web)

## Usage Example

### TypeScript/JavaScript

```typescript
import { MobileApiClient } from './mobile-api-client';

// Initialize client
const client = new MobileApiClient('https://api.schooliat.com/api/v1', 'android');

// Login as Teacher
const loginResponse = await client.auth.login('teacher@example.com', 'password');
console.log('Token:', loginResponse.token);
console.log('User:', loginResponse.user);

// Get teacher dashboard
const dashboard = await client.teacher.getDashboard();

// Get students
const students = await client.teacher.getStudents({ classId: 'class-id' });

// Mark attendance
await client.teacher.markAttendance({
  studentId: 'student-id',
  classId: 'class-id',
  date: '2026-02-09',
  status: 'PRESENT'
});

// Create homework
const homework = await client.teacher.createHomework({
  title: 'Math Assignment 1',
  description: 'Complete exercises 1-10',
  classIds: ['class-id'],
  subjectId: 'subject-id',
  dueDate: '2026-02-15T23:59:59Z',
  isMCQ: false,
  attachments: []
});
```

### Student Example

```typescript
// Login as Student
await client.auth.login('student@example.com', 'password');

// Get student dashboard
const dashboard = await client.student.getDashboard();

// Get own attendance
const attendance = await client.student.getAttendance({
  startDate: '2026-02-01',
  endDate: '2026-02-28'
});

// Get homework
const homework = await client.student.getHomework({ status: 'PENDING' });

// Submit homework
await client.student.submitHomework('homework-id', {
  files: ['file-id-1', 'file-id-2']
});

// Get results
const results = await client.student.getResults();
```

### Employee Example

```typescript
// Login as Employee
await client.auth.login('employee@example.com', 'password');

// Get employee dashboard
const dashboard = await client.employee.getDashboard();

// Get schools
const schools = await client.employee.getSchools({ page: 1, limit: 50 });

// Create school
const school = await client.employee.createSchool({
  name: 'New School',
  code: 'SCH001',
  email: 'school@example.com',
  phone: '1234567890'
});

// Get employees
const employees = await client.employee.getEmployees();

// Create license
const license = await client.employee.createLicense({
  schoolId: 'school-id',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  maxStudents: 1000,
  maxStaff: 100
});
```

## Authentication Flow

1. User enters email and password
2. Call `client.auth.login(email, password)`
3. Client automatically stores the JWT token
4. All subsequent requests include the token in Authorization header
5. Token expires after 48 hours - client should handle 401 errors and redirect to login

## Error Handling

The client throws `ApiError` exceptions that include:
- Error message
- HTTP status code
- Error data (if available)

```typescript
try {
  await client.teacher.createHomework({...});
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Data:', error.data);
    
    if (error.status === 401) {
      // Token expired - redirect to login
      client.auth.logout();
      // Navigate to login screen
    }
  }
}
```

## File Uploads

```typescript
// Upload a file
const file = new File([...], 'document.pdf', { type: 'application/pdf' });
const fileResponse = await client.shared.uploadFile(file);

// Use file ID in other requests
await client.teacher.createHomework({
  ...,
  attachments: [fileResponse.id]
});

// Get file URL
const fileUrl = client.shared.getFileUrl(fileResponse.id);
```

## Notifications

```typescript
// Get notifications
const notifications = await client.shared.getNotifications({
  isRead: false,
  page: 1,
  limit: 50
});

// Mark notification as read
await client.shared.markNotificationAsRead('notification-id');
```

## Base URL Configuration

The API base URL can be configured:

```typescript
// Development
const client = new MobileApiClient('http://localhost:3000/api/v1', 'android');

// Production
const client = new MobileApiClient('https://api.schooliat.com/api/v1', 'ios');
```

## Platform Header

The `x-platform` header is automatically set based on the platform parameter:
- `'android'` - Sets header to `'android'`
- `'ios'` - Sets header to `'ios'`

This header is required for authentication and determines which roles can login.

## Rate Limiting

The API implements rate limiting:
- **Authentication endpoints:** 5 requests per 15 minutes per IP
- **General API:** 100 requests per 15 minutes per IP
- **File uploads:** 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Time when limit resets

## Response Format

All API responses follow this format:

```typescript
{
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Error Response Format

```typescript
{
  message: string;
  errorCode: string;
  status: 'error';
}
```

## Common Error Codes

- `UNAUTHORIZED` (401) - Authentication required or invalid token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Request validation failed
- `OTP_INVALID` (400) - Invalid OTP
- `OTP_EXPIRED` (400) - OTP expired
- `USER_NOT_FOUND` (404) - User not found
- `PASSWORD_MISMATCH` (400) - Current password is incorrect

## Best Practices

1. **Always handle errors** - Wrap API calls in try-catch blocks
2. **Check token expiration** - Handle 401 errors and redirect to login
3. **Use pagination** - For large data sets, use pagination parameters
4. **Cache responses** - Cache static data like timetable, syllabus
5. **Validate data** - Validate data before sending requests
6. **Show loading states** - Display loading indicators during API calls
7. **Handle network errors** - Show user-friendly messages for network failures
8. **Implement retry logic** - Retry failed requests (except 4xx errors)

## Integration with React Native

```typescript
import { MobileApiClient } from './mobile-api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create client instance
const client = new MobileApiClient('https://api.schooliat.com/api/v1', 'android');

// Load token from storage on app start
const token = await AsyncStorage.getItem('auth_token');
if (token) {
  client.setToken(token);
}

// Save token after login
const loginResponse = await client.auth.login(email, password);
await AsyncStorage.setItem('auth_token', loginResponse.token);

// Clear token on logout
client.auth.logout();
await AsyncStorage.removeItem('auth_token');
```

## Testing

You can test the API endpoints using the documentation in `MOBILE_API_DOCUMENTATION.md` or by using the TypeScript client.

## Support

For API issues or questions, refer to:
- `MOBILE_API_DOCUMENTATION.md` - Complete API reference
- `mobile-api-client.ts` - TypeScript client implementation
- Backend API documentation in `/Backend/API_DOCUMENTATION.md`

---

**Last Updated:** February 2026  
**Version:** 1.0.0




