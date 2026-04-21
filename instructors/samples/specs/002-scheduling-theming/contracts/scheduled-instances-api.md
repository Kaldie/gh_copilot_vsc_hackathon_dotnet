# API Contracts: Scheduled Instances

**Feature**: 002-scheduling-theming  
**Base Path**: `/api/scheduledinstances`

## Endpoints

### GET /api/scheduledinstances

Returns all scheduled instances. Supports optional filtering by student or instructor.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | int | No | Filter to courses the student is enrolled in |
| `instructorId` | int | No | Filter to courses the instructor is assigned to |

Only one of `studentId` or `instructorId` may be provided. If neither is provided, returns all scheduled instances.

**Response**: `200 OK`

```json
[
  {
    "scheduledInstanceId": 1,
    "courseId": 1050,
    "courseTitle": "Chemistry",
    "departmentId": 3,
    "departmentName": "Engineering",
    "departmentColor": "#065f46",
    "dayOfWeek": 1,
    "startTime": "09:00:00",
    "durationMinutes": 60
  }
]
```

**Notes**: Response includes denormalized course and department info to avoid N+1 queries on the frontend.

---

### GET /api/scheduledinstances/{id}

Returns a single scheduled instance by ID.

**Response**: `200 OK` (same shape as array item above) or `404 Not Found`

---

### POST /api/scheduledinstances

Creates a new scheduled instance (course dropped on calendar).

**Request Body**:

```json
{
  "courseId": 1050,
  "dayOfWeek": 1,
  "startTime": "09:00:00",
  "durationMinutes": 60
}
```

**Validation**:
- `courseId` must reference an existing course
- `dayOfWeek` must be 1–5 (Monday–Friday)
- `startTime` must be between 07:00 and 20:00 (allowing 1-hour duration to end by 21:00)
- `durationMinutes` must be > 0 (default 60)
- Duplicate `(courseId, dayOfWeek, startTime)` returns `409 Conflict`

**Response**: `201 Created` with the created instance (full shape including denormalized fields)

---

### PUT /api/scheduledinstances/{id}

Updates a scheduled instance (course moved on calendar).

**Request Body**:

```json
{
  "dayOfWeek": 3,
  "startTime": "10:30:00",
  "durationMinutes": 60
}
```

**Validation**: Same as POST (excluding courseId which cannot be changed).

**Response**: `200 OK` with updated instance or `404 Not Found`

---

### DELETE /api/scheduledinstances/{id}

Deletes a scheduled instance.

**Response**: `204 No Content` or `404 Not Found`

---

## Conflict Detection Endpoint

### GET /api/scheduledinstances/conflicts?instructorId={id}

Returns pairs of scheduled instances that overlap for the given instructor.

**Response**: `200 OK`

```json
[
  {
    "dayOfWeek": 1,
    "instanceA": {
      "scheduledInstanceId": 1,
      "courseId": 1050,
      "courseTitle": "Chemistry",
      "startTime": "09:00:00",
      "durationMinutes": 60
    },
    "instanceB": {
      "scheduledInstanceId": 5,
      "courseId": 4041,
      "courseTitle": "Macroeconomics",
      "startTime": "09:00:00",
      "durationMinutes": 60
    }
  }
]
```
