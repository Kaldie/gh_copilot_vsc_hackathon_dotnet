# Lab 4 — Instructor Guide: Execute the Migration

> This is the instructor companion to [student/lab4-execute-migration.md](../student/lab4-execute-migration.md).  
> It contains milestone verification steps, common errors, troubleshooting, and talking points.

---

## Key Teaching Goals

1. **Spec Kit implementation workflow** — Using `/speckit.implement` to execute tasks one at a time
2. **Reviewing AI-generated code** — Copilot won't get everything right. Students must read, understand, and fix.
3. **Incremental building** — Build and test after every milestone, don't accumulate errors
4. **Full-stack thinking** — Backend and frontend are connected; proxy config, CORS, and API contracts matter

---

## Timing Guide

This is the longest lab (90 min). Participants who get stuck early can fall behind fast.

| Part | Target Time | Minimum Viable |
|------|-------------|----------------|
| Part A: Milestone 1 (scaffold + data) | 20 min | Must complete |
| Part A: Milestone 2 (API controllers) | 20 min | Must complete |
| Part A: Milestone 3 (SSE) | 10 min | Can simplify |
| Part A: Milestone 4 (file storage) | 10 min | Can skip |
| Part B: Milestone 5 (React scaffold) | 10 min | Must complete |
| Part B: Milestone 6 (CRUD pages) | 15 min | At least 1 entity |
| Part B: Milestone 7 (notifications) | 5 min | Can skip |

**Rule of thumb:** If someone doesn't have `dotnet build` succeeding by minute 25, intervene.

---

## Part A: Backend — Common Issues & Fixes

### Milestone 1: Project Scaffold & Data Layer

**Most common errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `dotnet build` — missing package references | Copilot forgot a NuGet package | `dotnet add package Microsoft.EntityFrameworkCore.Sqlite` (or similar) |
| SQLite file not created | `Database.EnsureCreated()` not called | Add to `Program.cs`: `using var scope = app.Services.CreateScope(); scope.ServiceProvider.GetRequiredService<SchoolContext>().Database.EnsureCreated();` |
| Seeding fails with duplicate key | DbInitializer tries to insert when data exists | Add `if (context.Students.Any()) return;` guard |
| TPH inheritance mapping issues | EF Core 9 handles discriminator differently | Ensure `modelBuilder.Entity<Person>().HasDiscriminator<string>("Discriminator").HasValue<Student>("Student").HasValue<Instructor>("Instructor");` |
| `InvalidOperationException` on navigation properties | Missing `Include()` calls or misconfigured relationships | Check that `OnModelCreating` configures all relationships explicitly |

**Sample prompt if stuck:**

```
I'm building a .NET 9 Web API with EF Core 9 and SQLite. I have these 
entity models from the legacy app: [paste models]. Configure the DbContext 
with TPH inheritance for Person → Student/Instructor, and add database 
seeding in Program.cs.
```

**Talking point:** "Notice that Copilot knows EF Core patterns well, but it sometimes generates EF Core 6 or 7 patterns instead of 9. Always check the package versions and API surface."

### Milestone 2: API Controllers

**Common issues:**

| Error | Cause | Fix |
|-------|-------|-----|
| 404 on all endpoints | Missing `app.MapControllers()` or `[ApiController]`/`[Route]` attributes | Check `Program.cs` pipeline and controller attributes |
| Swagger UI empty | OpenAPI not configured | Ensure `builder.Services.AddOpenApi()` and `app.MapOpenApi()` |
| Student search doesn't work | Query parameters not bound correctly | Use `[FromQuery]` attributes on action parameters |
| Concurrency not working on Department | `[Timestamp]` or `[ConcurrencyCheck]` missing on `RowVersion` | Add attribute and ensure `byte[]` type for SQLite compatibility |
| Many-to-many Course-Instructor broken | EF Core 9 needs explicit join entity or `UsingEntity()` | Configure in `OnModelCreating` |

**Verification script for facilitators:**

```bash
# Quick smoke test once the API is running
curl -s http://localhost:5000/api/students | head -c 200
curl -s http://localhost:5000/api/courses | head -c 200
curl -s http://localhost:5000/api/instructors | head -c 200
curl -s http://localhost:5000/api/departments | head -c 200
```

### Milestone 3: SSE Notifications

This is the trickiest backend milestone. Key architecture:

```
Controller action
    → INotificationService.Send(message)
        → Channel<string>.Writer.WriteAsync(message)

BackgroundService (NotificationBroadcaster)
    → Channel<string>.Reader.ReadAllAsync()
        → Write to all connected SSE clients

SSE Endpoint (GET /api/notifications/stream)
    → Response.ContentType = "text/event-stream"
    → Await notifications from broadcaster
    → Write "data: {message}\n\n" format
```

**Common issues:**

| Error | Cause | Fix |
|-------|-------|-----|
| SSE endpoint returns immediately | Response not kept open / not flushing | Must use `while (!cancellationToken.IsCancellationRequested)` loop with `await Response.Body.FlushAsync()` |
| Only one client gets notifications | Using a single Channel instead of broadcasting | Need a list of connected clients or use `Channel<T>` per client |
| Notifications fire but SSE is empty | Controller not calling notification service | Verify DI injection and `SendNotification()` call after each CRUD operation |

**If participants are struggling:** SSE can be simplified to a basic version that works for one client. The broadcast pattern is nice-to-have.

### Milestone 4: File Storage

Straightforward — least likely to cause problems.

```csharp
// The key interface
public interface IStorageService
{
    Task<string> SaveFileAsync(IFormFile file, CancellationToken ct = default);
    Task<Stream?> GetFileAsync(string path, CancellationToken ct = default);
    Task DeleteFileAsync(string path, CancellationToken ct = default);
}
```

**Common issue:** Static file serving not configured. Need `app.UseStaticFiles()` or a dedicated endpoint to serve uploaded files.

---

## Part B: Frontend — Common Issues & Fixes

### Milestone 5: React Scaffold

**Quick setup commands (if Copilot generates something different, these are the reliable ones):**

```bash
npm create vite@latest ContosoUniversity.Web -- --template react-ts
cd ContosoUniversity.Web
npm install
npm install -D tailwindcss @tailwindcss/vite
```

**Proxy configuration (vite.config.ts):**

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'  // adjust port to match backend
    }
  }
})
```

**Common issues:**

| Error | Cause | Fix |
|-------|-------|-----|
| CORS errors in browser | No CORS policy on backend | Add `builder.Services.AddCors()` and `app.UseCors()` with appropriate policy, OR use the Vite proxy (preferred) |
| Tailwind classes not working | PostCSS/Tailwind not configured | Ensure `@import "tailwindcss"` in `index.css` (Tailwind v4 syntax) |
| `npm run dev` fails | Node.js not installed or wrong version | `node --version` — need 20+ |

### Milestone 6: CRUD Pages

**Key pattern to establish early:**

```typescript
// API client pattern — encourage participants to create a shared API layer
const API_BASE = '/api';

export async function getStudents(params?: { search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  const res = await fetch(`${API_BASE}/students?${query}`);
  return res.json();
}
```

**If participants are short on time:** Have them focus on one entity (Students) with full CRUD. The pattern is the same for all entities — once one works, the others are repetitive.

### Milestone 7: SSE Notifications

**The EventSource pattern:**

```typescript
useEffect(() => {
  const source = new EventSource('/api/notifications/stream');
  source.onmessage = (event) => {
    // Show toast notification
    setNotifications(prev => [...prev, event.data]);
  };
  return () => source.close();
}, []);
```

**Common issue:** EventSource reconnects automatically on disconnect, which can cause duplicate connections. Not critical for the workshop.

---

## Intervention Triggers

Watch for these signals and step in:

| Signal | Intervention |
|--------|-------------|
| "dotnet build" still failing after 30 min | Sit with them, check error messages, likely a missing package or namespace |
| Generated code has `using System.Web` | Copilot is generating .NET Framework code — remind it this is .NET 9 |
| Student has API working but no frontend at minute 60 | Suggest skipping Milestone 4 (file storage) and jumping to Part B |
| Student's React app won't start | Usually Node.js version or missing `npm install` |
| Student is hand-writing everything instead of using Copilot | Gently redirect: "Try asking Copilot to generate the Courses controller — compare the result with what you wrote" |

---

## Talking Points During the Lab

**At ~30 min (after Milestone 2):** "Who has Swagger UI working? What does your API surface look like? Any surprises in what Copilot generated?"

**At ~60 min (starting Part B):** "Notice how much faster the frontend goes when you have a working API — Copilot can see the endpoints and generate components that match."

**At ~80 min (wrapping up):** "If your app isn't fully working yet, that's okay. The goal is the *process* — how you used Spec Kit to plan, how you reviewed Copilot's output, what you had to fix manually."

---

## Checkpoint Branch

Provide a `lab5-start` checkpoint branch that has:
- Working .NET 9 API with all endpoints
- React frontend with basic CRUD for all entities  
- SSE notifications connected
- File upload working

This lets participants who fell behind start Lab 5 from a clean state.

---

## Wrap-Up Checklist

Before moving to Lab 5, verify that participants:

- [ ] Have a running .NET 9 API (at minimum: `dotnet build` succeeds, Swagger loads)
- [ ] Have at least a React project scaffolded with one CRUD page working
- [ ] Understand the `/speckit.implement` workflow
- [ ] Have experienced reviewing and fixing Copilot-generated code

**If participants are behind:** Point them to the checkpoint branch. Lab 5 is creative/exploratory, so starting from a working baseline is important.

**If participants are ahead:** Encourage them to refine their CRUD pages (add loading states, error handling, nicer UI) or start thinking about which Lab 5 feature they want to build.
