# Lab 2: Understand the Legacy Codebase

**Duration:** 60 minutes  
**Goal:** Run the legacy ContosoUniversity app locally and use GitHub Copilot to build your own understanding of the codebase before migrating it.

---

## Part 1: Validate the Workspace with Docker Compose (15 min)

### Prerequisites

The default path for this workshop is Docker-first, so you do **not** need to install Visual Studio, IIS Express, or LocalDB just to get started.

Make sure you have:

- Docker Desktop or Docker Engine with Compose
- Permission to run Docker without having to stop for a password every time (`docker` group on Linux/WSL, or an elevated shell on Windows)
- Node.js 20+ and npm if you want to explore frontend tooling later

> **Stuck on prerequisites?** Open Copilot Chat and describe what's not working — it can help you troubleshoot Docker or verify your environment.

### Docker-first checks

From the root of the workshop repository, run:

```bash
./scripts/docker/run-compose.sh --profile ci run --rm build-check
```

That containerized check restores packages, builds what it can, and runs any available Node/React checks inside Docker.

If you want the legacy SQL Server container running for experiments, start it with:

```bash
./scripts/docker/run-compose.sh up -d sql
```

> **First load is slow** — the database gets created and seeded with sample data on the first request (10-15 seconds).

> **Something not working?** Ask Copilot! Paste the error message into Copilot Chat and ask it to help you diagnose the issue. This is a great way to practice using Copilot for troubleshooting.

### Explore the Application

Click through the app and get familiar with what it does:

| Page | What to look for |
|------|-----------------|
| **Students** | List with search, sort, and pagination. Try creating and editing a student. |
| **Courses** | List of courses with department assignments. Note the teaching material image upload feature. |
| **Instructors** | Instructors with office assignments and course assignments (many-to-many). |
| **Departments** | Departments with budget and administrator (instructor) assignment. |
| **About** | Enrollment statistics grouped by date. |

<img src="screenshots/lab2-homepage.png" width="600" alt="ContosoUniversity home page" />

<img src="screenshots/lab2-students-list.png" width="600" alt="Students list page with search, sort, and pagination" />

<img src="screenshots/lab2-course-create.png" width="600" alt="Course create page showing the file upload field" />

> **Watch the notifications!** After creating, editing, or deleting any entity, look for notification pop-ups in the top-right corner. These are powered by MSMQ (or an in-memory fallback). This is one of the key things we'll be migrating.

<img src="screenshots/lab2-notification.png" width="600" alt="Notification popup after a CRUD operation" />

When you're done exploring, stop the containers with `./scripts/docker/run-compose.sh down`.

---

## Part 2: Explore the Codebase with Copilot (45 min)

Before migrating any application, you need to inventory and understand the existing codebase. What frameworks and patterns does it use? What are the external dependencies? What will be easy to migrate and what will require significant rework?

In a real migration project, this discovery phase is critical — you can't plan a migration without knowing what you're migrating.

### Your Task

Use GitHub Copilot Chat to build a comprehensive picture of this application. Your goal is to produce a **migration inventory** — a structured overview that covers:

1. **Architecture & frameworks** — What is the tech stack? What patterns does the code follow?
2. **Data model** — What entities exist? How are they related? What database features are used?
3. **External dependencies** — What infrastructure does the app need beyond the code itself (database, messaging, file system, etc.)?
4. **Notification system** — How do notifications flow from a CRUD operation to the browser? This is the most complex subsystem.
5. **File handling** — How are file uploads handled and where are files stored?
6. **Migration risks** — Which APIs, namespaces, and patterns don't exist in .NET 9 / ASP.NET Core? What are the replacements?

### How to Approach This

- Start broad, then drill into specific areas
- Ensure Copilot has the full codebase as context
- Ask follow-up questions when an answer mentions something you want to understand better
- Don't just read the answers — verify them by opening the files Copilot references
- Try to find things Copilot might miss or get wrong

### Deliverable

By the end of this exercise, save your findings as a markdown file — for example `migration-inventory.md` in the repo root. This should be something you could hand to a colleague and say "here's what this app does and what needs to change to move it to .NET 9."

This isn't just a lab exercise — we'll use this inventory as input for creating a formal migration plan with Spec Kit. The better your inventory, the better your plan will be.

---

## Summary

By now you should:

- Have validated the workspace with Docker Compose
- Have explored the application's UI and understood what it does
- Have used Copilot to build your own understanding of the architecture, data model, and dependencies
- Have identified the key migration challenges ahead

**Next up:** [Lab 3 — Plan the Modernization](lab3-plan-modernization.md) where we turn your findings into a formal migration plan with Spec Kit!
