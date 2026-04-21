# Feature Specification: Contoso University Modernization

**Feature Branch**: `001-contoso-modernization`
**Created**: 2026-04-21
**Status**: Draft
**Input**: User description: "Modernize the ContosoUniversity application from .NET Framework 4.8.2 to a modern architecture with a .NET 9 Web API backend and a Vite + React + TypeScript frontend styled with TailwindCSS."

## Clarifications

### Session 2026-04-21

- Q: Where should enrollment management (enroll student in course, drop, set grade) live in the modernized app? → A: Manage enrollments from the Student Details page
- Q: What happens when deleting a department that still has courses? → A: Block delete with error listing associated courses
- Q: What navigation pattern should the frontend use? → A: Top navigation bar with horizontal links to entity sections, full-width content below
- Q: What visual pattern should list pages follow? → A: Consistent layout with page title, search/filter bar, data table with sortable column headers, pagination controls at bottom, "Create New" button at top-right
- Q: How should forms and detail views be presented? → A: Dedicated full pages — Create, Edit, Details, and Delete confirmation each get their own route
- Q: Where should toast notifications appear and how long should they persist? → A: Top-right corner, auto-dismiss after 5 seconds, with a close button to dismiss early
- Q: What color palette and visual style should the frontend use? → A: Clean & professional — white/light-gray backgrounds, slate text, blue primary accent, green success, red errors (TailwindCSS defaults)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Student Management (Priority: P1)

A university administrator navigates to the Students section and sees a searchable, sortable, paginated list of all students. They can search by last name or first name, sort by name or enrollment date, and page through results. They can create a new student with a name and enrollment date, view a student's details including their course enrollments and grades, edit a student's information, and delete a student.

**Why this priority**: Students and their enrollments are the core data of the university system. Without student CRUD, no other feature delivers value.

**Independent Test**: Can be fully tested by navigating to the Students page, performing CRUD operations, and verifying search, sort, and pagination all work correctly.

**Acceptance Scenarios**:

1. **Given** the application is running with seed data, **When** the administrator opens the Students list, **Then** the first page displays up to 10 students with their names and enrollment dates, and pagination controls appear if more than 10 students exist.
2. **Given** the Students list is displayed, **When** the administrator types "Alexander" in the search box and submits, **Then** only students whose last name or first name contains "Alexander" are shown.
3. **Given** the Students list is displayed, **When** the administrator clicks the "Last Name" column header, **Then** students are sorted alphabetically by last name; clicking again reverses the order.
4. **Given** the administrator is on the Create Student form, **When** they enter a valid name and enrollment date and submit, **Then** the student is created and appears in the list, and a notification is pushed to connected clients.
5. **Given** a student exists, **When** the administrator views the student's Details page, **Then** the student's name, enrollment date, and all course enrollments with grades are displayed.
6. **Given** a student exists, **When** the administrator edits the student's name and saves, **Then** the updated name is persisted and reflected in the list.
7. **Given** a student exists with enrollments, **When** the administrator deletes the student, **Then** the student and their enrollments are removed and a deletion notification is pushed.
8. **Given** the administrator is viewing a student's Details page, **When** they click "Enroll in Course", select a course from the available courses dropdown, and submit, **Then** an Enrollment record is created linking the student to that course with no grade initially.
9. **Given** a student is enrolled in a course, **When** the administrator sets or changes the grade (A, B, C, D, F) on the Details page and saves, **Then** the enrollment grade is updated.
10. **Given** a student is enrolled in a course, **When** the administrator clicks "Drop" on that enrollment, **Then** the enrollment record is removed and the course no longer appears under the student's enrollments.

---

### User Story 2 — Course Management with File Upload (Priority: P1)

An administrator manages courses — creating, editing, and deleting them. Each course has a title, credit count, and department assignment. Administrators can upload a teaching material image (JPG, PNG, GIF, or BMP up to 5 MB) when creating or editing a course. Old images are replaced when a new one is uploaded and cleaned up when a course is deleted.

**Why this priority**: Courses are the second core entity. The file upload requirement exercises the IStorageService abstraction, a key architectural element.

**Independent Test**: Can be tested by performing full CRUD on courses and verifying image upload, replacement, and cleanup work correctly.

**Acceptance Scenarios**:

1. **Given** the administrator is on the Create Course form, **When** they enter a title (3–50 characters), credits (0–5), select a department, optionally attach a valid image, and submit, **Then** the course is created and the image is stored via the storage abstraction.
2. **Given** a course exists with an uploaded image, **When** the administrator edits the course and uploads a new image, **Then** the old image file is deleted and the new one is stored.
3. **Given** a course exists with an uploaded image, **When** the administrator deletes the course, **Then** the course record and its associated image file are both removed.
4. **Given** the administrator attempts to upload a file exceeding 5 MB, **When** they submit the form, **Then** a validation error is displayed and the upload is rejected.
5. **Given** the administrator attempts to upload a non-image file (e.g., `.exe`), **When** they submit the form, **Then** a validation error is displayed.

---

### User Story 3 — Instructor and Course Assignment Management (Priority: P2)

An administrator manages instructors and their course assignments. The Instructors list displays each instructor with their office assignment. Selecting an instructor shows their assigned courses; selecting a course shows the enrolled students. When creating or editing an instructor, the administrator can assign or remove courses via checkboxes and set or clear an office location.

**Why this priority**: Instructors tie together courses and office assignments, exercising the many-to-many and one-to-one relationships. This is essential for data model completeness but depends on Courses existing first.

**Independent Test**: Can be tested by navigating to the Instructors page, performing CRUD, assigning/removing courses, and verifying the multi-level drill-down works.

**Acceptance Scenarios**:

1. **Given** the application has seed data, **When** the administrator opens the Instructors list, **Then** all instructors are displayed with their hire dates and office locations.
2. **Given** the Instructors list is displayed, **When** the administrator clicks an instructor, **Then** the courses assigned to that instructor are shown below.
3. **Given** an instructor's courses are displayed, **When** the administrator clicks a course, **Then** students enrolled in that course with their grades are shown.
4. **Given** the administrator is editing an instructor, **When** they check a new course and uncheck an existing one and save, **Then** the course assignments are updated accordingly.
5. **Given** the administrator is editing an instructor, **When** they enter or clear an office location and save, **Then** the office assignment is created, updated, or removed.

---

### User Story 4 — Department Management with Concurrency Handling (Priority: P2)

An administrator manages departments. Each department has a name, budget, start date, and an optional administrator (instructor). Departments use optimistic concurrency control — if two administrators edit the same department simultaneously, the second one is shown a conflict resolution screen detailing which fields differ and must choose to retry or abandon their changes.

**Why this priority**: The concurrency pattern is a distinct architectural concern. Departments depend on Instructors for the administrator relationship but are otherwise straightforward CRUD.

**Independent Test**: Can be tested by creating/editing/deleting departments and simulating a concurrent edit to trigger conflict detection.

**Acceptance Scenarios**:

1. **Given** the administrator is on the Create Department form, **When** they enter a name (3–50 characters), budget, start date, and optionally select an administrator, **Then** the department is created.
2. **Given** two administrators load the same department's Edit form, **When** the first saves successfully and the second then submits, **Then** the second administrator sees a concurrency conflict page showing the current database values versus their submitted values for each changed field.
3. **Given** a concurrency conflict is displayed, **When** the administrator clicks "Save" again with the refreshed data, **Then** their edit succeeds with the updated concurrency token.
4. **Given** a department has associated courses, **When** the administrator views department details, **Then** the associated courses are listed.
5. **Given** a department has associated courses, **When** the administrator attempts to delete it, **Then** the delete is blocked and an error message lists the courses that must be reassigned first.
6. **Given** a department has no associated courses, **When** the administrator deletes it, **Then** the department is removed and a deletion notification is pushed.

---

### User Story 5 — Enrollment Statistics Dashboard (Priority: P3)

An administrator navigates to the About/Statistics page and sees a summary showing enrollment counts grouped by enrollment date. This provides a quick overview of student enrollment trends.

**Why this priority**: Valuable analytics feature, but purely read-only and has no dependencies on other stories being interactive. Lowest risk.

**Independent Test**: Can be tested by navigating to the About page and verifying enrollment date groups and counts match the database.

**Acceptance Scenarios**:

1. **Given** the database contains students with various enrollment dates, **When** the administrator navigates to the Statistics page, **Then** a table displays each distinct enrollment date alongside the number of students enrolled on that date.
2. **Given** no students exist in the database, **When** the administrator navigates to the Statistics page, **Then** a message indicates no enrollment data is available.

---

### User Story 6 — Real-Time Notifications via SSE (Priority: P3)

When any administrator creates, updates, or deletes an entity (Student, Course, Instructor, Department), a notification is broadcast in real time to all connected browser sessions via Server-Sent Events. The frontend displays these as toast-style messages. An administrator can also view a notification history page and mark notifications as read.

**Why this priority**: Replaces the legacy MSMQ+polling system. Depends on entity CRUD being functional first but is independently testable once the backend SSE endpoint exists.

**Independent Test**: Can be tested by opening two browser tabs, performing a CRUD operation in one tab, and confirming the notification appears in the other tab without a page refresh.

**Acceptance Scenarios**:

1. **Given** the frontend has an active EventSource connection, **When** a student is created in another session, **Then** a toast notification appears in the top-right corner within 2 seconds showing the entity type, name, and operation, auto-dismisses after 5 seconds, and includes a close button for early dismissal.
2. **Given** multiple CRUD operations occur in quick succession, **When** notifications arrive, **Then** they are displayed in chronological order and do not block the UI.
3. **Given** the administrator navigates to the Notifications page, **When** unread notifications exist, **Then** they are listed with entity type, operation, message, and timestamp.
4. **Given** unread notifications are listed, **When** the administrator marks one as read, **Then** it is visually distinguished and the unread count updates.

---

### Edge Cases

- What happens when the database file does not yet exist on first run? The application seeds automatically.
- What happens when an SSE connection is dropped (e.g., network interruption)? The frontend reconnects automatically using built-in EventSource retry behavior.
- What happens when a user submits a form with invalid data? Validation errors are displayed inline on the form without losing entered data.
- What happens when a file upload is attempted with an empty file? A validation error is displayed.
- What happens when deleting a department that still has courses? The delete is blocked and an error message lists the associated courses that must be reassigned to another department first.
- What happens when two users delete the same student simultaneously? The second request returns a not-found response and the UI reflects the entity is gone.
- What happens when an administrator tries to enroll a student in a course they are already enrolled in? A validation error is displayed preventing duplicate enrollments.
- What happens when an administrator drops the last enrollment for a student? The student remains with an empty enrollments list — no special handling required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide full CRUD operations for Students, Courses, Instructors, and Departments, preserving the same validation rules as the legacy application.
- **FR-002**: The Students list MUST support search by last name or first name, sorting by name and enrollment date (ascending and descending), and pagination with 10 items per page.
- **FR-003**: The Instructors list MUST support a multi-level drill-down: selecting an instructor shows their courses; selecting a course shows enrolled students with grades.
- **FR-004**: Instructor create/edit forms MUST allow assigning and removing courses via a checkbox interface, and setting or clearing an office location.
- **FR-005**: Department edit MUST implement optimistic concurrency control — when a conflict is detected, the user is shown field-level differences between their values and the current database values and can retry.
- **FR-006**: The About/Statistics page MUST display enrollment counts grouped by enrollment date.
- **FR-007**: Course create/edit MUST allow uploading a teaching material image (JPG, JPEG, PNG, GIF, BMP; max 5 MB). Old images MUST be replaced on re-upload and cleaned up on course deletion.
- **FR-008**: File uploads MUST be handled through an `IStorageService` abstraction so the storage backend is swappable without modifying controllers.
- **FR-009**: The database MUST be seeded with representative data (students, instructors, courses, departments, enrollments, office assignments, course assignments) on first run when the database is empty.
- **FR-010**: Entity change notifications (create, update, delete) MUST be delivered to all connected browser sessions in real time via Server-Sent Events.
- **FR-011**: The backend MUST use an internal notification queue (in-process channel) and a background worker to process and broadcast notifications — replacing the legacy MSMQ dependency.
- **FR-012**: A Notifications page MUST display notification history with the ability to mark individual notifications as read.
- **FR-013**: All controller actions and data access operations MUST be asynchronous.
- **FR-014**: All services MUST be registered and resolved via the built-in dependency injection container.
- **FR-015**: The application MUST use `appsettings.json` for configuration (no `Web.config`).
- **FR-016**: The Student Details page MUST allow administrators to enroll a student in a course, drop an enrollment, and set or change the enrollment grade. Duplicate enrollments (same student + same course) MUST be rejected with a validation error.
- **FR-017**: The frontend MUST use a top navigation bar with links to each entity section (Students, Courses, Instructors, Departments) plus Statistics and Notifications. The content area below MUST use the full page width. The application name/logo MUST appear at the left of the nav bar.
- **FR-018**: All entity list pages MUST follow a consistent layout: page title at the top, a "Create New" action button at the top-right, an optional search/filter bar below, a data table with sortable column headers, and pagination controls at the bottom. This pattern MUST be implemented as a reusable component.
- **FR-019**: Create, Edit, Details, and Delete confirmation views MUST each be a dedicated full page with its own route (e.g., `/students/create`, `/students/:id`, `/students/:id/edit`, `/students/:id/delete`). No modal dialogs or inline editing.
- **FR-020**: The frontend MUST use a clean, professional visual style: white/light-gray (`gray-50`) page backgrounds, `slate` text colors, `blue` primary accent for interactive elements (buttons, links, active nav items), `green` for success states, `red` for errors/destructive actions. No custom theme — use TailwindCSS default color scales.

### Key Entities

- **Person** (abstract base): Last name (max 50 chars, required), first name (max 50 chars, required), computed full name. Base type for Student and Instructor using table-per-hierarchy inheritance with a discriminator column.
- **Student** (extends Person): Enrollment date (required). Has many Enrollments.
- **Instructor** (extends Person): Hire date (required). Has many CourseAssignments (many-to-many with Course). Has one optional OfficeAssignment.
- **Course**: Course ID (user-assigned integer), title (3–50 chars, required), credits (0–5, required), department (required), optional teaching material image path. Has many Enrollments, many CourseAssignments.
- **Department**: Name (3–50 chars, required), budget (currency, required), start date (required), optional administrator (Instructor). Has many Courses. Uses a row version token for optimistic concurrency.
- **Enrollment**: Links a Student to a Course with an optional Grade (A, B, C, D, F). Displayed as "No grade" when null.
- **OfficeAssignment**: Location (max 50 chars). Shares primary key with Instructor (one-to-one).
- **CourseAssignment**: Composite key of Course ID and Instructor ID. Junction entity for the Instructor–Course many-to-many relationship.
- **Notification**: Entity type, entity ID, operation (CREATE/UPDATE/DELETE), message, created-at timestamp, created-by user, read status, read-at timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All CRUD operations from the legacy application are functional in the modernized application — an administrator can create, read, update, and delete every entity type.
- **SC-002**: The Students list search returns matching results within 1 second, sorting reorders the list instantly, and pagination navigates between pages without full page reloads.
- **SC-003**: Notifications from entity changes appear in other connected browser sessions within 2 seconds of the triggering action.
- **SC-004**: The complete application starts and functions correctly on a clean machine with only .NET 9 SDK and Node.js installed — no manual database setup, no external services.
- **SC-005**: A file upload of a 5 MB image completes in under 5 seconds; invalid files are rejected with a clear error before any upload occurs.
- **SC-006**: When two users edit the same department simultaneously, the second user sees accurate field-level conflict details and can resolve the conflict without data loss.
- **SC-007**: The database is automatically seeded with at least 8 students, 5 instructors, 4 departments, 10 courses, and associated enrollments/assignments on first run.
- **SC-008**: Both the backend and frontend build with zero errors and zero warnings (`dotnet build` and `npm run build`).

## Assumptions

- The modernized application does not require user authentication or role-based access control — all users are treated as administrators, matching the legacy application's behavior.
- The TPH (table-per-hierarchy) inheritance pattern for Person → Student / Instructor will be preserved in the new data model using EF Core 9 on SQLite.
- SQLite's lack of native `money` and `datetime2` types is acceptable — `decimal` and `TEXT` (ISO 8601) column types will be used as equivalents.
- The Vite dev server will proxy API requests to the .NET backend during development, eliminating the need for CORS configuration in development mode.
- Teaching material images are stored in a local directory on the server's file system (not in the database). The `IStorageService` abstraction makes this swappable.
- The legacy `PaginatedList<T>` helper pattern will be replicated on the backend, returning paginated results as a JSON envelope with page metadata.
- Browser support for SSE via `EventSource` is assumed (all modern browsers). No polyfill is required.
- The Course ID remains a user-assigned integer (not auto-generated), matching the legacy behavior.
- The frontend layout is desktop-focused. Responsive/mobile design is not a requirement for the initial modernization but the TailwindCSS utility approach makes it straightforward to add later.
