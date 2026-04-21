# Implementation Plan: Contoso University Modernization

**Branch**: `001-contoso-modernization` | **Date**: 2026-04-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-contoso-modernization/spec.md`

## Summary

Modernize the ContosoUniversity application from .NET Framework 4.8.2 (ASP.NET MVC 5 + EF Core 3.1 + SQL Server LocalDB + MSMQ) to a .NET 9 Web API backend with EF Core 9 on SQLite, paired with a Vite + React + TypeScript + TailwindCSS frontend. Real-time notifications replace MSMQ with Server-Sent Events via in-process `Channel<T>`. The legacy codebase remains untouched as a read-only reference.

## Technical Context

**Language/Version**: C# / .NET 9, TypeScript 5.x (strict)  
**Primary Dependencies**: ASP.NET Core 9 Web API, EF Core 9 (SQLite), React 18+, Vite 6+, TailwindCSS 3+  
**Storage**: SQLite (local file, auto-created), local file system for uploads  
**Testing**: `dotnet build` (zero warnings), `npm run build` (zero warnings)  
**Target Platform**: Local developer machine (Windows/macOS/Linux) — .NET 9 SDK + Node.js 20+  
**Project Type**: Web application (REST API + Single Page Application)  
**Performance Goals**: <1s search results, <2s notification delivery, <5s for 5 MB upload  
**Constraints**: No cloud services, no Docker, SSE-only real-time, no external databases  
**Scale/Scope**: Single admin-user tool, 9 entities, 6 entity sections + statistics + notifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Evidence |
|---|-----------|--------|----------|
| I | Legacy Preservation | ✅ PASS | All new code in `src/ContosoUniversity.Api/` and `src/ContosoUniversity.Web/`. Legacy `src/ContosoUniversity/` untouched. |
| II | Clean Architecture | ✅ PASS | Backend organized as Domain → Application → Infrastructure → Controllers (folders within single project per Principle VII). Dependencies flow inward only. |
| III | Async-First | ✅ PASS | All controller actions and EF Core operations use async/await. CancellationToken propagated. No `.Result` or `.Wait()`. |
| IV | Local-Only Runtime | ✅ PASS | SQLite (local file), SSE for real-time (no SignalR/WebSockets/polling), `Channel<T>` replaces MSMQ. Only .NET 9 SDK + Node.js required. |
| V | Type Safety | ✅ PASS | `<Nullable>enable</Nullable>` in .csproj. `strict: true` in tsconfig.json. No `any` types. Typed API contracts. |
| VI | Defined Project Boundaries | ✅ PASS | Backend in `src/ContosoUniversity.Api/` (REST-only, no Razor). Frontend in `src/ContosoUniversity.Web/` (TailwindCSS utility classes only). |
| VII | Simplicity | ✅ PASS | Single API project (no repository pattern, no generic bases). Single frontend SPA. No microservices. Abstractions only where required (`IStorageService`). |
| VIII | Dependency Injection | ✅ PASS | All services via built-in DI container. Constructor injection only. `IOptions<T>` for config. Registrations in `Program.cs`. |

**Gate result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-contoso-modernization/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── ContosoUniversity/              # Legacy (READ-ONLY — do not modify)
├── ContosoUniversity.Api/          # .NET 9 Web API backend
│   ├── ContosoUniversity.Api.csproj
│   ├── Program.cs                  # DI registration, middleware, seeding
│   ├── appsettings.json            # Configuration (DB path, upload path)
│   ├── Domain/                     # Layer: entities, enums — zero dependencies
│   │   ├── Entities/
│   │   │   ├── Person.cs           # Abstract base (TPH discriminator)
│   │   │   ├── Student.cs
│   │   │   ├── Instructor.cs
│   │   │   ├── Course.cs
│   │   │   ├── Department.cs
│   │   │   ├── Enrollment.cs
│   │   │   ├── OfficeAssignment.cs
│   │   │   ├── CourseAssignment.cs
│   │   │   └── Notification.cs
│   │   └── Enums/
│   │       └── Grade.cs
│   ├── Application/                # Layer: interfaces, DTOs — depends on Domain only
│   │   ├── Interfaces/
│   │   │   ├── IStorageService.cs
│   │   │   └── INotificationService.cs
│   │   └── DTOs/
│   │       ├── StudentDto.cs
│   │       ├── CourseDto.cs
│   │       ├── InstructorDto.cs
│   │       ├── DepartmentDto.cs
│   │       ├── EnrollmentDto.cs
│   │       └── PaginatedList.cs
│   ├── Infrastructure/             # Layer: EF Core, file I/O — implements Application interfaces
│   │   ├── Data/
│   │   │   ├── SchoolContext.cs
│   │   │   └── DbInitializer.cs
│   │   └── Services/
│   │       ├── LocalStorageService.cs
│   │       └── NotificationBackgroundService.cs
│   ├── Controllers/                # Layer: Presentation — depends on Application
│   │   ├── StudentsController.cs
│   │   ├── CoursesController.cs
│   │   ├── InstructorsController.cs
│   │   ├── DepartmentsController.cs
│   │   ├── EnrollmentsController.cs
│   │   ├── StatisticsController.cs
│   │   └── NotificationsController.cs
│   └── Uploads/                    # File upload storage directory
└── ContosoUniversity.Web/          # Vite + React + TypeScript + TailwindCSS
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx                # React entry point
        ├── App.tsx                 # Router setup, layout
        ├── components/             # Reusable UI components
        │   ├── Layout.tsx          # Top nav bar + full-width content area
        │   ├── NavBar.tsx          # Horizontal navigation bar
        │   ├── DataTable.tsx       # Reusable sortable data table
        │   ├── Pagination.tsx      # Page controls
        │   ├── SearchBar.tsx       # Search input
        │   ├── Toast.tsx           # Notification toast (top-right, 5s auto-dismiss)
        │   └── FormField.tsx       # Reusable form field with validation
        ├── pages/                  # Route-based pages
        │   ├── students/           # List, Create, Details, Edit, Delete
        │   ├── courses/            # List, Create, Details, Edit, Delete
        │   ├── instructors/        # List, Create, Details, Edit, Delete
        │   ├── departments/        # List, Create, Details, Edit, Delete + Conflict
        │   ├── statistics/         # Statistics page
        │   └── notifications/      # Notification history page
        ├── services/               # API client & SSE
        │   ├── api.ts              # Typed fetch wrapper
        │   └── sse.ts              # EventSource connection manager
        └── types/                  # Shared TypeScript types
            └── index.ts            # API response types, entity types
```

**Structure Decision**: Web application with separate backend API and frontend SPA directories under `src/`. The backend is a single .NET 9 project with clean architecture as folder-based layers (Domain, Application, Infrastructure, Controllers). This satisfies both Principle II (Clean Architecture) and Principle VII (Simplicity) without introducing multiple .csproj files.

## Complexity Tracking

No constitution violations detected — this section is not required.
