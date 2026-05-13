# GitHub Copilot Workshop

A hands-on, full-day workshop where participants learn to use **GitHub Copilot** effectively in VS Code. The use case is modernizing a legacy .NET app, but the real focus is on developing practical Copilot skills — prompt engineering, chat techniques, agent mode, and iterating with AI assistance across a real codebase.

## What's in This Repo

| Folder | What's Inside |
|--------|---------------|
| `student/` | **Start here.** Lab instructions that guide you through the workshop |
| `src/ContosoUniversity/` | The legacy .NET Framework 4.8.2 app you'll be working with |
| `scripts/` | Helper scripts (e.g. building and running the legacy app) |

> The `src/` folder is where you'll spend most of your time. As you progress through the labs, you'll use Copilot to understand, plan, build, and extend a modern version of the app alongside the legacy code.

## Getting Started

1. **Fork** this repository to your own GitHub account
2. **Clone** your fork locally
3. Open the repo in **VS Code** with GitHub Copilot enabled
4. Head to the [`student/`](student/) folder and start with [Lab 1](student/lab1-copilot-quickstart.md)

## The Use Case: ContosoUniversity

The source application is a university management system (ASP.NET MVC 5 on .NET Framework 4.8.2) with CRUD operations for Students, Courses, Instructors, and Departments. Throughout the workshop you'll use Copilot to understand this legacy codebase, plan a modernization, execute the migration to a .NET 9 API + React SPA, and add new features — all driven by AI-assisted development.

## Prerequisites

- **VS Code** with GitHub Copilot extension (active license)
- **Docker Desktop** or **Docker Engine + Compose** (primary build/check path in this workshop)
- **.NET 10 SDK** or newer (for containerized C# build/check tasks)
- **Node.js 20+** and **npm** (React frontend)
- **Windows + Visual Studio 2022 / Build Tools / LocalDB / IIS Express** only if you want to run the legacy app natively instead of using Docker

## Build And Test Route (Important)

For this workshop repo, treat **Docker** as the default and authoritative build/test path.

- Do not assume a local `dotnet` SDK is installed on the host machine.
- Use containerized checks first:
	- `docker compose -f docker-compose.yml --profile ci run --rm build-check`
- Start the app stack with:
	- `docker compose -f docker-compose.yml up -d sql api web`

Notes:

- The legacy app under `src/ContosoUniversity` is Windows-only for native execution.
- The Docker CI script intentionally validates the modern code path and skips legacy native build requirements.

## For Workshop Facilitators

- **Instructor guides**: See the [`instructors/`](instructors/) folder for lab companions with sample prompts, expected answers, and talking points
- **`.copilotignore`**: The `student/` and `instructors/` folders should be excluded so that `@workspace` queries only index the source code — not the lab instructions