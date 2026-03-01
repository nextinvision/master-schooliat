# SchooliAt Mobile Application - Complete API Documentation

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Base URL:** `https://api.schooliat.com/api/v1`  
**Platform:** Mobile (Android/iOS)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Headers](#common-headers)
4. [Teacher APIs](#teacher-apis)
5. [Student APIs](#student-apis)
6. [Employee (Company) APIs](#employee-company-apis)
7. [Shared APIs](#shared-apis)
8. [Error Handling](#error-handling)
9. [Response Format](#response-format)

---

## Overview

This documentation covers all API endpoints available for the SchooliAt mobile application. The mobile app supports three types of user logins:

1. **Teacher** - School teachers who can manage classes, students, attendance, homework, and marks
2. **Student** - Students who can view their attendance, homework, results, timetable, and fees
3. **Employee** - SchooliAt company employees who manage schools, vendors, licenses, and system administration

### Platform Support
- **Android** - All three user types
- **iOS** - All three user types
- **Web** - Not supported for these roles (only SUPER_ADMIN and SCHOOL_ADMIN use web)

---

## Authentication

### Login Endpoint

**POST** `/auth/authenticate`

Authenticate user and receive JWT token. The platform header determines which roles can login.

**Request Headers:**
```
Content-Type: application/json
x-platform: android | ios
```

**Request Body:**
```json
{
  "request": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "message": "User authenticated!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "userType": "SCHOOL",
      "role": {
        "id": "role-id",
        "name": "TEACHER" | "STUDENT" | "EMPLOYEE",
        "permissions": ["GET_STUDENTS", "CREATE_HOMEWORK", ...]
      },
      "schoolId": "school-id",
      "school": {
        "id": "school-id",
        "name": "School Name",
        "code": "SCH001"
      }
    }
  }
}
```

**Role-Based Platform Access:**
- `TEACHER` - Can login via `android` or `ios`
- `STUDENT` - Can login via `android` or `ios`
- `EMPLOYEE` - Can login via `android` or `ios`
- `SUPER_ADMIN` - Web only (not mobile)
- `SCHOOL_ADMIN` - Web only (not mobile)

**Error Responses:**
- `401 Unauthorized` - Invalid credentials or platform mismatch
- `404 Not Found` - User not found (treated as invalid credentials for security)

---

### Forgot Password

**POST** `/auth/forgot-password`

Request password reset OTP.

**Request Body:**
```json
{
  "request": {
    "email": "user@example.com"
  }
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

---

### Reset Password

**POST** `/auth/reset-password`

Reset password using OTP or reset token.

**Request Body:**
```json
{
  "request": {
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "newPassword123"
  }
}
```

**OR using reset token:**
```json
{
  "request": {
    "token": "reset-token-from-email",
    "password": "newPassword123",
    "otp": "123456" // optional
  }
}
```

---

### Change Password

**POST** `/auth/change-password`

Change password for authenticated users.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "request": {
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }
}
```

---

### Request OTP

**POST** `/auth/request-otp`

Request OTP for various purposes.

**Request Body:**
```json
{
  "request": {
    "email": "user@example.com",
    "purpose": "verification" | "password-reset" | "login" | "deletion"
  }
}
```

**Response:**
```json
{
  "message": "OTP sent successfully. Please check your email.",
  "data": {
    "id": "otp-id",
    "expiresAt": "2026-02-09T12:00:00Z"
  }
}
```

---

### Verify OTP

**POST** `/auth/verify-otp`

Verify OTP code.

**Request Body:**
```json
{
  "request": {
    "email": "user@example.com",
    "otp": "123456",
    "purpose": "verification" | "password-reset" | "login" | "deletion"
  }
}
```

**Response:**
```json
{
  "message": "OTP verified successfully",
  "verified": true
}
```

---

## Common Headers

All authenticated requests must include:

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
x-platform: android | ios
```

---

## Teacher APIs

### Dashboard

**GET** `/statistics/dashboard`

Get teacher dashboard statistics.

**Response:**
```json
{
  "message": "Dashboard data fetched successfully",
  "data": {
    "timetable": [
      {
        "id": "timetable-id",
        "name": "Class 10A Timetable",
        "class": {
          "id": "class-id",
          "name": "Class 10A"
        },
        "slots": [
          {
            "dayOfWeek": 1,
            "periodNumber": 1,
            "subject": {
              "id": "subject-id",
              "name": "Mathematics"
            },
            "startTime": "09:00",
            "endTime": "09:45",
            "room": "Room 101"
          }
        ]
      }
    ],
    "pendingHomeworks": 5,
    "submittedHomeworks": 12,
    "upcomingExams": 3,
    "totalStudents": 45,
    "classes": [
      {
        "id": "class-id",
        "name": "Class 10A",
        "studentCount": 45
      }
    ]
  }
}
```

---

### Students

**GET** `/students`

Get list of students (filtered by teacher's classes).

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)
- `search` (string, optional): Search by name or email
- `classId` (string, optional): Filter by class

**Response:**
```json
{
  "message": "Students fetched successfully",
  "data": [
    {
      "id": "student-id",
      "email": "student@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "studentProfile": {
        "id": "profile-id",
        "rollNumber": 1,
        "class": {
          "id": "class-id",
          "name": "Class 10A"
        },
        "fatherName": "Father Name",
        "motherName": "Mother Name",
        "fatherContact": "1234567890",
        "motherContact": "0987654321"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**GET** `/students/:id`

Get student details by ID.

---

### Attendance

**POST** `/attendance/mark`

Mark daily attendance for a student.

**Request Body:**
```json
{
  "request": {
    "studentId": "student-id",
    "classId": "class-id",
    "date": "2026-02-09",
    "status": "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY",
    "periodId": "period-id", // optional
    "lateArrivalTime": "2026-02-09T09:15:00Z", // optional
    "absenceReason": "Sick" // optional
  }
}
```

**POST** `/attendance/mark-bulk`

Mark attendance for multiple students at once.

**Request Body:**
```json
{
  "request": {
    "classId": "class-id",
    "date": "2026-02-09",
    "attendance": [
      {
        "studentId": "student-id-1",
        "status": "PRESENT"
      },
      {
        "studentId": "student-id-2",
        "status": "ABSENT",
        "absenceReason": "Sick"
      }
    ]
  }
}
```

**GET** `/attendance`

Get attendance records.

**Query Parameters:**
- `studentId` (string, optional)
- `classId` (string, optional)
- `startDate` (string, optional): ISO date
- `endDate` (string, optional): ISO date
- `status` (string, optional): PRESENT, ABSENT, LATE, HALF_DAY

**GET** `/attendance/statistics`

Get attendance statistics.

**Query Parameters:**
- `studentId` (string, optional)
- `classId` (string, optional)
- `startDate` (string, optional)
- `endDate` (string, optional)

**Response:**
```json
{
  "message": "Attendance statistics fetched successfully",
  "data": {
    "totalDays": 30,
    "presentDays": 28,
    "absentDays": 2,
    "lateDays": 0,
    "halfDays": 0,
    "attendancePercentage": 93.33
  }
}
```

---

### Homework

**POST** `/homework`

Create a new homework assignment.

**Request Body:**
```json
{
  "request": {
    "title": "Math Assignment 1",
    "description": "Complete exercises 1-10",
    "classIds": ["class-id-1", "class-id-2"],
    "subjectId": "subject-id",
    "dueDate": "2026-02-15T23:59:59Z",
    "isMCQ": false,
    "attachments": ["file-id-1", "file-id-2"],
    "mcqQuestions": [] // if isMCQ is true
  }
}
```

**GET** `/homework`

Get homework assignments.

**Query Parameters:**
- `studentId` (string, optional)
- `classId` (string, optional)
- `status` (string, optional): PENDING, SUBMITTED, GRADED

**Response:**
```json
{
  "message": "Homework fetched successfully",
  "data": [
    {
      "id": "homework-id",
      "title": "Math Assignment 1",
      "description": "Complete exercises 1-10",
      "subject": {
        "id": "subject-id",
        "name": "Mathematics"
      },
      "classes": [
        {
          "id": "class-id",
          "name": "Class 10A"
        }
      ],
      "dueDate": "2026-02-15T23:59:59Z",
      "createdAt": "2026-02-09T10:00:00Z",
      "submissions": [
        {
          "id": "submission-id",
          "student": {
            "id": "student-id",
            "firstName": "John",
            "lastName": "Doe"
          },
          "status": "SUBMITTED",
          "submittedAt": "2026-02-14T15:00:00Z"
        }
      ]
    }
  ]
}
```

**POST** `/homework/:id/grade`

Grade a homework submission.

**Request Body:**
```json
{
  "request": {
    "submissionId": "submission-id",
    "grade": "A+",
    "feedback": "Excellent work!",
    "marksObtained": 95, // optional
    "maxMarks": 100 // optional
  }
}
```

---

### Marks & Results

**POST** `/marks`

Enter marks for a student in an exam.

**Request Body:**
```json
{
  "request": {
    "examId": "exam-id",
    "studentId": "student-id",
    "subjectId": "subject-id",
    "classId": "class-id",
    "marksObtained": 85,
    "maxMarks": 100
  }
}
```

**POST** `/marks/bulk`

Enter marks for multiple students.

**Request Body:**
```json
{
  "request": {
    "examId": "exam-id",
    "classId": "class-id",
    "subjectId": "subject-id",
    "maxMarks": 100,
    "marks": [
      {
        "studentId": "student-id-1",
        "marksObtained": 85
      },
      {
        "studentId": "student-id-2",
        "marksObtained": 90
      }
    ]
  }
}
```

**GET** `/marks`

Get marks with filters.

**Query Parameters:**
- `examId` (string, optional)
- `studentId` (string, optional)
- `classId` (string, optional)
- `subjectId` (string, optional)

**POST** `/marks/calculate-result`

Calculate and generate results for an exam.

**Request Body:**
```json
{
  "request": {
    "examId": "exam-id",
    "classId": "class-id"
  }
}
```

**POST** `/marks/publish-results`

Publish results for students.

**Request Body:**
```json
{
  "request": {
    "resultIds": ["result-id-1", "result-id-2"]
  }
}
```

---

### Timetable

**GET** `/timetables`

Get timetables for teacher.

**Query Parameters:**
- `classId` (string, optional)
- `teacherId` (string, optional): Defaults to current teacher
- `subjectId` (string, optional)
- `isActive` (boolean, optional)

**Response:**
```json
{
  "message": "Timetables fetched successfully",
  "data": [
    {
      "id": "timetable-id",
      "name": "Class 10A Timetable",
      "class": {
        "id": "class-id",
        "name": "Class 10A"
      },
      "effectiveFrom": "2026-02-01",
      "effectiveTill": "2026-12-31",
      "slots": [
        {
          "dayOfWeek": 1,
          "periodNumber": 1,
          "subject": {
            "id": "subject-id",
            "name": "Mathematics"
          },
          "teacher": {
            "id": "teacher-id",
            "firstName": "Teacher",
            "lastName": "Name"
          },
          "startTime": "09:00",
          "endTime": "09:45",
          "room": "Room 101"
        }
      ]
    }
  ]
}
```

**GET** `/timetables/:id`

Get timetable details by ID.

---

### Notes & Syllabus

**POST** `/notes`

Upload a note/document.

**Request Body:**
```json
{
  "request": {
    "title": "Chapter 1 Notes",
    "subjectId": "subject-id",
    "classId": "class-id",
    "chapter": "Chapter 1",
    "fileId": "file-id",
    "description": "Introduction to Algebra"
  }
}
```

**GET** `/notes`

Get notes with filters.

**Query Parameters:**
- `subjectId` (string, optional)
- `classId` (string, optional)
- `chapter` (string, optional)

**PUT** `/notes/:id`

Update note information.

**DELETE** `/notes/:id`

Delete a note.

---

### Leave Management

**POST** `/leave/request`

Create a leave request.

**Request Body:**
```json
{
  "request": {
    "leaveTypeId": "leave-type-id",
    "startDate": "2026-02-15",
    "endDate": "2026-02-17",
    "reason": "Personal work"
  }
}
```

**GET** `/leave/requests`

Get leave requests.

**Query Parameters:**
- `userId` (string, optional): Defaults to current user
- `status` (string, optional): PENDING, APPROVED, REJECTED
- `startDate` (string, optional)
- `endDate` (string, optional)

**GET** `/leave/balance`

Get leave balance.

**Query Parameters:**
- `userId` (string, optional): Defaults to current user

---

## Student APIs

### Dashboard

**GET** `/statistics/dashboard`

Get student dashboard statistics.

**Response:**
```json
{
  "message": "Dashboard data fetched successfully",
  "data": {
    "attendance": {
      "totalDays": 30,
      "presentDays": 28,
      "attendancePercentage": 93.33
    },
    "pendingHomeworks": 3,
    "upcomingExams": 2,
    "recentResults": [
      {
        "examId": "exam-id",
        "examName": "Mid Term Exam",
        "totalMarks": 500,
        "obtainedMarks": 450,
        "percentage": 90,
        "grade": "A+",
        "rank": 5
      }
    ],
    "timetable": {
      "id": "timetable-id",
      "name": "Class 10A Timetable",
      "slots": [...]
    },
    "feeStatus": {
      "totalAmount": 50000,
      "paidAmount": 30000,
      "pendingAmount": 20000,
      "installments": [...]
    }
  }
}
```

---

### Profile

**GET** `/students/:id`

Get student profile (use own ID).

**Response:**
```json
{
  "message": "Student fetched successfully",
  "data": {
    "id": "student-id",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "studentProfile": {
      "id": "profile-id",
      "rollNumber": 1,
      "apaarId": "APAAR123456",
      "class": {
        "id": "class-id",
        "name": "Class 10A"
      },
      "fatherName": "Father Name",
      "motherName": "Mother Name",
      "fatherContact": "1234567890",
      "motherContact": "0987654321",
      "dateOfBirth": "2010-01-01",
      "gender": "MALE"
    }
  }
}
```

---

### Attendance

**GET** `/attendance`

Get own attendance records.

**Query Parameters:**
- `startDate` (string, optional): ISO date
- `endDate` (string, optional): ISO date
- `status` (string, optional): PRESENT, ABSENT, LATE, HALF_DAY

**Response:**
```json
{
  "message": "Attendance fetched successfully",
  "data": [
    {
      "id": "attendance-id",
      "date": "2026-02-09",
      "status": "PRESENT",
      "class": {
        "id": "class-id",
        "name": "Class 10A"
      },
      "period": {
        "id": "period-id",
        "name": "Period 1"
      },
      "lateArrivalTime": null,
      "absenceReason": null
    }
  ]
}
```

**GET** `/attendance/statistics`

Get own attendance statistics.

**Query Parameters:**
- `startDate` (string, optional)
- `endDate` (string, optional)

---

### Homework

**GET** `/homework`

Get homework assignments for student.

**Query Parameters:**
- `status` (string, optional): PENDING, SUBMITTED, GRADED

**Response:**
```json
{
  "message": "Homework fetched successfully",
  "data": [
    {
      "id": "homework-id",
      "title": "Math Assignment 1",
      "description": "Complete exercises 1-10",
      "subject": {
        "id": "subject-id",
        "name": "Mathematics"
      },
      "dueDate": "2026-02-15T23:59:59Z",
      "createdAt": "2026-02-09T10:00:00Z",
      "submission": {
        "id": "submission-id",
        "status": "PENDING",
        "submittedAt": null,
        "grade": null,
        "feedback": null
      }
    }
  ]
}
```

**POST** `/homework/:id/submit`

Submit homework.

**Request Body:**
```json
{
  "request": {
    "files": ["file-id-1", "file-id-2"],
    "answers": [] // for MCQ homework
  }
}
```

---

### Marks & Results

**GET** `/marks`

Get own marks.

**Query Parameters:**
- `examId` (string, optional)
- `subjectId` (string, optional)

**Response:**
```json
{
  "message": "Marks fetched successfully",
  "data": [
    {
      "id": "mark-id",
      "exam": {
        "id": "exam-id",
        "name": "Mid Term Exam"
      },
      "subject": {
        "id": "subject-id",
        "name": "Mathematics"
      },
      "marksObtained": 85,
      "maxMarks": 100,
      "percentage": 85,
      "grade": "A"
    }
  ]
}
```

**GET** `/marks/results`

Get published results.

**Query Parameters:**
- `examId` (string, optional)

**Response:**
```json
{
  "message": "Results fetched successfully",
  "data": [
    {
      "id": "result-id",
      "exam": {
        "id": "exam-id",
        "name": "Mid Term Exam"
      },
      "totalMarks": 500,
      "obtainedMarks": 450,
      "percentage": 90,
      "grade": "A+",
      "rank": 5,
      "classRank": 5,
      "subjects": [
        {
          "subject": {
            "id": "subject-id",
            "name": "Mathematics"
          },
          "marksObtained": 90,
          "maxMarks": 100,
          "grade": "A+"
        }
      ]
    }
  ]
}
```

---

### Timetable

**GET** `/timetables`

Get class timetable.

**Query Parameters:**
- `classId` (string, optional): Defaults to student's class

**Response:**
```json
{
  "message": "Timetables fetched successfully",
  "data": [
    {
      "id": "timetable-id",
      "name": "Class 10A Timetable",
      "class": {
        "id": "class-id",
        "name": "Class 10A"
      },
      "slots": [
        {
          "dayOfWeek": 1,
          "periodNumber": 1,
          "subject": {
            "id": "subject-id",
            "name": "Mathematics"
          },
          "teacher": {
            "id": "teacher-id",
            "firstName": "Teacher",
            "lastName": "Name"
          },
          "startTime": "09:00",
          "endTime": "09:45",
          "room": "Room 101"
        }
      ]
    }
  ]
}
```

---

### Notes & Syllabus

**GET** `/notes`

Get notes for student's class and subjects.

**Query Parameters:**
- `subjectId` (string, optional)
- `chapter` (string, optional)

**GET** `/syllabus`

Get syllabus for student's class and subjects.

**Query Parameters:**
- `subjectId` (string, optional)
- `academicYear` (string, optional)

---

### Fees

**GET** `/fees`

Get fee records for student.

**Query Parameters:**
- `year` (number, optional)

**Response:**
```json
{
  "message": "Fees fetched successfully",
  "data": [
    {
      "id": "fee-id",
      "installmentNumber": 1,
      "amount": 5000,
      "dueDate": "2026-02-15",
      "status": "PENDING",
      "paidAmount": 0,
      "paymentDate": null
    }
  ]
}
```

**GET** `/fees/status`

Get fee status summary.

**Response:**
```json
{
  "message": "Fee status fetched successfully",
  "data": {
    "totalAmount": 50000,
    "paidAmount": 30000,
    "pendingAmount": 20000,
    "installments": [
      {
        "installmentNumber": 1,
        "amount": 5000,
        "status": "PAID",
        "paymentDate": "2026-01-15"
      },
      {
        "installmentNumber": 2,
        "amount": 5000,
        "status": "PENDING",
        "dueDate": "2026-02-15"
      }
    ]
  }
}
```

---

## Employee (Company) APIs

### Dashboard

**GET** `/statistics/dashboard`

Get employee dashboard statistics.

**Response:**
```json
{
  "message": "Dashboard data fetched successfully",
  "data": {
    "totalSchools": 150,
    "totalEmployees": 500,
    "totalStudents": 50000,
    "totalStaff": 2000,
    "recentSchools": [
      {
        "id": "school-id",
        "name": "School Name",
        "code": "SCH001",
        "createdAt": "2026-02-01T10:00:00Z"
      }
    ],
    "pendingLicenses": 5,
    "activeVendors": 20
  }
}
```

---

### Schools Management

**GET** `/schools`

Get list of schools.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `search` (string, optional)

**Response:**
```json
{
  "message": "Schools fetched successfully",
  "data": [
    {
      "id": "school-id",
      "name": "School Name",
      "code": "SCH001",
      "email": "school@example.com",
      "phone": "1234567890",
      "address": "School Address",
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

**GET** `/schools/:id`

Get school details by ID.

**POST** `/schools`

Create a new school.

**Request Body:**
```json
{
  "request": {
    "name": "School Name",
    "code": "SCH001",
    "email": "school@example.com",
    "phone": "1234567890",
    "address": "School Address"
  }
}
```

**PUT** `/schools/:id`

Update school information.

**DELETE** `/schools/:id`

Delete a school (soft delete).

---

### Employees Management

**GET** `/employees`

Get list of SchooliAt employees.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `search` (string, optional)

**Response:**
```json
{
  "message": "Employees fetched successfully",
  "data": [
    {
      "id": "employee-id",
      "email": "employee@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": {
        "id": "role-id",
        "name": "EMPLOYEE"
      },
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

**GET** `/employees/:id`

Get employee details by ID.

**POST** `/employees`

Create a new employee.

**Request Body:**
```json
{
  "request": {
    "email": "employee@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "roleId": "role-id"
  }
}
```

**PUT** `/employees/:id`

Update employee information.

**DELETE** `/employees/:id`

Delete an employee (soft delete).

---

### Vendors Management

**GET** `/vendors`

Get list of vendors.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `search` (string, optional)
- `employeeId` (string, optional)

**POST** `/vendors`

Create a new vendor.

**Request Body:**
```json
{
  "request": {
    "name": "Vendor Name",
    "contactPerson": "Contact Person",
    "email": "vendor@example.com",
    "phone": "1234567890",
    "address": "Vendor Address",
    "employeeId": "employee-id"
  }
}
```

**GET** `/vendors/:id`

Get vendor details by ID.

**PUT** `/vendors/:id`

Update vendor information.

**DELETE** `/vendors/:id`

Delete a vendor.

---

### Licenses Management

**GET** `/licenses`

Get list of school licenses.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `schoolId` (string, optional)
- `status` (string, optional): ACTIVE, EXPIRED, PENDING

**Response:**
```json
{
  "message": "Licenses fetched successfully",
  "data": [
    {
      "id": "license-id",
      "school": {
        "id": "school-id",
        "name": "School Name"
      },
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "status": "ACTIVE",
      "maxStudents": 1000,
      "maxStaff": 100
    }
  ]
}
```

**POST** `/licenses`

Create a new license.

**Request Body:**
```json
{
  "request": {
    "schoolId": "school-id",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "maxStudents": 1000,
    "maxStaff": 100
  }
}
```

**GET** `/licenses/:id`

Get license details by ID.

**PUT** `/licenses/:id`

Update license information.

---

### Receipts Management

**GET** `/receipts`

Get list of receipts.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)
- `schoolId` (string, optional)
- `startDate` (string, optional)
- `endDate` (string, optional)

**POST** `/receipts`

Create a new receipt.

**Request Body:**
```json
{
  "request": {
    "schoolId": "school-id",
    "amount": 50000,
    "paymentDate": "2026-02-09",
    "paymentMethod": "BANK_TRANSFER",
    "transactionId": "TXN123456",
    "remarks": "License renewal payment"
  }
}
```

---

### Statistics

**GET** `/statistics/schools`

Get statistics for all schools.

**Response:**
```json
{
  "message": "School statistics fetched successfully",
  "data": [
    {
      "id": "school-id",
      "name": "School Name",
      "code": "SCH001",
      "studentCount": 500,
      "teacherCount": 25,
      "staffCount": 10,
      "adminCount": 1
    }
  ]
}
```

---

## Shared APIs

### File Upload

**POST** `/files`

Upload a file.

**Request:** Multipart form data
- `file` (File): The file to upload

**Response:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "id": "file-id",
    "filename": "document.pdf",
    "size": 1024000,
    "mimeType": "application/pdf",
    "url": "https://api.schooliat.com/files/file-id"
  }
}
```

**GET** `/files/:id`

Get file by ID (returns file URL or metadata).

---

### Communication

**POST** `/communication/conversations`

Create a new conversation.

**Request Body:**
```json
{
  "request": {
    "participants": ["user-id-1", "user-id-2"],
    "type": "DIRECT" | "GROUP" | "CLASS" | "SCHOOL",
    "title": "Group Chat" // optional for GROUP
  }
}
```

**GET** `/communication/conversations`

Get user conversations.

**POST** `/communication/conversations/:id/messages`

Send a message in a conversation.

**Request Body:**
```json
{
  "request": {
    "content": "Hello, how are you?",
    "attachments": ["file-id-1"]
  }
}
```

**GET** `/communication/conversations/:id/messages`

Get messages in a conversation.

**Query Parameters:**
- `page` (number, optional)
- `limit` (number, optional)

---

### Notifications

**GET** `/notifications`

Get user notifications.

**Query Parameters:**
- `isRead` (boolean, optional)
- `type` (string, optional)
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
```json
{
  "message": "Notifications fetched successfully",
  "data": [
    {
      "id": "notification-id",
      "title": "New Homework Assigned",
      "content": "You have a new homework assignment",
      "type": "HOMEWORK_ASSIGNED",
      "isRead": false,
      "createdAt": "2026-02-09T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

**PUT** `/notifications/:id/read`

Mark a notification as read.

---

### Announcements

**GET** `/communication/announcements`

Get announcements.

**Query Parameters:**
- `startDate` (string, optional)
- `endDate` (string, optional)

**Response:**
```json
{
  "message": "Announcements fetched successfully",
  "data": [
    {
      "id": "announcement-id",
      "title": "School Holiday",
      "content": "School will be closed on...",
      "targetRoles": ["STUDENT", "PARENT"],
      "createdAt": "2026-02-09T10:00:00Z",
      "attachments": []
    }
  ]
}
```

---

### Circulars

**GET** `/circulars`

Get circulars.

**Query Parameters:**
- `type` (string, optional): ANNOUNCEMENT, NOTICE, CIRCULAR
- `status` (string, optional): DRAFT, PUBLISHED, ARCHIVED
- `startDate` (string, optional)
- `endDate` (string, optional)

---

### Calendar & Events

**GET** `/calendar/events`

Get events.

**Query Parameters:**
- `startDate` (string, optional)
- `endDate` (string, optional)
- `type` (string, optional): HOLIDAY, EXAM, FUNCTION, OTHER

**Response:**
```json
{
  "message": "Events fetched successfully",
  "data": [
    {
      "id": "event-id",
      "title": "Annual Day",
      "description": "School annual day function",
      "startDate": "2026-03-15",
      "endDate": "2026-03-15",
      "type": "FUNCTION",
      "isAllDay": true
    }
  ]
}
```

**GET** `/calendar`

Get calendar view with events and holidays.

---

### Gallery

**GET** `/gallery`

Get galleries.

**Query Parameters:**
- `eventId` (string, optional)
- `privacy` (string, optional): PUBLIC, PRIVATE, SCHOOL_ONLY
- `startDate` (string, optional)
- `endDate` (string, optional)

**Response:**
```json
{
  "message": "Galleries fetched successfully",
  "data": [
    {
      "id": "gallery-id",
      "title": "Annual Day 2026",
      "description": "Photos from annual day function",
      "date": "2026-02-09",
      "images": [
        {
          "id": "image-id",
          "fileId": "file-id",
          "url": "https://api.schooliat.com/files/file-id",
          "caption": "Stage performance"
        }
      ]
    }
  ]
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "status": "error"
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Authentication required or invalid token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Request validation failed
- `OTP_INVALID` (400) - Invalid OTP
- `OTP_EXPIRED` (400) - OTP expired
- `DELETION_OTP_REQUIRED` (400) - Deletion requires OTP verification
- `USER_NOT_FOUND` (404) - User not found (for login, treated as invalid credentials)
- `PASSWORD_MISMATCH` (400) - Current password is incorrect
- `MAX_OTP_ATTEMPTS` (429) - Maximum OTP verification attempts exceeded

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Paginated Response

```json
{
  "message": "Data fetched successfully",
  "data": [
    // Array of items
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### Error Response

```json
{
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "status": "error"
}
```

---

## Rate Limiting

The API implements rate limiting:

- **Authentication endpoints:** 5 requests per 15 minutes per IP
- **General API:** 100 requests per 15 minutes per IP
- **File uploads:** 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests
- `RateLimit-Reset`: Time when limit resets

---

## Token Expiration

JWT tokens expire after **48 hours** (configurable). When a token expires, the client should:

1. Call `/auth/authenticate` again to get a new token
2. Handle 401 responses and redirect to login screen

---

## Best Practices

1. **Always include Authorization header** for authenticated requests
2. **Include x-platform header** (android or ios) for all requests
3. **Handle token expiration** gracefully
4. **Implement retry logic** for network errors
5. **Cache responses** where appropriate (timetable, syllabus, etc.)
6. **Use pagination** for large data sets
7. **Validate data** before sending requests
8. **Handle errors** with user-friendly messages

---

**End of Mobile API Documentation**




