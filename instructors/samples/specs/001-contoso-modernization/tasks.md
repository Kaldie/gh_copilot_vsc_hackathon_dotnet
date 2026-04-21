# Tasks: Contoso University Modernization

**Input**: Design documents from `/specs/001-contoso-modernization/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-endpoints.md, research.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both projects, install dependencies, configure tooling

- [x] T001 Create .NET 9 Web API project in `src/ContosoUniversity.Api/ContosoUniversity.Api.csproj` with SDK-style project file, nullable reference types enabled, and EF Core 9 SQLite + Design packages
- [x] T002 Create `src/ContosoUniversity.Api/appsettings.json` with SQLite connection string (`Data Source=contosouniversity.db`), upload path (`Uploads/`), and Kestrel URL bindings (http://localhost:5000, https://localhost:5001)
- [x] T003 Scaffold Vite + React + TypeScript project in `src/ContosoUniversity.Web/` using `npm create vite@latest` with React-TS template, then install TailwindCSS 3+, PostCSS, Autoprefixer, and React Router DOM
- [x] T004 [P] Configure `src/ContosoUniversity.Web/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, path aliases (`@/` → `src/`)
- [x] T005 [P] Configure `src/ContosoUniversity.Web/tailwind.config.js` and `src/ContosoUniversity.Web/postcss.config.js` with content paths pointing to `src/**/*.{ts,tsx}`
- [x] T006 [P] Configure `src/ContosoUniversity.Web/vite.config.ts` with API proxy forwarding `/api` to `https://localhost:5001` per research.md R-003

**Checkpoint**: Both projects build successfully (`dotnet build` and `npm run build`). No application logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain entities, database context, seed data, shared DTOs, reusable frontend components — everything that blocks ALL user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Domain Layer

- [X] T007 Create Grade enum in `src/ContosoUniversity.Api/Domain/Enums/Grade.cs` with values A=0, B=1, C=2, D=3, F=4
- [X] T008 Create abstract Person entity in `src/ContosoUniversity.Api/Domain/Entities/Person.cs` with Id, LastName (max 50), FirstMidName (max 50), computed FullName
- [X] T009 [P] Create Student entity in `src/ContosoUniversity.Api/Domain/Entities/Student.cs` extending Person with EnrollmentDate and Enrollments navigation
- [X] T010 [P] Create Instructor entity in `src/ContosoUniversity.Api/Domain/Entities/Instructor.cs` extending Person with HireDate, CourseAssignments, and OfficeAssignment navigations
- [X] T011 [P] Create Course entity in `src/ContosoUniversity.Api/Domain/Entities/Course.cs` with CourseId (user-assigned PK), Title (3–50), Credits (0–5), DepartmentId FK, ImagePath nullable, Enrollments and CourseAssignments navigations
- [X] T012 [P] Create Department entity in `src/ContosoUniversity.Api/Domain/Entities/Department.cs` with DepartmentId, Name (3–50), Budget (decimal), StartDate, InstructorId nullable FK, RowVersion (Guid concurrency token), Courses navigation
- [X] T013 [P] Create Enrollment entity in `src/ContosoUniversity.Api/Domain/Entities/Enrollment.cs` with EnrollmentId, CourseId FK, StudentId FK, Grade nullable enum
- [X] T014 [P] Create OfficeAssignment entity in `src/ContosoUniversity.Api/Domain/Entities/OfficeAssignment.cs` with InstructorId (shared PK), Location (max 50)
- [X] T015 [P] Create CourseAssignment entity in `src/ContosoUniversity.Api/Domain/Entities/CourseAssignment.cs` with composite PK (InstructorId, CourseId)
- [X] T016 [P] Create Notification entity in `src/ContosoUniversity.Api/Domain/Entities/Notification.cs` with NotificationId, EntityType, EntityId, Operation, Message, CreatedAt, CreatedBy, IsRead, ReadAt nullable

### Backend Application Layer

- [X] T017 [P] Create IStorageService interface in `src/ContosoUniversity.Api/Application/Interfaces/IStorageService.cs` with SaveAsync, DeleteAsync, GetStreamAsync methods
- [X] T018 [P] Create INotificationService interface in `src/ContosoUniversity.Api/Application/Interfaces/INotificationService.cs` with NotifyAsync method (entityType, entityId, operation, message)
- [X] T019 Create all DTOs in `src/ContosoUniversity.Api/Application/DTOs/`: StudentDto.cs (StudentListDto, StudentDetailDto, CreateStudentDto, UpdateStudentDto), CourseDto.cs (CourseListDto, CourseDetailDto), InstructorDto.cs (InstructorListDto, InstructorDetailDto, CreateInstructorDto, UpdateInstructorDto), DepartmentDto.cs (DepartmentListDto, DepartmentDetailDto, CreateDepartmentDto, UpdateDepartmentDto), EnrollmentDto.cs (EnrollmentDto, CreateEnrollmentDto, UpdateEnrollmentGradeDto), NotificationDto.cs, EnrollmentStatDto.cs
- [X] T020 Create PaginatedList<T> helper in `src/ContosoUniversity.Api/Application/DTOs/PaginatedList.cs` with static CreateAsync method accepting IQueryable, pageIndex, pageSize; returns items + page metadata envelope

### Backend Infrastructure Layer

- [X] T021 Create SchoolContext in `src/ContosoUniversity.Api/Infrastructure/Data/SchoolContext.cs` with DbSets for Students, Instructors, Courses, Departments, Enrollments, OfficeAssignments, CourseAssignments, Notifications; configure TPH inheritance, composite keys, concurrency token, unique constraint on Enrollment(StudentId,CourseId), and restrict-delete on Department→Course
- [X] T022 Create DbInitializer in `src/ContosoUniversity.Api/Infrastructure/Data/DbInitializer.cs` with async seed method: 8+ students, 5+ instructors, 4+ departments, 10+ courses, 20+ enrollments, course assignments, and office assignments per SC-007
- [X] T023 [P] Implement LocalStorageService in `src/ContosoUniversity.Api/Infrastructure/Services/LocalStorageService.cs` implementing IStorageService — saves files with GUID filenames to Uploads/ directory, validates extension whitelist (jpg, jpeg, png, gif, bmp) and content-type, enforces 5 MB max size per research.md R-005

### Backend Program.cs

- [X] T024 Configure `src/ContosoUniversity.Api/Program.cs` with: EF Core SQLite registration, DI for IStorageService→LocalStorageService, DI for INotificationService (placeholder), controller mapping, JSON serialization options (camelCase, enum as string), CORS (allow all origins for dev), EnsureCreated + seed call on startup, static files for Uploads/

### Frontend Shared Components

- [X] T025 Create TypeScript types in `src/ContosoUniversity.Web/src/types/index.ts` matching all API DTOs from contracts/api-endpoints.md: PaginatedResult<T>, StudentListDto, StudentDetailDto, CourseListDto, CourseDetailDto, InstructorListDto, InstructorDetailDto, DepartmentListDto, DepartmentDetailDto, EnrollmentDto, NotificationDto, EnrollmentStatDto, Grade enum, ApiError
- [X] T026 Create typed API client in `src/ContosoUniversity.Web/src/services/api.ts` with generic fetch wrapper handling JSON responses, error parsing (400/404/409), and multipart form data for file uploads
- [X] T027 Create Layout component in `src/ContosoUniversity.Web/src/components/Layout.tsx` with top navigation bar (FR-017): app name "Contoso University" at left, horizontal links to Students, Courses, Instructors, Departments, Statistics, Notifications; full-width content area below; blue-600 active nav item; gray-50 page background per FR-020
- [X] T028 [P] Create NavBar component in `src/ContosoUniversity.Web/src/components/NavBar.tsx` with horizontal link items, active route highlighting using React Router's useLocation
- [X] T029 [P] Create reusable DataTable component in `src/ContosoUniversity.Web/src/components/DataTable.tsx` with sortable column headers (click to toggle asc/desc), generic typed rows, and slot for empty state message per FR-018
- [X] T030 [P] Create Pagination component in `src/ContosoUniversity.Web/src/components/Pagination.tsx` accepting pageIndex, totalPages, hasPreviousPage, hasNextPage props with Previous/Next/page number controls per FR-018
- [X] T031 [P] Create SearchBar component in `src/ContosoUniversity.Web/src/components/SearchBar.tsx` with text input, search button, and clear functionality per FR-018
- [X] T032 [P] Create FormField component in `src/ContosoUniversity.Web/src/components/FormField.tsx` with label, input (text/number/date/select), inline validation error display, consistent styling
- [X] T033 Configure React Router in `src/ContosoUniversity.Web/src/App.tsx` with all routes: `/students/*`, `/courses/*`, `/instructors/*`, `/departments/*`, `/statistics`, `/notifications`, default redirect to `/students`; wrap in Layout component

**Checkpoint**: Both projects build. Database seeds on startup. Frontend shows nav bar with placeholder pages. All reusable components ready.

---

## Phase 3: User Story 1 — Student Management (Priority: P1) 🎯 MVP

**Goal**: Full CRUD for students with search, sort, pagination, plus enrollment management on the Details page

**Independent Test**: Navigate to Students page → CRUD operations → search/sort/pagination → enroll/grade/drop from Details page

### Backend — Students API

- [X] T034 Implement StudentsController in `src/ContosoUniversity.Api/Controllers/StudentsController.cs` with: GET list (search by name, sort by LastName/FirstName/EnrollmentDate with _desc suffix, paginate with PaginatedList<T>), GET by id (include enrollments with course titles), POST create, PUT update, DELETE (cascade enrollments); all async with CancellationToken; push notification on create/update/delete
- [X] T035 Implement EnrollmentsController in `src/ContosoUniversity.Api/Controllers/EnrollmentsController.cs` with: POST `/api/students/{studentId}/enrollments` (check duplicate enrollment, validate student+course exist), PUT grade update, DELETE drop; all async with CancellationToken

### Frontend — Students Pages

- [X] T036 Create Students list page in `src/ContosoUniversity.Web/src/pages/students/StudentList.tsx` using DataTable, SearchBar, Pagination components; "Create New" button at top-right; columns: Last Name (sortable), First Name (sortable), Enrollment Date (sortable); links to Details/Edit/Delete per row
- [X] T037 [P] Create Student create page in `src/ContosoUniversity.Web/src/pages/students/StudentCreate.tsx` with form fields for LastName, FirstMidName, EnrollmentDate; validation errors displayed inline; redirect to list on success
- [X] T038 [P] Create Student details page in `src/ContosoUniversity.Web/src/pages/students/StudentDetails.tsx` showing name, enrollment date, enrollments table (course title, grade or "No grade"), "Enroll in Course" button, grade dropdown per enrollment, "Drop" button per enrollment; Edit/Delete/Back to List links
- [X] T039 [P] Create Student edit page in `src/ContosoUniversity.Web/src/pages/students/StudentEdit.tsx` with pre-populated form, same validation as create, redirect to details on success
- [X] T040 [P] Create Student delete confirmation page in `src/ContosoUniversity.Web/src/pages/students/StudentDelete.tsx` showing student details and "Confirm Delete" button; redirect to list on success
- [X] T041 Wire student routes in `src/ContosoUniversity.Web/src/App.tsx`: `/students` (list), `/students/create`, `/students/:id` (details), `/students/:id/edit`, `/students/:id/delete`

**Checkpoint**: Student CRUD fully functional. Search, sort, pagination work. Enrollment management (enroll, grade, drop) works from Details page. SC-001 partially met, SC-002 testable.

---

## Phase 4: User Story 2 — Course Management with File Upload (Priority: P1)

**Goal**: Full CRUD for courses with image upload, replacement, and cleanup via IStorageService

**Independent Test**: Create course with image → edit and replace image → delete course → verify image file cleaned up

### Backend — Courses API

- [X] T042 Implement CoursesController in `src/ContosoUniversity.Api/Controllers/CoursesController.cs` with: GET list (include department name), GET by id, POST create (multipart/form-data with optional image, validate courseId uniqueness/title length/credits range/image type+size), PUT update (replace old image if new uploaded), DELETE (clean up image via IStorageService), GET image endpoint; all async with CancellationToken; push notification on create/update/delete

### Frontend — Courses Pages

- [X] T043 Create Courses list page in `src/ContosoUniversity.Web/src/pages/courses/CourseList.tsx` using DataTable; columns: Course ID, Title, Credits, Department; "Create New" button; links to Details/Edit/Delete per row
- [X] T044 [P] Create Course create page in `src/ContosoUniversity.Web/src/pages/courses/CourseCreate.tsx` with form fields: CourseId (number), Title, Credits (0–5), Department dropdown (fetched from /api/departments), image file input with client-side validation (type + 5 MB); multipart form submission
- [X] T045 [P] Create Course details page in `src/ContosoUniversity.Web/src/pages/courses/CourseDetails.tsx` showing all fields + image preview (if exists) via `/api/courses/{id}/image`
- [X] T046 [P] Create Course edit page in `src/ContosoUniversity.Web/src/pages/courses/CourseEdit.tsx` with pre-populated form, current image preview, new image upload replaces old; multipart form submission
- [X] T047 [P] Create Course delete confirmation page in `src/ContosoUniversity.Web/src/pages/courses/CourseDelete.tsx` showing course details and "Confirm Delete" button
- [X] T048 Wire course routes in `src/ContosoUniversity.Web/src/App.tsx`: `/courses`, `/courses/create`, `/courses/:id`, `/courses/:id/edit`, `/courses/:id/delete`

**Checkpoint**: Course CRUD with image upload fully functional. SC-005 testable. IStorageService abstraction exercised.

---

## Phase 5: User Story 3 — Instructor & Course Assignment Management (Priority: P2)

**Goal**: CRUD for instructors with office assignment management and course assignment checkboxes; multi-level drill-down on list page

**Independent Test**: Navigate to Instructors → click instructor → see courses → click course → see enrolled students with grades; create/edit instructor with course checkboxes and office location

### Backend — Instructors API

- [X] T049 Implement InstructorsController in `src/ContosoUniversity.Api/Controllers/InstructorsController.cs` with: GET list (include office location), GET by id (include course assignments), GET enrolled students for instructor's course, POST create (with courseIds array + officeLocation), PUT update (diff course assignments, upsert/delete office), DELETE (cascade); all async with CancellationToken; push notification on create/update/delete

### Frontend — Instructors Pages

- [X] T050 Create Instructors list page in `src/ContosoUniversity.Web/src/pages/instructors/InstructorList.tsx` with DataTable showing Last Name, First Name, Hire Date, Office; click instructor row → show assigned courses table below; click course → show enrolled students table below that; "Create New" button per FR-003
- [X] T051 [P] Create Instructor create page in `src/ContosoUniversity.Web/src/pages/instructors/InstructorCreate.tsx` with form: LastName, FirstMidName, HireDate, OfficeLocation (optional), course checkboxes (fetched from /api/courses); submit creates instructor with selected courses and office
- [X] T052 [P] Create Instructor details page in `src/ContosoUniversity.Web/src/pages/instructors/InstructorDetails.tsx` showing all fields, assigned courses list, office location
- [X] T053 [P] Create Instructor edit page in `src/ContosoUniversity.Web/src/pages/instructors/InstructorEdit.tsx` with pre-populated form, course checkboxes reflecting current assignments, office location field per FR-004
- [X] T054 [P] Create Instructor delete confirmation page in `src/ContosoUniversity.Web/src/pages/instructors/InstructorDelete.tsx`
- [X] T055 Wire instructor routes in `src/ContosoUniversity.Web/src/App.tsx`: `/instructors`, `/instructors/create`, `/instructors/:id`, `/instructors/:id/edit`, `/instructors/:id/delete`

**Checkpoint**: Instructor CRUD with multi-level drill-down functional. Course assignment checkboxes and office management work.

---

## Phase 6: User Story 4 — Department Management with Concurrency (Priority: P2)

**Goal**: CRUD for departments with optimistic concurrency control showing field-level conflict resolution

**Independent Test**: Create/edit/delete departments; simulate concurrent edit → verify conflict page shows field-level diffs

### Backend — Departments API

- [X] T056 Implement DepartmentsController in `src/ContosoUniversity.Api/Controllers/DepartmentsController.cs` with: GET list (include administrator name), GET by id (include courses), POST create (set RowVersion=Guid.NewGuid()), PUT update (require rowVersion in body, set new RowVersion, catch DbUpdateConcurrencyException → return 409 with currentValues vs submittedValues per research.md R-001), DELETE (block if courses exist → 400 with course list, else delete); all async with CancellationToken; push notification on create/update/delete

### Frontend — Departments Pages

- [X] T057 Create Departments list page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentList.tsx` using DataTable; columns: Name, Budget (formatted as currency), Start Date, Administrator; "Create New" button; links to Details/Edit/Delete per row
- [X] T058 [P] Create Department create page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentCreate.tsx` with form: Name, Budget, StartDate, Administrator dropdown (fetched from /api/instructors)
- [X] T059 [P] Create Department edit page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentEdit.tsx` with pre-populated form including hidden rowVersion field; on 409 response, redirect to conflict page
- [X] T060 [P] Create Department conflict resolution page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentConflict.tsx` showing field-level comparison table (Database Value vs Your Value) for each changed field; "Save" button retries with refreshed rowVersion, "Cancel" returns to list per FR-005
- [X] T061 [P] Create Department details page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentDetails.tsx` showing all fields + associated courses list
- [X] T062 [P] Create Department delete confirmation page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentDelete.tsx` with error display if courses exist (listing the blocking courses)
- [X] T063 Wire department routes in `src/ContosoUniversity.Web/src/App.tsx`: `/departments`, `/departments/create`, `/departments/:id`, `/departments/:id/edit`, `/departments/:id/delete`, `/departments/:id/conflict`

**Checkpoint**: Department CRUD with concurrency handling functional. SC-006 testable.

---

## Phase 7: User Story 5 — Enrollment Statistics Dashboard (Priority: P3)

**Goal**: Read-only statistics page showing enrollment counts grouped by enrollment date

**Independent Test**: Navigate to Statistics page → verify enrollment date groups and counts match seed data

### Backend — Statistics API

- [X] T064 Implement StatisticsController in `src/ContosoUniversity.Api/Controllers/StatisticsController.cs` with: GET `/api/statistics/enrollments` returning enrollment counts grouped by enrollment date using LINQ GroupBy; async with CancellationToken

### Frontend — Statistics Page

- [X] T065 Create Statistics page in `src/ContosoUniversity.Web/src/pages/statistics/StatisticsPage.tsx` showing a table with Enrollment Date and Student Count columns; display "No enrollment data available" message when empty per FR-006

**Checkpoint**: Statistics page functional. SC-007 seed data quantities verifiable.

---

## Phase 8: User Story 6 — Real-Time Notifications via SSE (Priority: P3)

**Goal**: SSE-based notification broadcasting to all connected browsers; toast display; notification history page with mark-as-read

**Independent Test**: Open two browser tabs → CRUD in tab 1 → toast appears in tab 2 within 2 seconds; view notification history and mark as read

### Backend — Notification Infrastructure

- [X] T066 Implement NotificationBroadcaster as singleton service in `src/ContosoUniversity.Api/Infrastructure/Services/NotificationBroadcaster.cs` with: Subscribe() returning client-specific ChannelReader<Notification>, Publish(Notification) writing to all subscriber channels, Unsubscribe on client disconnect per research.md R-006
- [X] T067 Implement INotificationService in `src/ContosoUniversity.Api/Infrastructure/Services/NotificationService.cs`: NotifyAsync creates Notification entity in DB, then calls NotificationBroadcaster.Publish; register as scoped service in DI
- [X] T068 Update `src/ContosoUniversity.Api/Program.cs` to register NotificationBroadcaster as singleton, INotificationService as scoped, and replace placeholder from T024

### Backend — Notifications API

- [X] T069 Implement NotificationsController in `src/ContosoUniversity.Api/Controllers/NotificationsController.cs` with: GET `/api/notifications/stream` SSE endpoint (text/event-stream, reads from subscriber ChannelReader, uses CancellationToken for disconnect), GET `/api/notifications` list with optional unreadOnly filter, PUT `/api/notifications/{id}/read` mark as read

### Frontend — SSE & Toast

- [X] T070 Create SSE connection manager in `src/ContosoUniversity.Web/src/services/sse.ts` wrapping EventSource for `/api/notifications/stream`; parse incoming JSON events; expose onNotification callback; auto-reconnect via built-in EventSource retry
- [X] T071 Create Toast component in `src/ContosoUniversity.Web/src/components/Toast.tsx` displaying notification in top-right corner with entity type, name, operation; auto-dismiss after 5 seconds; close button for early dismissal; stack multiple toasts vertically per FR-020 color scheme (blue border, slate text)
- [X] T072 Integrate SSE + Toast in `src/ContosoUniversity.Web/src/App.tsx`: establish EventSource connection on mount, render Toast stack, pass incoming notifications to Toast component

### Frontend — Notifications History Page

- [X] T073 Create Notifications history page in `src/ContosoUniversity.Web/src/pages/notifications/NotificationList.tsx` listing all notifications (entity type, operation, message, timestamp); unread items visually distinct (bold/blue-50 background); "Mark as Read" button per item; unread count in nav bar badge per FR-012
- [X] T074 Wire notification routes in `src/ContosoUniversity.Web/src/App.tsx`: `/notifications`; update NavBar to show unread count badge

**Checkpoint**: Notifications broadcast via SSE. Toasts appear in top-right. History page with mark-as-read works. SC-003 testable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, final wiring, cleanup

- [X] T075 Run `dotnet build --warnaserror` in `src/ContosoUniversity.Api/` and fix any warnings to achieve SC-008
- [X] T076 [P] Run `npm run build` in `src/ContosoUniversity.Web/` and fix any TypeScript/lint warnings to achieve SC-008
- [X] T077 Validate quickstart.md end-to-end: clone-equivalent fresh start, `dotnet run` seeds database, `npm run dev` serves frontend, navigate to `http://localhost:5173` and verify all 6 user stories per SC-004
- [X] T078 Verify all notification pushes: confirm StudentsController, CoursesController, InstructorsController, DepartmentsController all call INotificationService.NotifyAsync on create/update/delete operations

---

## Phase 10: Streamline the UI

**Purpose**: Create a cleaner and more consistent looking UI, as the current forms are not that consistent.

- [X] T079 Analyze https://column.com/book-transfers which has a tailwindcss based UI to get the requirements for tables, views, forms and styling in general. Implement these consistently in the app.
- [X] T080 Remove the edit button in the tables and create a view details button only inline. In the detail page, add the options to edit and delete.
- [X] T081 Streamline the editing experience for all tables, most importantly streamline how students and teachers are enrolled in courses.
- [X] T082 Create a more modern looking loading indicator and implement this loading state consistently in the frontend.

---
## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phases 3–4 (US1, US2 — P1)**: Depend on Phase 2; can run in parallel with each other
- **Phases 5–6 (US3, US4 — P2)**: Depend on Phase 2; US3 also needs courses from US2 seed data; US4 needs instructors
- **Phases 7–8 (US5, US6 — P3)**: Depend on Phase 2; US6 integrates with all controllers from US1–US4
- **Phase 9 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (Students)**: Phase 2 only — fully independent
- **US2 (Courses)**: Phase 2 only — fully independent (departments exist in seed data)
- **US3 (Instructors)**: Phase 2 + courses must exist (seed data provides them) — effectively independent
- **US4 (Departments)**: Phase 2 + instructors must exist (seed data provides them) — effectively independent
- **US5 (Statistics)**: Phase 2 only — read-only, no write dependencies
- **US6 (Notifications)**: Phase 2 + all controllers should call INotificationService — best done after US1–US4

### Within Each User Story

- Backend controller before frontend pages (API must exist for frontend to call)
- List page before CRUD pages (list provides navigation to individual entities)
- Create before Edit (shared form patterns)
- Core CRUD before specialized features (e.g., enrollment management after basic student CRUD)

### Parallel Opportunities

**Phase 2 parallel groups**:
- T009–T016: All entity files can be created in parallel
- T017–T018: Both interfaces in parallel
- T023: Independent of database layer
- T025–T032: All frontend components in parallel

**Phase 3+ parallel groups**:
- T037–T040: All student CRUD pages (after T036 list page)
- T044–T047: All course CRUD pages (after T043 list page)
- T051–T054: All instructor CRUD pages (after T050 list page)
- T058–T062: All department pages (after T057 list page)

---

## Parallel Example: Phase 2 Entity Creation

```
# All entity files can be created simultaneously (different files, no dependencies):
T009: Student.cs
T010: Instructor.cs
T011: Course.cs
T012: Department.cs
T013: Enrollment.cs
T014: OfficeAssignment.cs
T015: CourseAssignment.cs
T016: Notification.cs
```

## Parallel Example: User Story 1 Frontend

```
# After T036 (StudentList.tsx) is complete, all other pages can be created in parallel:
T037: StudentCreate.tsx
T038: StudentDetails.tsx
T039: StudentEdit.tsx
T040: StudentDelete.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T033) — CRITICAL, blocks everything
3. Complete Phase 3: User Story 1 — Students (T034–T041)
4. **STOP and VALIDATE**: Search, sort, paginate students; full CRUD; enrollment management
5. Student management is fully usable — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Students) → MVP! Core data management works
3. US2 (Courses) → File upload capability added
4. US3 (Instructors) → Multi-level drill-down and many-to-many relationships
5. US4 (Departments) → Concurrency handling pattern complete
6. US5 (Statistics) → Analytics view added
7. US6 (Notifications) → Real-time SSE replaces MSMQ
8. Polish → Build verification, end-to-end validation

Each story adds value without breaking previous stories.
