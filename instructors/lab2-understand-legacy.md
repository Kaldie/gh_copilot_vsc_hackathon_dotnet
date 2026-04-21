# Lab 2 — Instructor Guide: Understand the Legacy Codebase

> This is the instructor companion to [student/lab2-understand-legacy.md](../student/lab2-understand-legacy.md).  
> It contains sample prompts, expected Copilot responses, and talking points for guiding participants.

---

## Part 1: Running the App — Troubleshooting Notes

Common issues participants may hit:

| Problem | Fix |
|---------|-----|
| `vswhere.exe` not found | Build Tools not installed. Download from [VS Downloads](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022). |
| NuGet restore fails | Ensure internet access. Corporate firewalls may block `nuget.org`. |
| Port 5555 in use | Kill existing IIS Express: `Get-Process iisexpress \| Stop-Process -Force` |
| Database creation fails | Verify LocalDB: `SqlLocalDB.exe start MSSQLLocalDB` |
| 500 error on Create/Edit pages | Should be fixed already (locale-dependent DateTime Range attributes were removed). |

**Tip for participants:** Encourage them to paste error messages into Copilot Chat — this is itself a learning exercise.

---

## Part 2: Codebase Exploration — Sample Prompts & Expected Answers

Use these prompts if participants get stuck or if you want to demonstrate live. The goal is for participants to formulate their own questions, but these serve as a fallback and as a facilitator script.

### Area 1: High-Level Architecture

**Sample prompts:**
```
I want to understand the Contoso University app that is in the .src folder. Can you explain the architecture of this application. What framework is it 
built on, what patterns does it use, and what are the main components?
```

```
What are all the external dependencies this application has? 
List the infrastructure it needs to run (database, messaging, file system, etc.)
```

**Key points Copilot should surface:**
- ASP.NET MVC 5 on .NET Framework 4.8.2
- Entity Framework Core 3.1.32 (unusual — EF Core running on .NET Framework!)
- MSMQ for notifications
- SQL Server LocalDB for data
- Local file system for teaching material uploads
- No dependency injection — controllers create their own dependencies via `BaseController`

---

### Area 2: Data Model

**Sample prompts:**
```
Describe the database model. What entities exist, how are they 
related, and what inheritance strategy is used?
```

```
What does the DbInitializer do? How is the database seeded?
```

**Key points Copilot should surface:**
- TPH (Table Per Hierarchy) inheritance: `Person` → `Student` / `Instructor`
- Many-to-many: Instructors ↔ Courses via `CourseAssignment`
- One-to-one: Instructor → `OfficeAssignment`
- Optimistic concurrency on `Department` via `RowVersion`
- `Notification` entity stored in the database
- `DbInitializer` seeds students, instructors, courses, departments, enrollments, and course assignments

**Talking point:** The TPH inheritance means both `Student` and `Instructor` inherit from `Person` and share the same database table. This is relevant during migration because EF Core 9 handles TPH differently from EF Core 3.1 in some edge cases.

---

### Area 3: Notification System (Most Complex)

**Sample prompts:**
```
How does the notification system work? Trace the flow from when a 
user creates a student to when the notification appears in the browser.
```

```
Show me the NotificationService class. How does it use MSMQ? 
What happens if MSMQ is not available?
```

**Expected flow:**
1. User submits a form → Controller action runs (e.g., `StudentsController.Create`)
2. After save, `BaseController.SendEntityNotification()` is called
3. `NotificationService.SendNotification()` saves to DB and sends to MSMQ (or in-memory queue)
4. Browser-side `notifications.js` polls `NotificationsController.GetRecent()` every 5 seconds
5. `NotificationsController` calls `NotificationService.GetRecentNotifications()` which reads from MSMQ (or in-memory queue)
6. Notifications render as toast popups

**Key files:**
- `Services/NotificationService.cs` — MSMQ send/receive with in-memory fallback
- `Controllers/BaseController.cs` — every controller inherits this
- `Controllers/NotificationsController.cs` — JSON endpoint polled by frontend
- `Scripts/notifications.js` — polls every 5 seconds

**Talking point:** This is the most interesting migration target because MSMQ is a Windows-only technology. We'll replace it with `Channel<T>` + `BackgroundService` — a modern, cross-platform, in-process alternative that's built into .NET.

---

### Area 4: File Upload System

**Sample prompts:**
```
How does the teaching material file upload work in the Courses 
controller? Where are files stored and how are they referenced?
```

**Key points Copilot should surface:**
- `Server.MapPath("~/Uploads/TeachingMaterials/")` — ASP.NET Framework-specific API
- `HttpPostedFileBase` — the legacy file upload type
- Files stored on local disk, path saved in `Course.TeachingMaterialImagePath`
- No abstraction layer — file system access is inline in the controller

**Talking point:** In ASP.NET Core, `HttpPostedFileBase` becomes `IFormFile`, and `Server.MapPath()` becomes `IWebHostEnvironment.WebRootPath`. We'll also add an `IStorageService` abstraction so the storage backend could be swapped later (e.g., to Azure Blob Storage).

---

### Area 5: Migration Challenges

**Sample prompts:**
```
What would be the main challenges in migrating this application 
from .NET Framework 4.8 to .NET 9? List specific classes and patterns that 
would need to change.
```

```
Which namespaces and APIs used in this project don't exist in 
ASP.NET Core? List them with their ASP.NET Core replacements.
```

**Migration mapping participants should identify:**

| Legacy Pattern | Migration Target |
|---|---|
| `System.Web.Mvc` namespace | `Microsoft.AspNetCore.Mvc` |
| `Global.asax` + `Application_Start` | `Program.cs` with minimal hosting |
| `Web.config` connection strings & app settings | `appsettings.json` |
| `packages.config` + old `.csproj` | SDK-style `.csproj` + PackageReference |
| `HttpPostedFileBase` | `IFormFile` |
| `Server.MapPath()` | `IWebHostEnvironment.WebRootPath` |
| `System.Messaging` (MSMQ) | `Channel<T>` + `BackgroundService` |
| `ConfigurationManager` | `IConfiguration` via DI |
| No dependency injection | Built-in DI in ASP.NET Core |
| `BaseController` manual instantiation | Constructor injection |

**Talking point:** This table is essentially the work plan for Labs 3-5. If participants identified most of these on their own, they're well prepared for the migration.

---

---

## Bridge to Planning Session

Optionally use some tools to visualize the architecture and data model. Mermaid is probably the easiest.
There is a sample `migration-inventory.md` in the instructors folder with these.

---

## Wrap-Up Checklist

Before moving to Lab 3, verify that participants:

- [ ] Have the app running and have explored the UI
- [ ] Can articulate the tech stack (ASP.NET MVC 5, EF Core 3.1, MSMQ, LocalDB)
- [ ] Understand the notification flow end-to-end
- [ ] Have identified at least 5-6 concrete migration challenges
- [ ] Feel comfortable using `@workspace` in Copilot Chat

**If participants are ahead:** Ask them to explore the `.github/agents/` and `.specify/` folders to understand how Spec Kit is configured for the project.

**If participants are behind:** Have them focus on Areas 1 and 5 (architecture overview and migration challenges) — these are the most critical for Labs 3-5.
