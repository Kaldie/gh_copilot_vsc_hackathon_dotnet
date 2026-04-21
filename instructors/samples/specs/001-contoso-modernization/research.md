# Research: Contoso University Modernization

**Date**: 2026-04-21 | **Feature**: 001-contoso-modernization

## R-001: SQLite Concurrency Tokens for Department Entity

**Context**: The Department entity requires optimistic concurrency control (FR-005). The legacy app uses SQL Server's `rowversion`/`timestamp`. SQLite has no native equivalent.

**Decision**: Use a manually-managed `Guid` concurrency token column.

**Rationale**: EF Core supports concurrency tokens on SQLite via `[ConcurrencyCheck]` or Fluent API `.IsConcurrencyToken()`. Since SQLite lacks auto-updating row versions, the application must set a new `Guid` value on every update. EF Core's `SaveChangesAsync` will include the old token value in the `WHERE` clause, throwing `DbUpdateConcurrencyException` if the row was modified by another session.

**Implementation**:
- Add `RowVersion` property (`Guid`) to Department entity
- Configure as concurrency token in `OnModelCreating`: `.IsConcurrencyToken()`
- Set `RowVersion = Guid.NewGuid()` on create and on every update
- Catch `DbUpdateConcurrencyException` in the controller, return 409 Conflict with field-level diffs

**Alternatives Considered**:
- Integer version counter: Works but less collision-resistant than Guid. Rejected for marginal benefit.
- SQLite trigger to auto-update: Adds complexity and is database-specific. Rejected per Principle VII.

---

## R-002: Server-Sent Events in ASP.NET Core

**Context**: FR-010 requires real-time notification delivery to all connected browsers via SSE, replacing MSMQ.

**Decision**: Use an ASP.NET Core controller action that returns streaming `text/event-stream` content, fed by a `Channel<Notification>`.

**Rationale**: ASP.NET Core natively supports SSE via streaming responses. Using `Channel<T>` (System.Threading.Channels) as the in-process queue provides a high-performance, bounded, async-friendly producer/consumer pattern. The SSE endpoint reads from a per-client channel and streams events.

**Implementation**:
- Define a singleton `NotificationBroadcaster` wrapping a fan-out pattern
- Controllers write to the broadcaster after successful CRUD operations
- `NotificationsController.Stream()` endpoint returns `text/event-stream`
- Each connected client gets a dedicated `ChannelReader<T>` via broadcast subscription
- Use `CancellationToken` to detect client disconnect and clean up

**Alternatives Considered**:
- SignalR: Prohibited by Constitution IV (unnecessary complexity for one-way push)
- WebSockets: Prohibited by Constitution IV
- Polling: Prohibited by Constitution IV

---

## R-003: Vite Dev Server Proxy to .NET Backend

**Context**: During development, the Vite dev server (port 5173) must proxy API requests to the .NET backend (port 5001).

**Decision**: Configure Vite's `server.proxy` in `vite.config.ts` to forward `/api/*` requests to the .NET backend.

**Rationale**: This is the standard Vite approach for SPA+API development. It eliminates CORS configuration during development and matches the production deployment model where a reverse proxy would handle routing.

**Implementation**:
```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://localhost:5001',
      changeOrigin: true,
      secure: false // accept self-signed dev cert
    }
  }
}
```

**Alternatives Considered**:
- CORS configuration: Adds production complexity, dev-only setting risk. Rejected.
- Same-port hosting: Complicates the development experience. Rejected.

---

## R-004: EF Core 9 TPH Inheritance on SQLite

**Context**: The Person → Student/Instructor hierarchy uses Table-Per-Hierarchy (TPH) inheritance with a discriminator column.

**Decision**: Use standard EF Core TPH configuration with a string discriminator column.

**Rationale**: EF Core 9 fully supports TPH on SQLite. The discriminator column (`Discriminator`) is a TEXT column storing `"Student"` or `"Instructor"`. No known issues or limitations with this pattern on SQLite.

**Implementation**:
- `Person` as abstract base class with shared properties (LastName, FirstMidName)
- `Student` and `Instructor` extend `Person`
- EF Core auto-configures TPH when both derived types are registered as `DbSet<T>`
- Configure explicit discriminator values in `OnModelCreating` for clarity

**Alternatives Considered**:
- Table-Per-Type (TPT): Creates separate tables, more complex joins. Rejected per Principle VII.
- Table-Per-Concrete-Type (TPC): Duplicates columns. Rejected for data integrity.

---

## R-005: File Upload Validation & Storage

**Context**: FR-007/FR-008 require image uploads (JPG, JPEG, PNG, GIF, BMP; max 5 MB) via an `IStorageService` abstraction.

**Decision**: Validate file extension AND content-type header on the server. Store files with a generated filename (GUID) to prevent path traversal. Implement `IStorageService` with a `LocalStorageService` default.

**Rationale**: Extension-only validation can be bypassed. Content-type validation adds a second check. GUID filenames prevent filename collisions and path traversal attacks. The abstraction satisfies FR-008.

**Implementation**:
- `IStorageService` interface: `SaveAsync(Stream, fileName)`, `DeleteAsync(path)`, `GetStreamAsync(path)`
- `LocalStorageService`: saves to `Uploads/` directory, returns relative path
- Validation in controller: check extension whitelist + content-type + size ≤ 5 MB
- Store generated path in Course entity's `ImagePath` property

**Alternatives Considered**:
- Magic byte (file signature) validation: More secure but adds complexity. Deferred per Principle VII — extension + content-type is sufficient for an internal admin tool.
- Database BLOB storage: Increases DB size, complicates backup. Rejected.

---

## R-006: In-Process Notification Broadcasting Pattern

**Context**: FR-011 requires an in-process notification queue and background worker. Multiple SSE clients must receive the same notification.

**Decision**: Use a fan-out pattern with a singleton `NotificationBroadcaster` that maintains a collection of per-client `Channel<T>` instances.

**Rationale**: A single `Channel<Notification>` can only have one reader. For multiple SSE clients, we need a fan-out mechanism. The broadcaster maintains a `ConcurrentDictionary<string, Channel<Notification>>` of active client channels. When a notification is produced, the broadcaster writes to all active client channels.

**Implementation**:
- `NotificationBroadcaster` (singleton): `Subscribe()` returns a client-specific `ChannelReader<Notification>`, `Publish(Notification)` writes to all subscribers
- `INotificationService.NotifyAsync(entityType, entityId, operation, message)` — called by controllers after CRUD
- `NotificationBroadcaster.Publish()` fans out to all subscriber channels
- SSE endpoint reads from the client-specific `ChannelReader` and streams as `text/event-stream`
- On client disconnect (CancellationToken), remove the client channel from the dictionary

**Alternatives Considered**:
- Single channel with multiple readers: Not supported by `Channel<T>`. Rejected.
- `IObservable<T>` / Rx.NET: Adds a dependency for a simple fan-out. Rejected per Principle VII.
