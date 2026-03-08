# Mobile Developer API Reference

This document provides the native backend endpoint mapping for the SchoolIt mobile application.

## 1. Authentication

### Get Roles
- **Endpoint**: `GET /auth/roles`
- **Description**: Returns all roles available for mobile login.
- **Response**:
  ```json
  {
    "data": [
      { "id": "uuid", "name": "TEACHER" },
      { "id": "uuid", "name": "STUDENT" }
    ]
  }
  ```

### Get Current Profile
- **Endpoint**: `GET /auth/me`
- **Requires**: `Authorization: Bearer <TOKEN>`
- **Description**: Returns full profile data including nested `studentProfile` or `teacherProfile`.

---

## 2. Teacher Features

### My Classes (Schedule)
- **Endpoint**: `GET /timetable/my-classes`
- **Description**: Returns grouped slots by day for the teacher.

---

## 3. Student Features

### Academic Summary
- **Endpoint**: `GET /marks/my-summary`
- **Description**: Returns marks and results.

---

## 4. Platform Content

### Static Content
- **Endpoint**: `GET /settings/content/:slug`
- **Slugs**: `terms`, `privacy`, `support`
- **Description**: Returns the value from platform platformConfig.
