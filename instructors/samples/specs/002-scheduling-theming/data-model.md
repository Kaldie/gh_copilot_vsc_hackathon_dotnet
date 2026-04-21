# Data Model: Course Scheduling & Theming

**Feature**: 002-scheduling-theming  
**Date**: 2026-04-21

## New Entity: ScheduledInstance

Represents a single time-slot occurrence of a course on the weekly calendar.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `ScheduledInstanceId` | int | PK, auto-increment | |
| `CourseId` | int | FK → Course.CourseId, required | |
| `DayOfWeek` | DayOfWeek (enum) | required, 0=Sunday..6=Saturday | .NET System.DayOfWeek |
| `StartTime` | TimeOnly | required | Stored as TEXT in SQLite (ISO 8601) |
| `DurationMinutes` | int | required, default 60 | |

**Relationships**:
- ScheduledInstance M:1 → Course (a course has many scheduled instances)

**Constraints**:
- Unique index on `(CourseId, DayOfWeek, StartTime)` — prevents duplicate entries for the same course at the same time
- `DayOfWeek` values 1–5 (Monday–Friday) are valid for scheduling; 0 (Sunday) and 6 (Saturday) are rejected by business logic

## Modified Entity: Department

Add optional color attribute for calendar color coding.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `Color` | string? | nullable, max 7 chars | Hex color code (e.g., `#1e40af`). When null, auto-assigned from palette. |

**Behavior**:
- When `Color` is null → frontend auto-assigns from the built-in 8-color palette using `departmentId % 8`
- When `Color` is set → frontend uses the explicit color value
- Color picker on department edit page allows setting/clearing the value

## Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Department  │ 1:M │     Course       │ 1:M │ ScheduledInstance│
│─────────────│────▶│──────────────────│────▶│─────────────────│
│ DepartmentId│     │ CourseId         │     │ ScheduledInst.Id│
│ Name        │     │ Title            │     │ CourseId (FK)   │
│ Budget      │     │ Credits          │     │ DayOfWeek       │
│ StartDate   │     │ DepartmentId(FK) │     │ StartTime       │
│ InstructorId│     │ ImagePath        │     │ DurationMinutes │
│ RowVersion  │     │                  │     └─────────────────┘
│ Color (NEW) │     │                  │
└─────────────┘     │                  │
                    │                  │ 1:M  ┌─────────────┐
                    │                  │─────▶│  Enrollment  │
                    │                  │      │─────────────│
                    │                  │      │ EnrollmentId│
                    └──────────────────┘      │ CourseId(FK)│
                           │                  │ StudentId(FK)│
                           │ M:M              │ Grade        │
                           ▼                  └─────────────┘
                    ┌──────────────────┐
                    │ CourseAssignment  │
                    │──────────────────│
                    │ InstructorId(FK) │
                    │ CourseId(FK)     │
                    └──────────────────┘
```

## Schedule Filtering Logic

### Student Schedule
A student's schedule = all ScheduledInstances where `ScheduledInstance.CourseId` is in the set of courses the student is enrolled in.

```
StudentSchedule(studentId) =
  ScheduledInstance
    WHERE CourseId IN (
      SELECT CourseId FROM Enrollment WHERE StudentId = studentId
    )
```

### Instructor Schedule
An instructor's schedule = all ScheduledInstances where `ScheduledInstance.CourseId` is in the set of courses the instructor is assigned to.

```
InstructorSchedule(instructorId) =
  ScheduledInstance
    WHERE CourseId IN (
      SELECT CourseId FROM CourseAssignment WHERE InstructorId = instructorId
    )
```

### Conflict Detection
An instructor conflict occurs when two distinct courses assigned to the same instructor overlap in time on the same day.

```
Conflicts(instructorId) =
  For each pair (A, B) of ScheduledInstances in InstructorSchedule(instructorId):
    WHERE A.DayOfWeek = B.DayOfWeek
      AND A.CourseId ≠ B.CourseId
      AND time_overlaps(A.StartTime, A.Duration, B.StartTime, B.Duration)
```

## Theme State Model (Frontend Only)

| Property | Type | Storage | Notes |
|----------|------|---------|-------|
| `theme` | `'light' \| 'dark' \| 'system'` | `localStorage.theme` | `'system'` = remove key, use OS |
| `resolvedTheme` | `'light' \| 'dark'` | computed | Actual applied theme after OS detection |

**State transitions**:
- On mount: read `localStorage.theme`. If absent, check `window.matchMedia('(prefers-color-scheme: dark)')`.
- On toggle: cycle light → dark → system → light (or direct toggle light ↔ dark).
- Apply: add/remove `.dark` class on `document.documentElement`.
