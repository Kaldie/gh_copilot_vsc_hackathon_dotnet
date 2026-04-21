# Lab 3 — Instructor Guide: Plan the Modernization

> This is the instructor companion to [student/lab3-plan-modernization.md](../student/lab3-plan-modernization.md).  
> It contains sample prompts, expected outputs, common pitfalls, and talking points.

---

## Key Teaching Goals

1. **Spec-driven development** — Working through a structured workflow (constitution → specify → plan → tasks) rather than "just ask Copilot to do everything"
2. **Project constitution** — Setting ground rules before diving into requirements
3. **Communicating requirements to AI** — Students must translate the requirement list into their own words for the spec. This is a critical skill: the AI only knows what you tell it.
4. **Reviewing AI-generated plans critically** — The artifacts won't be perfect. Students should catch gaps and refine.

---

## Before the Lab: Prep Check

> **Did you test locally?** The constitution at `.specify/memory/constitution.md` is a committed placeholder template. If you ran `/speckit.constitution` during your own testing, **reset it before the workshop**:
> ```powershell
> git checkout -- .specify/memory/constitution.md
> ```
> Generated feature artifacts (spec, plan, tasks) land in `specs/` which is `.gitignore`'d — those are safe.

## Before the Lab: Quick Spec Kit Demo (5 min)

Walk through the Spec Kit concept on the projector:

1. Show the `.github/agents/` and `.github/prompts/` folders — explain these configure Spec Kit
2. Show the `.specify/` folder — point out the constitution template and memory folder
3. Open Copilot Chat, type `/speckit.` and show the autocomplete for `constitution`, `specify`, `plan`, `tasks`, `implement`, `clarify`, `checklist`, `analyze`
4. Explain the flow: **constitution → specify → plan → tasks → (implement in Lab 4)**
5. Emphasize: "The artifacts are living documents — you can and should edit them"

---

## Step 1: Constitution — What to Watch For

The constitution is new to most participants. Key points to convey:

- It sets **project-wide rules** that Spec Kit follows across all artifacts
- It's the place to encode decisions like "legacy code is read-only" and "new code goes in separate projects"
- It only needs to be done once per project

### Sample Prompt for `/speckit.constitution`

```
/speckit.constitution This is a modernization of a legacy .NET Framework app.
The legacy code in src/ContosoUniversity/ must not be modified — it stays as a
reference. New backend code goes in src/ContosoUniversity.Api/ and new frontend
code goes in src/ContosoUniversity.Web/. We follow clean architecture principles.
All code must be async. No external cloud services — everything runs locally
with just .NET 9 SDK and Node.js. Nullable reference types enabled.
```

### Why Subfolders (Not a Branch)

Participants may ask why we create new projects alongside the legacy app instead of modifying it on a branch. The reasons:

1. **Reference access** — Copilot can see the legacy code via `@workspace` while generating the new code. This produces better results.
2. **Side-by-side comparison** — You can run both apps simultaneously for the showcase.
3. **Simpler git workflow** — No merge conflicts or branch management during the workshop.
4. **Realistic pattern** — Many real modernizations build new services alongside legacy ones (strangler fig pattern).

---

## Step 2: Specification — What to Watch For

### Common Mistakes

| Problem | How to spot it | What to say |
|---------|---------------|-------------|
| Copy-pasting the requirements verbatim | `spec.md` reads like a bullet list | "Contextualize these with what you learned about the app in Lab 2. What are the specific challenges for *this* codebase?" |
| Missing the architecture split (API + SPA) | `spec.md` describes a monolithic MVC app | "Check requirements 10-12 — the architecture has two parts" |
| Modifying legacy code instead of creating new projects | Plan says "update the .csproj" of the legacy app | "Check your constitution — the legacy code is read-only. New projects go in `src/ContosoUniversity.Api/` and `src/ContosoUniversity.Web/`" |
| Vague on notification mechanism | `spec.md` says "real-time notifications" without specifying SSE | "Requirement 14 is very specific about *how* notifications should work" |
| Forgetting database seeding | No mention of seed data | "Requirement 9 — the app needs to work out of the box" |
| Not mentioning concurrency | Departments have optimistic concurrency | "What about requirement 5? How will that affect the Department entity?" |

### Sample Prompt for `/speckit.specify`

If a participant is stuck, suggest something like:

```
/speckit.specify

Modernize the ContosoUniversity application from .NET Framework 4.8.2 to a 
modern architecture with a .NET 9 Web API backend and a Vite + React + 
TypeScript frontend styled with TailwindCSS.

The legacy app is an ASP.NET MVC 5 app with 7 controllers managing Students, 
Courses, Instructors, and Departments. It uses EF Core 3.1 on SQL Server LocalDB, 
MSMQ for notifications (with polling from the browser), and local file uploads 
via Server.MapPath().

Requirements for the modernized app:
- All CRUD operations preserved with same validation rules
- Students list: search, sort, and pagination
- Instructor-Course many-to-many assignment preserved
- Office assignments (one-to-one with Instructor)
- Department concurrency handling (optimistic concurrency)
- Enrollment statistics page
- Teaching material image upload via IStorageService abstraction
- Real-time notifications via Server-Sent Events (SSE) — no SignalR, no 
  WebSockets, no polling
- Database seeding on first run
- EF Core 9 + SQLite (no SQL Server dependency)
- Channel<T> + BackgroundService for internal notification queue
- appsettings.json instead of Web.config
- Built-in DI throughout
- Async all the way, nullable reference types enabled
- Must run with only .NET 9 SDK and Node.js installed
```

> **Note:** A good spec prompt is 20-30 lines, not 3. This is a key teaching moment — more context = better output.

### What a Good `spec.md` Should Contain

- Clear description of current state (legacy stack, dependencies)
- Target architecture (API + SPA, with explicit tech choices)
- New backend project created in `src/ContosoUniversity.Api/` (not modifying legacy code)
- New frontend project created in `src/ContosoUniversity.Web/`
- All 9 functional requirements mapped to specific entities/features
- All technical constraints (SQLite, SSE, IStorageService, etc.)
- Acceptance criteria that are testable ("Swagger UI shows all endpoints", "SSE endpoint streams events")

---

## Step 2: Plan — What to Watch For

### Expected Plan Structure

A good `plan.md` should have phases roughly like:

1. **Backend scaffold** — .NET 9 project, EF Core 9, SQLite, models, DbContext, seeding
2. **API controllers** — CRUD endpoints for all entities, search/sort/pagination
3. **Notification system** — Channel<T>, BackgroundService, SSE endpoint
4. **File storage** — IStorageService abstraction, local implementation
5. **Frontend scaffold** — Vite + React + TypeScript + TailwindCSS, proxy config
6. **Frontend pages** — CRUD pages for all entities, matching legacy functionality
7. **Frontend notifications** — EventSource connection, toast display

### Common Issues

| Problem | Fix |
|---------|-----|
| Plan puts frontend before backend | Backend should come first — the frontend needs API endpoints to call |
| Plan modifies legacy code | New projects alongside, not in-place modification |
| Plan has one giant "implement everything" step | Should be broken into smaller phases (data layer → controllers → notifications → frontend) |
| Plan doesn't mention proxy configuration | The React dev server needs to proxy API calls to the .NET backend |
| Plan includes Azure deployment | Out of scope — we're running locally only |

### Talking Point

"Notice how the plan creates a dependency chain: data layer → API → frontend. Each layer depends on the one below it. This ordering is important — it means you can test each layer independently as you build it."

---

## Step 3: Tasks — What to Watch For

### Quality Checks for `tasks.md`

- [ ] Tasks are granular (each takes ~5-15 min, not 60 min)
- [ ] Clear ordering with dependencies stated
- [ ] First task creates new project(s) in `src/` (not modifying legacy)
- [ ] Backend tasks come before frontend tasks
- [ ] Each task has a verifiable outcome (build succeeds, endpoint returns data, etc.)
- [ ] Both backend and frontend are covered
- [ ] No tasks for out-of-scope work (deployment, CI/CD, unit tests — unless students added them)

### Bonus: Validate with `/speckit.analyze`

If students have time, suggest running `/speckit.analyze` to check consistency across all three artifacts. This catches mismatches like the plan referencing requirements not in the spec.

### Common Issue: Too Few Tasks

If `tasks.md` has only 5-6 items, each one is probably too large. Ask the student:

"Could you break task 3 into smaller steps? What's the first thing you'd actually do to accomplish it?"

Then use `/speckit.clarify` or manually edit `tasks.md`.

---

## Timing Guide

| Activity | Target Time | Notes |
|----------|-------------|-------|
| Spec Kit intro / demo | 5 min | Keep brief — they learn by doing |
| Step 1: Constitution | 5 min | Quick but important — sets the ground rules |
| Step 2: Specification | 20 min | Longest part — writing a good prompt takes thought |
| Step 3: Plan | 15 min | Mostly review and refinement |
| Step 4: Tasks + validate | 15 min | Mostly review and refinement |

If participants finish early, encourage them to:
- Run `/speckit.clarify` to find gaps
- Run `/speckit.analyze` to validate cross-artifact consistency
- Manually edit `tasks.md` to add more detail
- Compare their spec with a neighbor

---

## Bridge to Lab 4

Before moving on, do a brief group check-in (~5 min):

1. "How many tasks does everyone have?" (Expect 15-30)
2. "Did anyone's plan have a different ordering than backend-first?"
3. "What was the hardest requirement to specify clearly?"

**Transition:** "Now we execute. In Lab 4, you'll use `/speckit.implement` to work through your tasks. Remember — the tasks are a guide, not a script. You'll need to review what Copilot generates and adjust."

---

## Wrap-Up Checklist

Before moving to Lab 4, verify that participants:

- [ ] Have `constitution.md` at `.specify/memory/constitution.md` (filled in, not placeholder)
- [ ] Have `spec.md`, `plan.md`, and `tasks.md` in their `specs/` folder
- [ ] The constitution establishes legacy code as read-only and new projects in `src/`
- [ ] The spec captures the API + React architecture
- [ ] The plan has a logical ordering (backend before frontend)
- [ ] Tasks are granular enough to execute individually
- [ ] Participants understand they'll use `/speckit.implement` next

**If participants are behind:** The spec is the most important artifact. If they only have `spec.md`, they can generate plan + tasks at the start of Lab 4.

**If participants are ahead:** Have them start reviewing the legacy code for specific migration challenges they expect (e.g., the TPH inheritance mapping, the MSMQ notification flow).
