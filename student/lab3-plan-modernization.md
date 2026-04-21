# Lab 3: Plan the Modernization with Spec Kit

**Duration:** 60 minutes  
**Goal:** Use Spec Kit to create a structured modernization plan for the ContosoUniversity application. By the end, you should have reviewed `spec.md`, `plan.md`, and `tasks.md` artifacts that define the full migration.

---

## From Chat to Spec-Driven Development

In Lab 2 you used Copilot Chat to explore and understand the codebase. That works well for Q&A, but modernizing an application involves dozens of coordinated changes across many files. If you ask Copilot to "modernize this app" in a single prompt, you'll get a wall of text — but nothing will actually happen in your codebase.

For complex, multi-step work like this, you need **structured planning**. That's where Spec Kit comes in.

### What is Spec Kit?

[Spec Kit](https://github.com/github/spec-kit) is a spec-driven development workflow for GitHub Copilot. It breaks down large tasks into structured artifacts:

| Artifact | Purpose |
|----------|---------|
| `constitution.md` | **Rules** — project-wide principles and constraints that apply to all features |
| `spec.md` | **What** — defines the feature/change, requirements, and acceptance criteria |
| `plan.md` | **How** — technical design, architecture decisions, implementation approach |
| `tasks.md` | **Do** — ordered list of concrete implementation tasks |

The flow is: **constitution → specify → plan → tasks → implement**

Each step builds on the previous one, and the artifacts persist in your repo so you (and Copilot) can reference them throughout the work. Open these files after each step to review what Spec Kit generated.

### Spec Kit is already set up

This repo has Spec Kit pre-configured. You can verify by checking that the Spec Kit prompts appear in your Copilot Chat — look for `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, and `/speckit.tasks`.

> **Don't see them?** Make sure you have the latest VS Code and GitHub Copilot extension. Spec Kit installs via `.github/agents/` and `.github/prompts/` which are already in the repo. See the [Spec Kit quickstart](https://github.github.com/spec-kit/quickstart.html) for details.

---

## Modernization Requirements

Below are the requirements for the modernized application. These define what "done" looks like — and they're your input for Spec Kit.

> **Why predefined requirements?** In a real project, these would come from stakeholders, architects, and operational constraints. We're providing them here so everyone works toward the same goal and we can compare results at the end. The key learning is *how* you use Spec Kit to turn requirements into a plan.

> **Important:** These requirements are NOT available to Copilot — they only exist in this document. You need to communicate them yourself when creating the spec. In a real project, *you* are the one who translates business and technical requirements into a spec that an AI can work with.

### Functional Requirements

1. **All existing CRUD operations must work** — Students, Courses, Instructors, and Departments should support Create, Read, Update, and Delete with the same fields and validation rules as the legacy app.

2. **Search, sort, and pagination** — The Students list must support search by name, column sorting, and pagination.

3. **Instructor-Course assignments** — The many-to-many relationship between Instructors and Courses must be preserved, including the ability to assign/unassign courses when editing an instructor.

4. **Office assignments** — Instructors can have an optional office assignment (one-to-one).

5. **Department concurrency** — Department editing must handle optimistic concurrency (detect when another user has modified the same record).

6. **Enrollment statistics** — A page must show enrollment counts grouped by enrollment date.

7. **Teaching material uploads** — Course creation/editing must support image file uploads for teaching materials, stored on the local file system.

8. **Real-time notifications** — After any create, update, or delete operation, a notification must appear in the browser in real time (no polling, no page reload).

9. **Database seeding** — The application must seed sample data on first run (same entities as the legacy app).

### Architecture Requirements

The modernized application must be split into a **backend API** and a **frontend SPA**:

10. **Backend: .NET 9 Web API** — RESTful API controllers (no Razor views, no server-rendered HTML).

11. **Frontend: Vite + React + TypeScript** — Single-page application with a modern component-based UI.

12. **Styling: TailwindCSS** — Use TailwindCSS for all styling.

### Technical Constraints

13. **No SQL Server:** Use an embedded/file-based database that requires no server installation.

14. **No MSMQ:** Notifications must use Server-Sent Events (SSE) — the backend pushes events over HTTP, the frontend listens with `EventSource`. No SignalR, no WebSockets, no polling.

15. **Swappable file storage:** File uploads must work through an abstraction (e.g., `IStorageService`) so the backend could be changed later without modifying controllers.

16. **Modern configuration:** `appsettings.json` (no `Web.config`).

17. **Dependency injection:** All services registered via built-in DI.

18. **Zero external services:** The complete application must run on a developer machine with nothing installed beyond the .NET 9 SDK and Node.js.

19. **Async all the way:** Controller actions and data access must be async.

20. **Nullable reference types** enabled.

### Project Structure

The modernized application should be built **alongside** the legacy app — not on top of it. Create new projects in `src/`:

```
src/
├── ContosoUniversity/          # Legacy app (don't modify — keep for reference)
├── ContosoUniversity.Api/      # New .NET 9 Web API backend
└── ContosoUniversity.Web/      # New React frontend
```

This means Copilot can always reference the legacy code when generating the new code, and you can run both applications side-by-side to compare behavior.

---

## Step 1: Define the Constitution (5 min)

Before writing the spec, establish the project-wide principles using `/speckit.constitution`. The constitution sets ground rules that Spec Kit will follow across all artifacts.

Think about what principles should guide this modernization. For example:
- Should the modernized app preserve the legacy app's behavior exactly, or is it okay to improve UX?
- What coding standards matter? (async/await, DI, nullable types, etc.)
- What's out of scope? (deployment, CI/CD, authentication)

Use `/speckit.constitution` and provide your principles.

**Open `.specify/memory/constitution.md`** and review it. This file existed as a placeholder template — `/speckit.constitution` replaced the placeholders with your actual principles. This will influence every artifact Spec Kit generates.

## Step 2: Create the Specification (20 min)

Take the requirements above and your `migration-inventory.md` from Lab 2, and use Spec Kit to create a formal specification.

In Copilot Chat, use `/speckit.specify`. Describe the modernization in your own words — include the functional requirements, architecture decisions, and technical constraints. Don't just copy-paste the list above; contextualize it with what you learned about the app in Lab 2.

Once the spec is generated, **open `spec.md`** in your editor and review it critically:
- Does it capture all the requirements?
- Does it accurately describe the current state of the app?
- Are the technology choices explicit (database, notification mechanism, etc.)?
- Does it reference the project structure (new projects alongside legacy)?
- Are there gaps or assumptions?

Use `/speckit.clarify` to identify and resolve any underspecified areas. Optionally, use `/speckit.checklist` to generate a validation checklist for your spec.

## Step 3: Generate the Plan (15 min)

With the spec in place, use `/speckit.plan` to generate an implementation plan.

**Open `plan.md`** and review it:
- Does the ordering make sense? (Backend before frontend? Data layer before API?)
- Are there dependencies between steps that the plan missed?
- Does the plan create new projects in `src/` alongside the legacy app?
- Is the scope realistic?

## Step 4: Generate Tasks and Validate (15 min)

Use `/speckit.tasks` to generate an ordered task list.

**Open `tasks.md`** and review it:
- Are the tasks granular enough to execute one at a time?
- Do they cover both backend and frontend?
- Would you be able to pick up any task and know what to do?
- Is the ordering logical?

Optionally, use `/speckit.analyze` to run a cross-artifact consistency check across your spec, plan, and tasks.

> **Don't start implementing yet.** We'll begin execution in Lab 4. Use the remaining time to refine your spec, plan, and tasks until you're confident the plan is solid.

---

## Summary

By now you should:

- [x] Understand the spec-driven development workflow (constitution → specify → plan → tasks → implement)
- [x] Have a `constitution.md` with project-wide principles
- [x] Have a `spec.md` that captures all requirements and your technology choices
- [x] Have a `plan.md` with a logical implementation approach
- [x] Have a `tasks.md` with ordered, actionable tasks
- [x] Have reviewed all artifacts and refined where needed

**Next up:** [Lab 4 — Execute the Migration](lab4-execute-migration.md) where we build the full modernized application — backend API and React frontend.
