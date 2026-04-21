# Feature Specification: Course Scheduling & Theming

**Feature Branch**: `002-scheduling-theming`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "Add course scheduling with interactive calendar (drag-and-drop), schedule overviews per student/teacher with department color coding, and a polished color scheme with dark mode toggle persisted in browser storage."

## Clarifications

### Session 2026-04-21

- Q: How should department colors be assigned — automatic, manual color picker, or hybrid? → A: Auto-assigned palette with optional color picker override on department edit page.
- Q: How should the schedule page navigation and filtering work? → A: Single `/schedule` page with inline filter bar at the top (dropdown to select All / a specific student / a specific instructor).
- Q: Where should the dark mode toggle be placed in the UI? → A: Sun/moon icon button in the navbar top-right, next to the notification bell.
- Q: What time granularity should the calendar use for drag-and-drop snapping? → A: 30-minute intervals (courses snap to the hour or half hour).
- Q: Should the course sidebar filter when viewing a student/instructor schedule? → A: Sidebar always shows all courses; filter only affects calendar display. Drag-and-drop always creates master schedule entries.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Course Schedule via Interactive Calendar (Priority: P1)

As an administrator, I want to drag and drop courses onto an interactive weekly calendar so that I can build the overall class schedule for the institution.

Each time a course is placed on the calendar, it creates a **scheduled instance** — a specific day-and-time slot for that course. A single course can (and typically should) appear on multiple days (e.g., "Calculus" scheduled Monday 9:00 AM, Wednesday 9:00 AM, and Friday 9:00 AM).

**Why this priority**: Scheduling is the core value of this feature set. Without the ability to create schedule entries, the overview and theming stories have nothing to display.

**Independent Test**: An administrator can open the scheduling view, see a list of available courses, drag a course onto a calendar time slot, and see the scheduled instance persist after page refresh.

**Acceptance Scenarios**:

1. **Given** I am on the scheduling page, **When** I drag a course from the course list onto a calendar time slot, **Then** a 1-hour scheduled instance is created at that day and time.
2. **Given** a course is already scheduled on Monday at 9 AM, **When** I drag the same course onto Wednesday at 9 AM, **Then** a second independent instance is created without affecting the first.
3. **Given** a scheduled instance exists on the calendar, **When** I drag it to a different time slot, **Then** the instance's day and time are updated accordingly.
4. **Given** a scheduled instance exists on the calendar, **When** I click a delete/remove action on it, **Then** the instance is removed from the schedule.
5. **Given** I have created several scheduled instances, **When** I refresh the page, **Then** all instances are still visible on the calendar.

---

### User Story 2 — View Schedule by Student or Instructor (Priority: P2)

As an administrator or viewer, I want to filter the schedule calendar to show only the courses relevant to a specific student or instructor so that I can review individual timetables.

A student's schedule is derived from their enrollments — they see scheduled instances for every course they are enrolled in. An instructor's schedule is derived from their course assignments — they see scheduled instances for every course they teach.

**Why this priority**: Individual schedule views are the primary consumer-facing benefit of scheduling data. They depend on P1 (schedule creation) but are essential for the feature to be useful beyond administration.

**Independent Test**: After courses have been scheduled (P1), using the inline filter bar at the top of the schedule page to select a student or instructor filters the calendar to show only their relevant courses.

**Acceptance Scenarios**:

1. **Given** I am on the `/schedule` page viewing the full schedule, **When** I select a student from the filter bar who is enrolled in Calculus and Literature, **Then** only Calculus and Literature instances appear on the calendar.
2. **Given** I am on the `/schedule` page, **When** I select an instructor from the filter bar who teaches Chemistry and Physics, **Then** only Chemistry and Physics instances appear on the calendar.
3. **Given** I am viewing a filtered schedule, **When** I clear the filter (select "All"), **Then** the full schedule with all courses is displayed again.
4. **Given** the filter bar is visible, **Then** it provides a mode selector (All / Student / Instructor) and a person selector dropdown that updates based on the selected mode.
5. **Given** I am viewing a filtered schedule for a student, **Then** the course sidebar on the left still shows all courses, and I can drag any course onto the calendar to create a master schedule entry.
6. **Given** I am viewing any schedule view, **Then** each course block on the calendar is color-coded by its department (e.g., all Mathematics courses share one color, all Engineering courses share another).

---

### User Story 3 — Department Color-Coded Calendar Entries (Priority: P2)

As a viewer, I want courses on the calendar to be visually distinguished by department through consistent color coding so that I can quickly identify which department a scheduled course belongs to.

**Why this priority**: Color coding is tightly coupled with the schedule display (P1 and P2) and significantly improves readability. It has the same priority as P2 since it enhances the schedule views.

**Independent Test**: When viewing any schedule (full or filtered), each course block displays in a color that corresponds to its department, and a legend or visual key indicates which color maps to which department.

**Acceptance Scenarios**:

1. **Given** courses from Mathematics and Engineering are scheduled, **When** I view the calendar, **Then** Mathematics courses display in one distinct color and Engineering courses in another.
2. **Given** all four departments have scheduled courses, **Then** each department has a unique, visually distinguishable color that remains consistent across all schedule views.
3. **Given** I am viewing the calendar, **Then** a legend or visual indicator maps department names to their assigned colors.
4. **Given** the application is in dark mode, **Then** department colors remain distinguishable and accessible against the dark background.

---

### User Story 4 — Enhanced Color Scheme and Dark Mode Toggle (Priority: P3)

As a user, I want the application to have a more vibrant and polished visual design with the option to switch between light and dark mode, so that the experience feels modern and comfortable for extended use.

**Why this priority**: Theming is a visual enhancement that improves the overall experience but does not gate any functional capability. It can be developed and tested independently of the scheduling features.

**Independent Test**: A user can toggle between light and dark mode from any page, the entire UI adapts, and the preference persists across browser sessions without requiring login.

**Acceptance Scenarios**:

1. **Given** I am on any page of the application, **When** I click the theme toggle, **Then** the entire UI switches between light and dark mode.
2. **Given** I have selected dark mode, **When** I close the browser and reopen the application, **Then** the application loads in dark mode.
3. **Given** I have never toggled the theme, **When** I open the application for the first time, **Then** the application respects my operating system's color scheme preference.
4. **Given** the application is in dark mode, **Then** all text, borders, backgrounds, buttons, tables, forms, and interactive elements remain clearly readable and visually consistent.
5. **Given** the application has been updated with the new color scheme, **Then** the light mode uses a richer, more vibrant palette compared to the current grayscale design while maintaining readability and professional appearance.

---

### Edge Cases

- What happens when a user tries to schedule a course at the same time as another course already assigned to the same instructor? The calendar should display a visual conflict warning but still allow the scheduling (advisory, not blocking).
- What happens when a course has no enrollments yet and appears on the schedule? It should still display normally — scheduling is independent of enrollment.
- What happens when a department is deleted or a course is reassigned to a different department? The calendar color should update to reflect the current department assignment on next load.
- What happens when the browser's local storage is cleared? The theme preference resets and the application falls back to the OS color scheme preference.
- What happens when a scheduled instance is dragged outside valid calendar boundaries (before 7 AM or after 9 PM)? The drop should be rejected and the instance returned to its original position.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a near-full-screen weekly calendar view with a course sidebar panel on the left. Courses are dragged from the sidebar and dropped onto specific day/time slots to create scheduled instances. The sidebar always displays all available courses regardless of active filters — filtering only affects which scheduled instances are visible on the calendar grid.
- **FR-002**: System MUST persist scheduled instances so they survive page refreshes and browser sessions.
- **FR-003**: System MUST allow a single course to have multiple scheduled instances across different days and times.
- **FR-004**: System MUST allow scheduled instances to be moved to a different time slot via drag-and-drop.
- **FR-005**: System MUST allow scheduled instances to be deleted from the calendar.
- **FR-006**: System MUST default each scheduled instance to a 1-hour duration. The calendar grid snaps to 30-minute intervals, meaning courses can start on the hour or half hour (e.g., 9:00, 9:30, 10:00).
- **FR-007**: System MUST provide an inline filter bar at the top of the schedule page with a mode selector (All / Student / Instructor) and a person dropdown to view the schedule for a specific student (based on enrollments) or instructor (based on course assignments).
- **FR-008**: The schedule page MUST be accessible via a top-level "Schedule" navigation item at route `/schedule`. All views (master and filtered) live on this single page.
- **FR-009**: System MUST color-code scheduled course blocks by their department. Colors are auto-assigned from a built-in palette by default but can be overridden via a color picker on the department edit page.
- **FR-009a**: When a new department is created without an explicit color, the system MUST automatically assign an unused color from the palette (or generate a distinguishable one if the palette is exhausted).
- **FR-010**: System MUST display a legend or visual key mapping department names to their colors.
- **FR-011**: System MUST show a visual conflict indicator when an instructor is double-booked (two courses at the same time).
- **FR-012**: System MUST provide a sun/moon icon toggle button in the top-right corner of the navigation bar (next to the notification bell) to switch between light mode and dark mode. The toggle is visible and accessible from every page.
- **FR-013**: System MUST persist the user's theme preference in browser local storage.
- **FR-014**: System MUST respect the operating system's color scheme preference when no explicit user preference is stored.
- **FR-015**: System MUST update the application's color palette to use richer, more vibrant colors in both light and dark modes while maintaining accessibility contrast ratios.
- **FR-016**: Department colors on the calendar MUST remain accessible and distinguishable in both light and dark modes.

### Key Entities

- **ScheduledInstance**: Represents a single occurrence of a course on the calendar. Key attributes: the course it belongs to, the day of the week, the start time, and the duration (defaulting to 1 hour). A course can have many scheduled instances.
- **Course** (existing): Extended relationship — a course now has zero or more scheduled instances in addition to its existing enrollments and assignments.
- **Department** (existing): Extended with an optional color attribute. When set, the calendar uses this color; when unset, a color is auto-assigned from the built-in palette. The department edit page includes a color picker for manual override.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can build a full weekly schedule for all courses (across 4 departments, 10 courses) in under 10 minutes using drag-and-drop.
- **SC-002**: A user can view an individual student's or instructor's weekly schedule within 2 clicks from the main schedule page.
- **SC-003**: Users can distinguish which department a course belongs to at a glance on the calendar without reading text labels, by color alone.
- **SC-004**: Users can toggle between light and dark mode and see the entire UI update within 1 second, with no visual glitches or unreadable content.
- **SC-005**: A user's theme preference persists across at least 5 consecutive browser sessions without requiring any action.
- **SC-006**: All text and interactive elements meet WCAG 2.1 AA contrast ratios in both light and dark modes.

## Assumptions

- The calendar displays a **weekly view** (Monday through Sunday) with Saturday and Sunday shown as inactive/greyed-out columns. Courses cannot be scheduled on weekends, but the weekend columns are visible for a complete calendar appearance.
- Calendar time slots span from **7:00 AM to 9:00 PM** to cover typical academic hours.
- **Room/location assignment** is out of scope for v1 — scheduled instances track day and time only, not physical rooms.
- The existing four departments (English, Mathematics, Engineering, Economics) are sufficient for color-coding. The system should support additional departments but the initial color palette covers these four.
- **Conflict detection** is advisory only (visual warning) — the system does not prevent double-booking because real-world scheduling sometimes requires intentional overlaps.
- **Authentication and authorization** are out of scope — any user can create and modify the schedule. Access control can be layered on in a future iteration.
- The theme toggle and preference storage use **browser local storage** — there is no server-side user preference model, since the application currently has no user authentication.
- The new color scheme enhances the existing styling approach — no additional CSS framework or component library is introduced.
