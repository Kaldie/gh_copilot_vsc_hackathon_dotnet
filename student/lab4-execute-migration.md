# Lab 4: Execute the Migration

**Duration:** 90 minutes  
**Goal:** Execute the Spec Kit tasks to build the full modernized application — backend API and React frontend. By the end, you should have a working app that reproduces all legacy functionality with the new tech stack.

---

## Getting Started

Open your `tasks.md` from Lab 3. This is your roadmap. You'll work through the tasks using `/speckit.implement` in Copilot Chat.

> **Important:** You're building new projects *alongside* the legacy app — not modifying it. Your constitution from Lab 3 should already establish this. The legacy code in `src/ContosoUniversity/` stays untouched as a reference.

The general workflow for each task is:
1. Tell Copilot which task you're working on
2. Review and apply the generated code
3. Build and test
4. Move to the next task

> **Tip:** Keep a terminal open with `dotnet watch run` (backend) and `npm run dev` (frontend, once scaffolded) — they hot-reload as you make changes.

---

## Part A: Backend API

### Milestone 1: Project Scaffold & Data Layer

Your first goal is a project that compiles and has a working database.

This typically includes:
- SDK-style `.csproj` with the right package references
- `Program.cs` with minimal hosting, DI registration, and middleware pipeline
- `appsettings.json` with database configuration
- Entity models and `DbContext` ported to EF Core 9
- Database seeding with the same sample data as the legacy app
- SQLite database creation on first run

**How to verify:** `dotnet build` succeeds, and when you run the app, the SQLite database file is created with seeded data.

### Milestone 2: API Controllers

With the data layer working, build out the REST API.

For each entity (Students, Courses, Instructors, Departments), you need:
- Standard CRUD endpoints (GET list, GET by id, POST, PUT, DELETE)
- Students: search, sort, and pagination on the list endpoint
- Instructors: course assignment/unassignment endpoints
- Departments: optimistic concurrency handling on update
- Courses: file upload endpoint for teaching materials

Also:
- An enrollment statistics endpoint (for the About page data)
- Swagger/OpenAPI documentation (should come free with `builder.Services.AddOpenApi()`)

**How to verify:** Run the app and open Swagger UI. You should be able to call every endpoint and see correct responses.

### Milestone 3: Notifications via SSE

Replace the legacy MSMQ + browser polling with Server-Sent Events (SSE).

The flow should be:
1. A CRUD operation happens (e.g., student created)
2. The controller pushes a notification to an in-process channel
3. A background service reads from the channel
4. Connected SSE clients receive the notification in real time

**How to verify:** Open the SSE endpoint in a browser (it will stay open and wait). In another tab or via curl, create a student. You should see the notification event appear in the SSE stream.

### Milestone 4: File Storage

Teaching materials need an `IStorageService` abstraction with a local file system implementation.

- Controllers receive files via `IFormFile` and pass them to `IStorageService`
- The local implementation stores files on disk (e.g., in a `uploads/` folder)
- File paths or identifiers are stored in the database
- A GET endpoint serves the files back

**How to verify:** Upload a file via Swagger, then retrieve it via the GET endpoint.

---

## Part B: React Frontend

With the backend API working, build the frontend that consumes it.

### Milestone 5: Project Setup

Scaffold the React project alongside the backend:

- **Vite** as the build tool
- **React 19** with **TypeScript**
- **TailwindCSS** for styling
- A proxy configuration so the frontend dev server forwards API calls to the .NET backend

> **Tip:** You can ask Copilot to scaffold the project for you in agent mode. It can run the necessary commands (`npm create vite`, install dependencies, configure Tailwind) and set up the proxy.

The typical project structure would be something like:

```
src/
├── ContosoUniversity/          # Legacy .NET Framework app (reference only)
├── ContosoUniversity.Api/      # .NET 9 backend
└── ContosoUniversity.Web/      # React frontend
```

### Milestone 6: CRUD Pages

Build pages that match the legacy app's functionality — this is a faithful migration, not a redesign.

**Students:**
- List page with search input, sortable column headers, and pagination
- Create/edit form (modal or separate page — your choice)
- Delete with confirmation

**Courses:**
- List page with department filter
- Create/edit with image upload for teaching materials
- Display uploaded teaching material images

**Instructors:**
- List showing office assignment and assigned courses
- Edit with course assignment (checkboxes or multi-select — same as legacy)

**Departments:**
- List and create/edit forms
- Concurrency conflict handling (show a user-friendly message when a conflict is detected)

**Enrollment statistics:**
- A page showing enrollment counts grouped by date

**How to verify:** Navigate through the app — create, edit, and delete entities. Compare behavior against the legacy app. All operations from the original should work.

### Milestone 7: Real-Time Notifications

Connect to the SSE endpoint to show notifications in real time.

- Use the browser's built-in `EventSource` API to connect to the SSE endpoint
- Display notifications as toast messages (top-right corner, auto-dismiss after a few seconds)
- Notifications should appear when *any* CRUD operation happens

**How to verify:** Open the app in two browser tabs. Create a student in one tab — the notification should appear in both.

---

## Working With Spec Kit During Implementation

- **One task at a time** — don't try to implement everything at once
- **Build after each task** — catch errors early rather than accumulating them
- **Edit the generated code** — Copilot won't get everything right. Review what it generates and adjust.
- **Update tasks.md** — If you discover something the plan missed, add it. The artifacts are living documents.
- **Use Copilot Chat alongside Spec Kit** — For debugging build errors, regular chat is faster than going through the spec workflow

> **Stuck on a build error?** Paste the error into Copilot Chat. Include the relevant code file for context.

> **Behind schedule?** Focus on Part A first — having a working API with Swagger is the most important. For the frontend, even a basic scaffold with one working CRUD page demonstrates the pattern. A checkpoint branch will be available to catch up before Lab 5.

> **Ahead of schedule?** Move on to Lab 5 and start adding new features.

---

## Summary

By now you should:

- [x] Have a .NET 9 Web API with EF Core 9 + SQLite and seeded data
- [x] Have REST endpoints for all entities testable via Swagger UI
- [x] Have SSE notifications and file storage working
- [x] Have a Vite + React + TypeScript + TailwindCSS frontend running
- [x] Have CRUD pages matching the legacy app's functionality
- [x] Have real-time notifications displayed in the browser
- [x] Have a fully working "as-is" migration — same features, modern stack

**Next up:** [Lab 5 — New Features](lab5-new-features.md) where we go beyond what the legacy app could do.
