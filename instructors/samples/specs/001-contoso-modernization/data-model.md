# Data Model: Contoso University Modernization

**Date**: 2026-04-21 | **Feature**: 001-contoso-modernization

## Entity Relationship Overview

```
Person (abstract, TPH)
├── Student ──< Enrollment >── Course ──< CourseAssignment >── Instructor
│                                  │                               │
│                                  └── Department ─────────────────┘
│                                       (administrator)
└── Instructor ── OfficeAssignment (1:1)

Notification (standalone)
```

## Entities

### Person (Abstract Base — TPH)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| Id | int | PK, auto-generated | Shared across Student/Instructor |
| LastName | string | Required, max 50 chars | Display name component |
| FirstMidName | string | Required, max 50 chars | Display name component |
| FullName | string | Computed (not mapped) | `LastName + ", " + FirstMidName` |
| Discriminator | string | Auto-managed by EF Core | "Student" or "Instructor" |

**Inheritance**: Table-Per-Hierarchy. Single `Person` table with discriminator column.

---

### Student (extends Person)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| EnrollmentDate | DateTime | Required | ISO 8601 TEXT in SQLite |

**Relationships**:
- Has many `Enrollment` (cascade delete)

**Validation Rules**:
- LastName: required, 1–50 characters
- FirstMidName: required, 1–50 characters
- EnrollmentDate: required, valid date

---

### Instructor (extends Person)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| HireDate | DateTime | Required | ISO 8601 TEXT in SQLite |

**Relationships**:
- Has many `CourseAssignment` (cascade delete)
- Has one optional `OfficeAssignment` (cascade delete)

**Validation Rules**:
- LastName: required, 1–50 characters
- FirstMidName: required, 1–50 characters
- HireDate: required, valid date

---

### Course

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| CourseId | int | PK, user-assigned | Not auto-generated |
| Title | string | Required, 3–50 chars | |
| Credits | int | Required, range 0–5 | |
| DepartmentId | int | FK → Department, required | |
| ImagePath | string? | Nullable | Relative path to uploaded image |

**Relationships**:
- Belongs to one `Department` (required)
- Has many `Enrollment` (cascade delete)
- Has many `CourseAssignment` (cascade delete)

**Validation Rules**:
- CourseId: required, positive integer, unique
- Title: required, 3–50 characters
- Credits: required, integer 0–5
- DepartmentId: required, must reference existing department

---

### Department

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| DepartmentId | int | PK, auto-generated | |
| Name | string | Required, 3–50 chars | |
| Budget | decimal | Required | Stored as TEXT in SQLite |
| StartDate | DateTime | Required | ISO 8601 TEXT in SQLite |
| InstructorId | int? | FK → Instructor, nullable | Department administrator |
| RowVersion | Guid | Concurrency token | Set to new Guid on every write |

**Relationships**:
- Has many `Course` (restrict delete when courses exist)
- Has one optional administrator `Instructor`

**Validation Rules**:
- Name: required, 3–50 characters
- Budget: required, non-negative decimal
- StartDate: required, valid date
- Delete blocked if any courses reference this department

**Concurrency**: `RowVersion` is a `Guid` configured as a concurrency token via `.IsConcurrencyToken()`. EF Core includes it in the `WHERE` clause on updates. On conflict, `DbUpdateConcurrencyException` is caught and a 409 response with field-level diffs is returned. See [research.md](research.md) R-001.

---

### Enrollment

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| EnrollmentId | int | PK, auto-generated | |
| CourseId | int | FK → Course, required | |
| StudentId | int | FK → Student (Person), required | |
| Grade | Grade? | Nullable enum | null = "No grade" |

**Relationships**:
- Belongs to one `Student` (required)
- Belongs to one `Course` (required)

**Validation Rules**:
- Unique constraint on (StudentId, CourseId) — no duplicate enrollments
- Grade: null (no grade) or one of A, B, C, D, F

**State Transitions**:
- Created → Grade = null (enrolled, no grade yet)
- Graded → Grade set to A/B/C/D/F
- Re-graded → Grade changed to different value
- Dropped → Enrollment record deleted

---

### OfficeAssignment

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| InstructorId | int | PK + FK → Instructor | Shared PK (1:1) |
| Location | string | Required, max 50 chars | |

**Relationships**:
- One-to-one with `Instructor` (shares primary key)

**Validation Rules**:
- Location: required when present, max 50 characters

---

### CourseAssignment

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| InstructorId | int | PK (composite), FK → Instructor | |
| CourseId | int | PK (composite), FK → Course | |

**Relationships**:
- Junction entity for Instructor ↔ Course many-to-many
- Composite primary key (InstructorId, CourseId)

---

### Notification

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| NotificationId | int | PK, auto-generated | |
| EntityType | string | Required | "Student", "Course", "Instructor", "Department" |
| EntityId | int | Required | ID of the affected entity |
| Operation | string | Required | "CREATE", "UPDATE", "DELETE" |
| Message | string | Required | Human-readable description |
| CreatedAt | DateTime | Required, auto-set | UTC timestamp |
| CreatedBy | string | Required | "admin" (no auth) |
| IsRead | bool | Required, default false | Read status |
| ReadAt | DateTime? | Nullable | Set when marked as read |

**Validation Rules**:
- EntityType: one of "Student", "Course", "Instructor", "Department"
- Operation: one of "CREATE", "UPDATE", "DELETE"

---

## Grade Enum

```csharp
public enum Grade
{
    A = 0,
    B = 1,
    C = 2,
    D = 3,
    F = 4
}
```

## Seed Data Requirements (FR-009, SC-007)

| Entity | Minimum Count | Notes |
|--------|--------------|-------|
| Student | 8 | Varied enrollment dates |
| Instructor | 5 | With office assignments |
| Department | 4 | Each with an administrator |
| Course | 10 | Distributed across departments |
| Enrollment | ~20 | Mix of graded and ungraded |
| CourseAssignment | ~10 | Multiple courses per instructor |
| OfficeAssignment | 3–5 | Not all instructors need one |
