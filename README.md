# GitHub Copilot Workshop: .NET App Modernization

A hands-on, full-day workshop where participants use GitHub Copilot in VS Code to modernize a legacy .NET Framework 4.8.2 application into a .NET 9 API + React SPA.

## Workshop App: ContosoUniversity

The source application is a university management system (ASP.NET MVC 5 on .NET Framework 4.8.2) with CRUD operations for Students, Courses, Instructors, and Departments. It includes realistic on-prem dependencies: SQL Server LocalDB, MSMQ notifications, and local file system uploads.

**Modernization targets (no Azure subscriptions required):**

| Legacy | Modernized |
|---|---|
| .NET Framework 4.8.2 / ASP.NET MVC 5 | .NET 9 Web API + Vite/React/TypeScript SPA |
| Razor views (server-rendered) | React components + TailwindCSS |
| Old-style `.csproj` + `packages.config` | SDK-style `.csproj` + PackageReference |
| `Web.config` + `Global.asax` | `appsettings.json` + `Program.cs` (minimal hosting) |
| Entity Framework on SQL Server LocalDB | Entity Framework Core 9 + SQLite |
| MSMQ notifications + browser polling | Server-Sent Events (SSE) for real-time push |
| Local file uploads (inline in controller) | Local file system behind `IStorageService` abstraction |

## Repository Structure

```
├── .github/
│   ├── agents/                     # Spec Kit agent definitions
│   └── prompts/                    # Spec Kit prompt files
├── .specify/                       # Spec Kit configuration & templates
├── instructors/                    # Instructor guides with sample prompts & answers
│   ├── lab2-understand-legacy.md
│   ├── lab3-plan-modernization.md
│   ├── lab4-execute-migration.md
│   └── lab5-new-features.md
├── scripts/
│   └── run-legacy-app.ps1          # Build & run the legacy app
├── student/                        # Student-facing lab instructions
│   ├── lab1-copilot-quickstart.md
│   ├── lab2-understand-legacy.md
│   ├── lab3-plan-modernization.md
│   ├── lab4-execute-migration.md
│   └── lab5-new-features.md
├── src/
│   └── ContosoUniversity/          # Legacy .NET Framework app
└── README.md
```

> **Note:** The `student/` and `instructors/` folders will be excluded via `.copilotignore` (added as a final step) so that `@workspace` queries only index the source code — not the lab instructions.

## Prerequisites

- **VS Code** with GitHub Copilot extension (active license)
- **Visual Studio 2022** or Build Tools (to build/run the legacy app)
- **.NET 9 SDK** (modernization target)
- **Node.js 20+** and **npm** (React frontend)
- **SQL Server LocalDB** (included with Visual Studio — for the legacy app only)
- **IIS Express** (included with Visual Studio — for the legacy app only)

## Agenda (~7.5 hours)

### Morning — Foundations & Legacy Exploration (3h)

| Time | Block | Duration | Description |
|---|---|---|---|
| 09:00 | **Welcome & Setup** | 30 min | Introductions, verify prerequisites, overview of the day |
| 09:30 | **Demo: Copilot Feature Tour** | 30 min | Chat, Inline Chat, Completions, Agent mode, model picker, custom instructions, prompt engineering tips |
| 10:00 | **[Lab 1: Copilot Quick Start](student/lab1-copilot-quickstart.md)** | 30 min | Hands-on: completions, chat, inline chat on a small exercise |
| 10:30 | *Break* | 15 min | |
| 10:45 | **[Lab 2: Understand the Legacy Codebase](student/lab2-understand-legacy.md)** | 60 min | Run the legacy app, use `@workspace` to explore architecture, map dependencies, identify migration challenges |
| 12:00 | *Lunch* | 60 min | |

### Afternoon — Modernization with Copilot (4h 30min)

| Time | Block | Duration | Description |
|---|---|---|---|
| 13:00 | **[Lab 3: Plan the Modernization](student/lab3-plan-modernization.md)** | 60 min | Spec Kit workflow: constitution → specify → plan → tasks. Define the API + React architecture. |
| 14:00 | *Break* | 15 min | |
| 14:15 | **[Lab 4: Execute the Migration](student/lab4-execute-migration.md)** | 90 min | Build the full app: .NET 9 API + React frontend reproducing all legacy functionality. **Milestone: full app running** |
| 15:45 | *Break* | 15 min | |
| 16:00 | **[Lab 5: New Features](student/lab5-new-features.md)** | 60 min | Add features beyond the legacy app: drag-and-drop, calendar view, dashboard, dark mode |
| 17:00 | **Wrap-up & Showcase** | 30 min | Demo results, compare approaches, key takeaways, Q&A |
| 17:30 | *End* | | |

## For Workshop Facilitators

- **Instructor guides**: See the `instructors/` folder for lab companions with sample prompts, expected answers, and talking points
- **Checkpoint branches**: Create `lab3-start`, `lab4-start`, `lab5-start` branches so participants can catch up if they fall behind
- **Pre-install script**: Consider providing a PowerShell script that validates all prerequisites