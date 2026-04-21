# Tasks: Course Scheduling & Theming

**Input**: Design documents from `/specs/002-scheduling-theming/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification — test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and prepare project for scheduling + theming features

- [X] T001 Install FullCalendar packages in frontend: `npm install @fullcalendar/react @fullcalendar/core @fullcalendar/timegrid @fullcalendar/interaction` in `src/ContosoUniversity.Web/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend entities, migrations, and shared types that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Create ScheduledInstance entity in `src/ContosoUniversity.Api/Domain/Entities/ScheduledInstance.cs` with properties: ScheduledInstanceId (int PK auto-increment), CourseId (int FK), DayOfWeek (System.DayOfWeek), StartTime (TimeOnly), DurationMinutes (int default 60). Add navigation property to Course.
- [X] T003 [P] Add `Color` nullable string property (max 7 chars) to Department entity in `src/ContosoUniversity.Api/Domain/Entities/Department.cs`
- [X] T004 [P] Add `ICollection<ScheduledInstance> ScheduledInstances` navigation property to Course entity in `src/ContosoUniversity.Api/Domain/Entities/Course.cs`
- [X] T005 Register ScheduledInstance DbSet and configure EF Core mapping (unique index on CourseId+DayOfWeek+StartTime, FK to Course, Department.Color max length 7) in `src/ContosoUniversity.Api/Infrastructure/Data/SchoolContext.cs`
- [X] T006 Create and apply EF Core migration for ScheduledInstance table and Department.Color column — run `dotnet ef migrations add AddSchedulingAndDepartmentColor` and `dotnet ef database update` in `src/ContosoUniversity.Api/`
- [X] T007 [P] Create ScheduledInstance DTOs in `src/ContosoUniversity.Api/Application/DTOs/ScheduledInstanceDto.cs`: ScheduledInstanceDto (list response with denormalized courseTitle, departmentId, departmentName, departmentColor), CreateScheduledInstanceDto (courseId, dayOfWeek, startTime, durationMinutes), UpdateScheduledInstanceDto (dayOfWeek, startTime, durationMinutes)
- [X] T008 [P] Add `Color` property to all Department DTOs (DepartmentDto, CreateDepartmentDto, UpdateDepartmentDto) in `src/ContosoUniversity.Api/Application/DTOs/DepartmentDto.cs`
- [X] T009 [P] Add ScheduledInstance and Theme TypeScript types to `src/ContosoUniversity.Web/src/types/index.ts`: ScheduledInstanceDto, CreateScheduledInstanceDto, UpdateScheduledInstanceDto, ConflictDto, ThemePreference type
- [X] T010 [P] Add `color` field to Department TypeScript types in `src/ContosoUniversity.Web/src/types/index.ts`

**Checkpoint**: Foundation ready — all entities, migrations, and shared types in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Create Course Schedule via Interactive Calendar (Priority: P1) 🎯 MVP

**Goal**: An administrator can drag courses from a sidebar onto a weekly calendar grid to create, move, and delete scheduled instances that persist across page refreshes.

**Independent Test**: Open `/schedule`, drag a course from the sidebar onto the calendar, see it persist after page refresh. Move it by dragging to another slot. Delete it via a remove action.

### Implementation for User Story 1

- [X] T011 [US1] Create ScheduledInstancesController with full CRUD in `src/ContosoUniversity.Api/Controllers/ScheduledInstancesController.cs`: GET all (with Include Course.Department for denormalized response), GET by id, POST (validate courseId exists, dayOfWeek 1–5, startTime 07:00–20:00, return 409 on duplicate), PUT (update day/time/duration), DELETE. All endpoints async with CancellationToken.
- [X] T012 [US1] Map Department.Color in DepartmentsController — update GET, POST, PUT handlers to include color field pass-through in `src/ContosoUniversity.Api/Controllers/DepartmentsController.cs`
- [X] T013 [US1] Add schedule API functions to `src/ContosoUniversity.Web/src/services/api.ts`: getScheduledInstances(studentId?, instructorId?), getScheduledInstance(id), createScheduledInstance(dto), updateScheduledInstance(id, dto), deleteScheduledInstance(id), getConflicts(instructorId)
- [X] T014 [P] [US1] Create department color palette utility in `src/ContosoUniversity.Web/src/utils/departmentColors.ts`: 8-color palette with light/dark background+text pairs per research.md, getDepartmentColor(departmentId, explicitColor?) function, getResolvedColors(departmentId, explicitColor?, isDark?) returning {bg, text}
- [X] T015 [P] [US1] Create CourseSidebar component in `src/ContosoUniversity.Web/src/pages/schedule/CourseSidebar.tsx`: fetch all courses, render draggable list grouped by department with color indicators, integrate with FullCalendar external drag via `data-event` attributes
- [X] T016 [US1] Create CalendarGrid component in `src/ContosoUniversity.Web/src/pages/schedule/CalendarGrid.tsx`: FullCalendar timeGridWeek view (Mon–Sun, 7AM–9PM, 30-min slots), handle eventReceive (external drop → POST), eventDrop (move → PUT), configure slotDuration='00:30:00', weekends greyed-out/non-interactive, department-colored events
- [X] T017 [US1] Create ScheduleEvent custom event content renderer in `src/ContosoUniversity.Web/src/pages/schedule/ScheduleEvent.tsx`: display course title, department name, time, delete button (X), department color-coded background
- [X] T018 [US1] Create SchedulePage layout component in `src/ContosoUniversity.Web/src/pages/schedule/SchedulePage.tsx`: full-screen layout with CourseSidebar on left (~250px), CalendarGrid filling remaining space, state management for scheduled instances (fetch on mount, optimistic updates on drag/drop/delete)
- [X] T019 [US1] Add `/schedule` route to `src/ContosoUniversity.Web/src/App.tsx` and add "Schedule" navigation link to `src/ContosoUniversity.Web/src/components/NavBar.tsx`
- [X] T020 [US1] Update Layout component to remove max-width constraint when on `/schedule` route in `src/ContosoUniversity.Web/src/components/Layout.tsx` for full-screen calendar experience

**Checkpoint**: User Story 1 complete — full CRUD scheduling via drag-and-drop calendar with persistence. Courses can be dragged from sidebar, moved between slots, and deleted.

---

## Phase 4: User Story 2 — View Schedule by Student or Instructor (Priority: P2)

**Goal**: A user can filter the calendar to show only courses relevant to a specific student (via enrollments) or instructor (via course assignments).

**Independent Test**: After scheduling courses (US1), select a student from the filter bar — only their enrolled courses appear. Select an instructor — only their assigned courses appear. Select "All" — full schedule returns.

### Implementation for User Story 2

- [X] T021 [US2] Add GET filtering query parameters (studentId, instructorId) to ScheduledInstancesController in `src/ContosoUniversity.Api/Controllers/ScheduledInstancesController.cs`: filter via Enrollment join for studentId, CourseAssignment join for instructorId. Return 400 if both provided.
- [X] T022 [US2] Add conflict detection endpoint GET `/api/scheduledinstances/conflicts?instructorId={id}` in `src/ContosoUniversity.Api/Controllers/ScheduledInstancesController.cs`: find overlapping instances for same instructor on same day per data-model.md conflict logic
- [X] T023 [US2] Create FilterBar component in `src/ContosoUniversity.Web/src/pages/schedule/FilterBar.tsx`: mode selector (All / Student / Instructor), person dropdown that loads students or instructors based on selected mode, triggers re-fetch of scheduled instances with appropriate query param
- [X] T024 [US2] Integrate FilterBar into SchedulePage in `src/ContosoUniversity.Web/src/pages/schedule/SchedulePage.tsx`: place above calendar, pass filter state to API calls, update calendar events when filter changes
- [X] T025 [US2] Add visual conflict warning overlay on calendar events in `src/ContosoUniversity.Web/src/pages/schedule/ScheduleEvent.tsx`: when viewing an instructor's schedule, highlight overlapping time blocks with a warning indicator (striped border or warning icon)

**Checkpoint**: User Story 2 complete — schedule filtering by student/instructor works, conflicts are visually indicated for instructor views.

---

## Phase 5: User Story 3 — Department Color-Coded Calendar Entries (Priority: P2)

**Goal**: Calendar entries are consistently color-coded by department with a visible legend. Colors work in both light and dark modes.

**Independent Test**: View the calendar with courses from multiple departments — each department has a distinct, consistent color. A legend shows the color-department mapping.

### Implementation for User Story 3

- [X] T026 [US3] Create DepartmentLegend component in `src/ContosoUniversity.Web/src/components/DepartmentLegend.tsx`: display all departments with their assigned color swatch and name, use getDepartmentColor utility, respond to dark mode changes
- [X] T027 [US3] Integrate DepartmentLegend into SchedulePage in `src/ContosoUniversity.Web/src/pages/schedule/SchedulePage.tsx`: place below the filter bar or at the bottom of the sidebar, ensure it updates when departments change
- [X] T028 [US3] Add color picker to department edit page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentEdit.tsx`: HTML native `<input type="color">` bound to department.color, with "Reset to auto" button that sets color to null
- [X] T029 [US3] Add color picker to department create page in `src/ContosoUniversity.Web/src/pages/departments/DepartmentCreate.tsx`: optional color input field, same pattern as edit page
- [X] T030 [US3] Add `color` field to department API service calls in `src/ContosoUniversity.Web/src/services/api.ts`: include color in create/update payloads, parse from GET responses

**Checkpoint**: User Story 3 complete — calendar entries have department colors, legend visible, color picker available on department pages.

---

## Phase 6: User Story 4 — Enhanced Color Scheme and Dark Mode Toggle (Priority: P3)

**Goal**: The application supports light/dark mode toggle with localStorage persistence and OS preference detection. The visual design uses a richer, more vibrant color palette.

**Independent Test**: Click the theme toggle on any page — UI switches between light/dark mode. Close and reopen browser — preference persists. Clear localStorage — falls back to OS preference.

### Implementation for User Story 4

- [X] T031 [US4] Add `@custom-variant dark (&:where(.dark, .dark *));` directive and enhanced color scheme CSS variables to `src/ContosoUniversity.Web/src/index.css`: define custom properties for primary, secondary, accent, surface, and text colors in both light and dark modes
- [X] T032 [US4] Create useTheme hook in `src/ContosoUniversity.Web/src/hooks/useTheme.ts`: read localStorage.theme on mount, detect OS preference via matchMedia, toggle .dark class on document.documentElement, expose {theme, resolvedTheme, setTheme} interface
- [X] T033 [US4] Create ThemeToggle component in `src/ContosoUniversity.Web/src/components/ThemeToggle.tsx`: sun/moon SVG icon button, calls useTheme().setTheme to cycle light→dark→system, display current state visually
- [X] T034 [US4] Add ThemeToggle to NavBar in `src/ContosoUniversity.Web/src/components/NavBar.tsx`: place in top-right area next to existing notification bell icon
- [X] T035 [US4] Add FOUC-prevention inline script to `src/ContosoUniversity.Web/index.html`: read localStorage.theme before React hydration and set .dark class on `<html>` element to prevent flash of wrong theme
- [X] T036 [US4] Add `dark:` Tailwind utility classes to NavBar component in `src/ContosoUniversity.Web/src/components/NavBar.tsx`
- [X] T037 [P] [US4] Add `dark:` Tailwind utility classes to Layout and page shell in `src/ContosoUniversity.Web/src/components/Layout.tsx`
- [X] T038 [P] [US4] Add `dark:` Tailwind utility classes to Students pages in `src/ContosoUniversity.Web/src/pages/students/` (StudentList, StudentDetail, StudentCreate, StudentEdit)
- [X] T039 [P] [US4] Add `dark:` Tailwind utility classes to Courses pages in `src/ContosoUniversity.Web/src/pages/courses/` (CourseList, CourseDetail, CourseCreate, CourseEdit)
- [X] T040 [P] [US4] Add `dark:` Tailwind utility classes to Instructors pages in `src/ContosoUniversity.Web/src/pages/instructors/` (InstructorList, InstructorDetail, InstructorCreate, InstructorEdit)
- [X] T041 [P] [US4] Add `dark:` Tailwind utility classes to Departments pages in `src/ContosoUniversity.Web/src/pages/departments/` (DepartmentList, DepartmentDetail, DepartmentCreate, DepartmentEdit)
- [X] T042 [P] [US4] Add `dark:` Tailwind utility classes to Home page and About page in `src/ContosoUniversity.Web/src/pages/`
- [X] T043 [P] [US4] Add `dark:` Tailwind utility classes to shared components: NotificationBell, ConfirmDialog, ErrorBoundary, and any other shared components in `src/ContosoUniversity.Web/src/components/`
- [X] T044 [US4] Add `dark:` Tailwind utility classes to Schedule page components in `src/ContosoUniversity.Web/src/pages/schedule/` (SchedulePage, CourseSidebar, CalendarGrid, FilterBar, ScheduleEvent) and DepartmentLegend
- [X] T045 [US4] Override FullCalendar default styles for dark mode in `src/ContosoUniversity.Web/src/index.css`: target `.dark .fc` selectors for grid lines, background, header, time labels, and event text

**Checkpoint**: User Story 4 complete — entire app supports light/dark mode with vibrant color scheme, persistent toggle, OS preference detection, FOUC prevention.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, build verification, and quality pass

- [ ] T046 [P] Verify `dotnet build` passes with zero warnings in `src/ContosoUniversity.Api/`
- [ ] T047 [P] Verify `npm run build` passes with zero errors in `src/ContosoUniversity.Web/`
- [ ] T048 Run full quickstart.md validation: start API, start frontend, create scheduled instances via DnD, verify persist on refresh, test filter by student/instructor, verify department colors, toggle dark mode, verify persistence
- [ ] T049 Review all department colors for WCAG 2.1 AA contrast compliance in both light and dark modes in `src/ContosoUniversity.Web/src/utils/departmentColors.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational phase completion — delivers MVP
- **US2 (Phase 4)**: Depends on Phase 3 (US1) — needs schedule data and calendar to exist
- **US3 (Phase 5)**: Depends on Phase 3 (US1) — needs calendar events to color-code. Can run in parallel with US2
- **US4 (Phase 6)**: Depends on Phase 3 (US1) — needs schedule page to exist for dark mode styling. Can start T031–T043 in parallel with US2/US3 since those tasks target existing pages
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P2)**: Depends on US1 (calendar must exist to filter it)
- **US3 (P2)**: Depends on US1 (calendar events must exist to color-code). Independent of US2
- **US4 (P3)**: Core infrastructure (T031–T035) independent of US1. Page-specific dark mode (T036–T045) should be done after those pages exist

### Within Each User Story

- Backend tasks before frontend tasks that consume the API
- DTOs/types before service calls
- Service calls before UI components
- Layout/page components before child components (but can be done together)

### Parallel Opportunities

Within Phase 2 (Foundational):
- T003, T004 can run in parallel (different files)
- T007, T008, T009, T010 can all run in parallel (different files)

Within Phase 3 (US1):
- T014, T015 can run in parallel (different files, no dependencies)

Within Phase 6 (US4):
- T037–T043 can ALL run in parallel (each targets different page folders)

---

## Parallel Example: User Story 1

```bash
# Sequential: Backend first
Task T011: ScheduledInstancesController (CRUD API)
Task T012: Department color pass-through

# Then parallel frontend foundation:
Task T014: departmentColors.ts utility     # [P] no dependencies
Task T015: CourseSidebar component         # [P] no dependencies

# Then sequential frontend assembly:
Task T016: CalendarGrid (depends on T014 for colors)
Task T017: ScheduleEvent (depends on T016 for calendar context)
Task T018: SchedulePage (depends on T015, T016, T17 — integrates all)
Task T019: Route + NavBar link
Task T020: Layout full-screen adjustment
```

---

## Parallel Example: User Story 4 (Dark Mode)

```bash
# Sequential: Core infrastructure first
Task T031: CSS custom variant + color variables
Task T032: useTheme hook
Task T033: ThemeToggle component
Task T034: Add to NavBar
Task T035: FOUC prevention script

# Then ALL page retrofits in parallel:
Task T037: Layout dark classes        # [P]
Task T038: Students pages             # [P]
Task T039: Courses pages              # [P]
Task T040: Instructors pages          # [P]
Task T041: Departments pages          # [P]
Task T042: Home/About pages           # [P]
Task T043: Shared components          # [P]

# Then schedule-specific (after schedule pages exist):
Task T044: Schedule page dark classes
Task T045: FullCalendar CSS overrides
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install FullCalendar)
2. Complete Phase 2: Foundational (entities, migrations, types)
3. Complete Phase 3: User Story 1 (calendar + DnD + CRUD)
4. **STOP and VALIDATE**: Drag courses onto calendar, verify persistence, move/delete
5. Deploy/demo if ready — functional scheduling in light mode

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Interactive Calendar) → Test independently → **MVP!**
3. Add US2 (Filter by Student/Instructor) → Test independently → Enhanced navigation
4. Add US3 (Department Colors + Legend) → Test independently → Visual clarity
5. Add US4 (Dark Mode + Color Scheme) → Test independently → Polished UX
6. Polish phase → Build verification + accessibility review

### Recommended Single-Developer Order

1. Phase 1 + Phase 2 (Setup + Foundation)
2. Phase 6 T031–T035 (Dark mode core infrastructure — do early to avoid double-work)
3. Phase 3 (US1 — Calendar with dark mode built in from the start)
4. Phase 4 (US2 — Filtering)
5. Phase 5 (US3 — Department colors + legend + picker)
6. Phase 6 T036–T045 (Dark mode retrofit for all existing + new pages)
7. Phase 7 (Polish)
