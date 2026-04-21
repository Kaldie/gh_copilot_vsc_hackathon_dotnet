# Implementation Plan: Course Scheduling & Theming

**Branch**: `002-scheduling-theming` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-scheduling-theming/spec.md`

## Summary

Add course scheduling with an interactive drag-and-drop weekly calendar, filterable schedule views per student/instructor with department color coding, and a polished color scheme with dark mode toggle persisted in browser local storage. The backend adds a ScheduledInstance entity and scheduling API endpoints. The frontend adds a full-screen calendar page with sidebar, filter bar, department color legend, and a global dark mode toggle in the navbar.

## Technical Context

**Language/Version**: C# / .NET 9 (backend), TypeScript 6.x strict (frontend)
**Primary Dependencies**: ASP.NET Core 9 Web API, EF Core 9 (SQLite), React 19, Vite 8, TailwindCSS 4, react-router-dom 7. New: calendar/DnD library (researched in Phase 0)
**Storage**: SQLite (local file `contosouniversity.db`)
**Testing**: `dotnet build` (zero warnings), `npm run build` (zero errors)
**Target Platform**: Local developer machine (Windows/macOS/Linux)
**Project Type**: Web application (SPA frontend + REST API backend)
**Performance Goals**: Calendar drag-and-drop at 60fps; theme toggle <1s; schedule load <500ms
**Constraints**: No external services, no Docker, no cloud. SSE for real-time. No additional CSS frameworks.
**Scale/Scope**: ~10 courses, ~8 students, ~5 instructors, 4 departments. Single-user local app.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Legacy Preservation | ✅ PASS | No legacy code modified. All changes in `src/ContosoUniversity.Api/` and `src/ContosoUniversity.Web/` |
| II. Clean Architecture | ✅ PASS | New entity in Domain, DTOs in Application, EF config in Infrastructure, controllers in Presentation |
| III. Async-First | ✅ PASS | All new API endpoints will use async/await with CancellationToken |
| IV. Local-Only Runtime | ✅ PASS | SQLite, no cloud, SSE for notifications of schedule changes |
| V. Type Safety | ✅ PASS | Nullable references enabled, TypeScript strict mode, strongly typed DTOs |
| VI. Defined Project Boundaries | ✅ PASS | Backend in Api/, frontend in Web/, TailwindCSS for styling |
| VII. Simplicity | ✅ PASS | No new abstractions beyond what's needed. Single calendar page, no microservices |
| VIII. Dependency Injection | ✅ PASS | All services registered in Program.cs via DI |

**Gate result: PASS** — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-scheduling-theming/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/ContosoUniversity.Api/
├── Domain/Entities/
│   ├── ScheduledInstance.cs          # NEW entity
│   └── Department.cs                 # ADD Color property
├── Application/DTOs/
│   ├── ScheduledInstanceDto.cs       # NEW DTOs (Create, Update, List)
│   └── DepartmentDto.cs              # ADD Color to existing DTOs
├── Infrastructure/Data/
│   └── SchoolContext.cs              # ADD ScheduledInstance DbSet + config
├── Controllers/
│   └── ScheduledInstancesController.cs  # NEW controller (CRUD + filter)
└── Migrations/                       # NEW migration for schema changes

src/ContosoUniversity.Web/
├── src/
│   ├── components/
│   │   ├── Layout.tsx                # MODIFY: remove max-width for schedule page
│   │   ├── NavBar.tsx                # MODIFY: add Schedule link + dark mode toggle
│   │   ├── ThemeToggle.tsx           # NEW: sun/moon icon button
│   │   └── DepartmentLegend.tsx      # NEW: color legend component
│   ├── pages/
│   │   └── schedule/
│   │       ├── SchedulePage.tsx      # NEW: full-screen calendar + sidebar
│   │       ├── CourseSidebar.tsx     # NEW: draggable course list
│   │       ├── CalendarGrid.tsx      # NEW: weekly grid with drop zones
│   │       ├── ScheduleEvent.tsx     # NEW: course block on calendar
│   │       └── FilterBar.tsx         # NEW: All/Student/Instructor filter
│   ├── hooks/
│   │   └── useTheme.ts              # NEW: theme state + localStorage + OS detection
│   ├── services/
│   │   └── api.ts                    # MODIFY: add schedule API calls
│   ├── types/
│   │   └── index.ts                  # MODIFY: add ScheduledInstance + theme types
│   ├── utils/
│   │   └── departmentColors.ts       # NEW: color palette + auto-assignment logic
│   ├── index.css                     # MODIFY: add dark mode + vibrant color variables
│   └── App.tsx                       # MODIFY: add /schedule route + ThemeProvider
└── package.json                      # MODIFY: add calendar/DnD dependency
```

**Structure Decision**: Extends existing two-project structure (Api + Web). No new projects needed. Schedule page components are colocated under `pages/schedule/`. Theme infrastructure is shared across the app via a hook + CSS variables.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Legacy Preservation | ✅ PASS | No legacy files in `src/ContosoUniversity/` affected |
| II. Clean Architecture | ✅ PASS | ScheduledInstance follows same Entity → DTO → Controller layering as existing entities |
| III. Async-First | ✅ PASS | All new endpoints use async queries with EF Core |
| IV. Local-Only Runtime | ✅ PASS | No external calls. @fullcalendar/react runs client-side only. Theme stored in localStorage |
| V. Type Safety | ✅ PASS | TypeScript types for ScheduledInstance, Theme. C# nullable enabled. DTOs strongly typed |
| VI. Defined Project Boundaries | ✅ PASS | @fullcalendar/react is a frontend dependency only. No CSS frameworks added — FullCalendar has minimal CSS that coexists with Tailwind |
| VII. Simplicity | ✅ PASS | FullCalendar eliminates ~70% of calendar grid work. Single useTheme hook for dark mode. 8-color palette in a utility file |
| VIII. Dependency Injection | ✅ PASS | No new services required beyond controller (inline logic for simple CRUD + filter) |

**Gate result: PASS** — @fullcalendar/react aligns with all principles. It is not an additional CSS framework (principle VI) — it is a calendar component library with minimal, overridable CSS. TailwindCSS remains the sole styling system.

## Complexity Tracking

No constitution violations — section not applicable.
