# API Contract: Contoso University Modernization

**Date**: 2026-04-21 | **Feature**: 001-contoso-modernization  
**Base URL**: `/api`

## Common Patterns

### Paginated Response Envelope

```json
{
  "items": [],
  "pageIndex": 1,
  "totalPages": 5,
  "totalCount": 42,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### Error Response

```json
{
  "title": "Validation Error",
  "status": 400,
  "errors": {
    "fieldName": ["Error message"]
  }
}
```

### Concurrency Conflict Response (409)

```json
{
  "title": "Concurrency Conflict",
  "status": 409,
  "currentValues": {},
  "submittedValues": {}
}
```

---

## Students

### `GET /api/students`

List students with search, sort, and pagination.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| searchString | string? | null | Filter by first/last name contains |
| sortOrder | string? | "LastName" | "LastName", "FirstName", "EnrollmentDate"; suffix "_desc" for descending |
| pageIndex | int? | 1 | Page number (1-based) |
| pageSize | int? | 10 | Items per page |

**Response**: `200` — Paginated `StudentListDto`

```json
{
  "items": [
    { "id": 1, "lastName": "Alexander", "firstMidName": "Carson", "enrollmentDate": "2019-09-01T00:00:00" }
  ],
  "pageIndex": 1, "totalPages": 2, "totalCount": 12,
  "hasPreviousPage": false, "hasNextPage": true
}
```

### `GET /api/students/{id}`

Get student details with enrollments.

**Response**: `200` — `StudentDetailDto`

```json
{
  "id": 1,
  "lastName": "Alexander",
  "firstMidName": "Carson",
  "enrollmentDate": "2019-09-01T00:00:00",
  "enrollments": [
    { "enrollmentId": 1, "courseId": 1050, "courseTitle": "Chemistry", "grade": "A" }
  ]
}
```

**Errors**: `404` — Student not found

### `POST /api/students`

Create a student.

**Body**: `CreateStudentDto`
```json
{ "lastName": "Smith", "firstMidName": "John", "enrollmentDate": "2026-01-15T00:00:00" }
```

**Response**: `201` — Created `StudentDetailDto` + Location header  
**Errors**: `400` — Validation errors

### `PUT /api/students/{id}`

Update a student.

**Body**: `UpdateStudentDto`
```json
{ "lastName": "Smith", "firstMidName": "Jonathan", "enrollmentDate": "2026-01-15T00:00:00" }
```

**Response**: `200` — Updated `StudentDetailDto`  
**Errors**: `400` — Validation, `404` — Not found

### `DELETE /api/students/{id}`

Delete a student and cascade enrollments.

**Response**: `204` — No content  
**Errors**: `404` — Not found

---

## Enrollments

### `POST /api/students/{studentId}/enrollments`

Enroll a student in a course.

**Body**:
```json
{ "courseId": 1050 }
```

**Response**: `201` — Created `EnrollmentDto`  
**Errors**: `400` — Duplicate enrollment, `404` — Student or course not found

### `PUT /api/students/{studentId}/enrollments/{enrollmentId}`

Set or change enrollment grade.

**Body**:
```json
{ "grade": "B" }
```

**Response**: `200` — Updated `EnrollmentDto`  
**Errors**: `400` — Invalid grade, `404` — Not found

### `DELETE /api/students/{studentId}/enrollments/{enrollmentId}`

Drop an enrollment.

**Response**: `204` — No content  
**Errors**: `404` — Not found

---

## Courses

### `GET /api/courses`

List all courses.

**Response**: `200` — Array of `CourseListDto`
```json
[
  { "courseId": 1050, "title": "Chemistry", "credits": 3, "departmentName": "Engineering" }
]
```

### `GET /api/courses/{id}`

Get course details.

**Response**: `200` — `CourseDetailDto`
```json
{
  "courseId": 1050,
  "title": "Chemistry",
  "credits": 3,
  "departmentId": 1,
  "departmentName": "Engineering",
  "imagePath": "/api/courses/1050/image"
}
```

### `POST /api/courses`

Create a course (multipart form for image upload).

**Content-Type**: `multipart/form-data`  
**Fields**: `courseId` (int), `title` (string), `credits` (int), `departmentId` (int), `image` (file, optional)

**Response**: `201` — Created `CourseDetailDto`  
**Errors**: `400` — Validation (title length, credits range, image size/type, duplicate courseId)

### `PUT /api/courses/{id}`

Update a course (multipart form for image upload).

**Content-Type**: `multipart/form-data`  
**Fields**: `title` (string), `credits` (int), `departmentId` (int), `image` (file, optional)

**Response**: `200` — Updated `CourseDetailDto`  
**Errors**: `400` — Validation, `404` — Not found

### `DELETE /api/courses/{id}`

Delete a course and clean up image.

**Response**: `204` — No content  
**Errors**: `404` — Not found

### `GET /api/courses/{id}/image`

Get course teaching material image.

**Response**: `200` — Image file (content-type from stored file)  
**Errors**: `404` — Course or image not found

---

## Instructors

### `GET /api/instructors`

List all instructors with office assignments.

**Response**: `200` — Array of `InstructorListDto`
```json
[
  { "id": 1, "lastName": "Abercrombie", "firstMidName": "Kim", "hireDate": "1995-03-11T00:00:00", "officeLocation": "Smith 17" }
]
```

### `GET /api/instructors/{id}`

Get instructor details with course assignments.

**Response**: `200` — `InstructorDetailDto`
```json
{
  "id": 1,
  "lastName": "Abercrombie",
  "firstMidName": "Kim",
  "hireDate": "1995-03-11T00:00:00",
  "officeLocation": "Smith 17",
  "courses": [
    { "courseId": 1050, "title": "Chemistry" }
  ]
}
```

### `GET /api/instructors/{id}/courses/{courseId}/enrollments`

Get students enrolled in a specific course taught by this instructor.

**Response**: `200` — Array of `EnrollmentDto`
```json
[
  { "enrollmentId": 1, "studentId": 1, "studentName": "Alexander, Carson", "grade": "A" }
]
```

### `POST /api/instructors`

Create an instructor.

**Body**:
```json
{
  "lastName": "Doe",
  "firstMidName": "Jane",
  "hireDate": "2026-01-15T00:00:00",
  "officeLocation": "Room 101",
  "courseIds": [1050, 2021]
}
```

**Response**: `201` — Created `InstructorDetailDto`  
**Errors**: `400` — Validation

### `PUT /api/instructors/{id}`

Update instructor, office, and course assignments.

**Body**:
```json
{
  "lastName": "Doe",
  "firstMidName": "Jane",
  "hireDate": "2026-01-15T00:00:00",
  "officeLocation": "Room 202",
  "courseIds": [1050, 3141]
}
```

**Response**: `200` — Updated `InstructorDetailDto`  
**Errors**: `400` — Validation, `404` — Not found

### `DELETE /api/instructors/{id}`

Delete an instructor (cascades office + course assignments).

**Response**: `204` — No content  
**Errors**: `404` — Not found

---

## Departments

### `GET /api/departments`

List all departments.

**Response**: `200` — Array of `DepartmentListDto`
```json
[
  { "departmentId": 1, "name": "Engineering", "budget": 350000.00, "startDate": "2007-09-01T00:00:00", "administratorName": "Abercrombie, Kim" }
]
```

### `GET /api/departments/{id}`

Get department details with courses.

**Response**: `200` — `DepartmentDetailDto`
```json
{
  "departmentId": 1,
  "name": "Engineering",
  "budget": 350000.00,
  "startDate": "2007-09-01T00:00:00",
  "instructorId": 1,
  "administratorName": "Abercrombie, Kim",
  "rowVersion": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "courses": [
    { "courseId": 1050, "title": "Chemistry" }
  ]
}
```

### `POST /api/departments`

Create a department.

**Body**:
```json
{ "name": "Science", "budget": 200000.00, "startDate": "2026-01-01T00:00:00", "instructorId": 1 }
```

**Response**: `201` — Created `DepartmentDetailDto`  
**Errors**: `400` — Validation

### `PUT /api/departments/{id}`

Update a department (includes concurrency check).

**Body**:
```json
{
  "name": "Sciences",
  "budget": 250000.00,
  "startDate": "2026-01-01T00:00:00",
  "instructorId": 2,
  "rowVersion": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response**: `200` — Updated `DepartmentDetailDto`  
**Errors**: `400` — Validation, `404` — Not found, `409` — Concurrency conflict

### `DELETE /api/departments/{id}`

Delete a department (blocked if courses exist).

**Response**: `204` — No content  
**Errors**: `400` — Has associated courses (error lists courses), `404` — Not found

---

## Statistics

### `GET /api/statistics/enrollments`

Get enrollment counts grouped by enrollment date.

**Response**: `200` — Array of `EnrollmentStatDto`
```json
[
  { "enrollmentDate": "2019-09-01T00:00:00", "studentCount": 5 },
  { "enrollmentDate": "2020-09-01T00:00:00", "studentCount": 3 }
]
```

---

## Notifications

### `GET /api/notifications/stream`

SSE endpoint — stream real-time notifications.

**Response**: `200` — `text/event-stream`
```
data: {"notificationId":1,"entityType":"Student","entityId":1,"operation":"CREATE","message":"Student Carson Alexander created","createdAt":"2026-04-21T10:30:00Z"}

data: {"notificationId":2,"entityType":"Course","entityId":1050,"operation":"UPDATE","message":"Course Chemistry updated","createdAt":"2026-04-21T10:31:00Z"}
```

### `GET /api/notifications`

List notification history.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| unreadOnly | bool? | false | Filter to unread only |

**Response**: `200` — Array of `NotificationDto`
```json
[
  {
    "notificationId": 1,
    "entityType": "Student",
    "entityId": 1,
    "operation": "CREATE",
    "message": "Student Carson Alexander created",
    "createdAt": "2026-04-21T10:30:00Z",
    "createdBy": "admin",
    "isRead": false,
    "readAt": null
  }
]
```

### `PUT /api/notifications/{id}/read`

Mark a notification as read.

**Response**: `200` — Updated `NotificationDto`  
**Errors**: `404` — Not found
