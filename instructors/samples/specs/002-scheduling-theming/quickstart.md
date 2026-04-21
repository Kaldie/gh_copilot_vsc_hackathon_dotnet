# Quickstart: Course Scheduling & Theming

**Feature**: 002-scheduling-theming  
**Estimated scope**: 4 workstreams (backend entity/API, calendar frontend, department colors, dark mode)

## Prerequisites

- .NET 9 SDK installed
- Node.js 20+ installed
- Repository cloned and on branch `002-scheduling-theming`
- Both apps previously built successfully (from feature 001)

## Implementation Order

### 1. Backend: ScheduledInstance Entity + API (P1)

**Files to create/modify**:
- `src/ContosoUniversity.Api/Domain/Entities/ScheduledInstance.cs` — new entity
- `src/ContosoUniversity.Api/Infrastructure/Data/SchoolContext.cs` — add DbSet + config
- `src/ContosoUniversity.Api/Application/DTOs/ScheduledInstanceDto.cs` — Create, Update, List DTOs
- `src/ContosoUniversity.Api/Controllers/ScheduledInstancesController.cs` — CRUD + filter endpoints
- EF Core migration for the new table

**Verify**: `dotnet build` passes with zero warnings. API endpoints return correct responses.

### 2. Backend: Department Color Property

**Files to modify**:
- `src/ContosoUniversity.Api/Domain/Entities/Department.cs` — add `Color` property
- `src/ContosoUniversity.Api/Application/DTOs/DepartmentDto.cs` — add `Color` to all DTOs
- `src/ContosoUniversity.Api/Controllers/DepartmentsController.cs` — pass through color
- EF Core migration for the new column

**Verify**: `dotnet build` passes. Department CRUD includes color field.

### 3. Frontend: Dark Mode + Enhanced Color Scheme (P3 — but foundational)

**Why early**: Dark mode affects every component. Doing it before new UI avoids double-work (building schedule page in light mode, then retrofitting dark mode).

**Files to create/modify**:
- `src/ContosoUniversity.Web/src/index.css` — add `@custom-variant dark`, CSS variables for color scheme
- `src/ContosoUniversity.Web/src/hooks/useTheme.ts` — theme hook with localStorage
- `src/ContosoUniversity.Web/src/components/ThemeToggle.tsx` — sun/moon icon button
- `src/ContosoUniversity.Web/src/components/NavBar.tsx` — add ThemeToggle + Schedule link
- `src/ContosoUniversity.Web/src/components/Layout.tsx` — wrap with theme provider
- All existing pages/components — add `dark:` variants to Tailwind classes

**Verify**: `npm run build` passes. Toggle works. All existing pages render correctly in both modes.

### 4. Frontend: Schedule Page + Calendar (P1 + P2)

**Install dependencies**:
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/timegrid @fullcalendar/interaction
```

**Files to create/modify**:
- `src/ContosoUniversity.Web/src/pages/schedule/SchedulePage.tsx` — main page layout
- `src/ContosoUniversity.Web/src/pages/schedule/CourseSidebar.tsx` — draggable course list
- `src/ContosoUniversity.Web/src/pages/schedule/CalendarGrid.tsx` — FullCalendar wrapper
- `src/ContosoUniversity.Web/src/pages/schedule/ScheduleEvent.tsx` — custom event renderer
- `src/ContosoUniversity.Web/src/pages/schedule/FilterBar.tsx` — All/Student/Instructor filter
- `src/ContosoUniversity.Web/src/components/DepartmentLegend.tsx` — color legend
- `src/ContosoUniversity.Web/src/utils/departmentColors.ts` — palette logic
- `src/ContosoUniversity.Web/src/services/api.ts` — add schedule API calls
- `src/ContosoUniversity.Web/src/types/index.ts` — add ScheduledInstance types
- `src/ContosoUniversity.Web/src/App.tsx` — add `/schedule` route

**Verify**: `npm run build` passes. Full drag-and-drop workflow works. Filters work. Colors match departments.

### 5. Frontend: Department Color Picker

**Files to modify**:
- `src/ContosoUniversity.Web/src/pages/departments/DepartmentCreate.tsx` — add color picker
- `src/ContosoUniversity.Web/src/pages/departments/DepartmentEdit.tsx` — add color picker

**Verify**: Color picker changes persist. Calendar reflects custom colors.

## Build Verification

After all steps:

```bash
# Backend
cd src/ContosoUniversity.Api
dotnet build  # Must: zero warnings

# Frontend
cd src/ContosoUniversity.Web
npm run build  # Must: zero errors
```

## Key Decisions Reference

| Decision | Choice | Source |
|----------|--------|--------|
| Calendar library | @fullcalendar/react + plugins | research.md §1 |
| Dark mode approach | Tailwind `@custom-variant` + `.dark` class + localStorage | research.md §2 |
| Color palette | 8 pre-defined light/dark pairs, HSL fallback | research.md §3 |
| Schedule data model | ScheduledInstance with DayOfWeek + TimeOnly | research.md §4 |
| Calendar layout | Full-screen with left sidebar | spec.md clarifications |
| Filter approach | Single page, inline filter bar | spec.md clarifications |
| Color assignment | Auto-palette + optional color picker override | spec.md clarifications |
| Time granularity | 30-minute snap intervals | spec.md clarifications |
