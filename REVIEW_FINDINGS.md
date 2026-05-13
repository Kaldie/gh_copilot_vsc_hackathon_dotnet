# Summary

The modern stack is functionally substantial and mostly coherent, with working CRUD breadth and a frontend that builds successfully. The largest risks are security and reliability around file-path handling and notification side effects after data commits. There is also architecture drift versus the stated workshop modernization constraints (SQL Server and .NET 10 instead of a file-based DB and .NET 9 path).

# Verification Executed

1. Host `dotnet` validation could not run because `dotnet` is not installed on host.
2. Containerized CI path executed with `docker compose -f docker-compose.yml --profile ci run --rm build-check` and completed restore/build steps successfully.
3. Frontend checks ran locally in [src/ContosoUniversity.Web/package.json](src/ContosoUniversity.Web/package.json): `npm install`, `npm run build`, `npm run lint`.
4. Lint produced one warning in [src/ContosoUniversity.Web/src/App.tsx](src/ContosoUniversity.Web/src/App.tsx#L205) for missing React Hook dependencies.

# Findings

1. [Critical] File path trust allows unintended file read/delete surface.
Evidence: [src/ContosoUniversity.Api/Controllers/CoursesController.cs](src/ContosoUniversity.Api/Controllers/CoursesController.cs#L55) accepts client-supplied `TeachingMaterialImagePath` at create time; storage read/delete paths are composed directly from stored path in [src/ContosoUniversity.Api/Services/LocalFileStorageService.cs](src/ContosoUniversity.Api/Services/LocalFileStorageService.cs#L49) and [src/ContosoUniversity.Api/Services/LocalFileStorageService.cs](src/ContosoUniversity.Api/Services/LocalFileStorageService.cs#L78), then used by course delete/download flows at [src/ContosoUniversity.Api/Controllers/CoursesController.cs](src/ContosoUniversity.Api/Controllers/CoursesController.cs#L96) and [src/ContosoUniversity.Api/Controllers/CoursesController.cs](src/ContosoUniversity.Api/Controllers/CoursesController.cs#L145).
Impact: If a crafted path is persisted, read/delete operations may target files outside intended teaching-material scope.

2. [High] Post-commit notification failures can turn successful mutations into request failures.
Evidence: Controllers persist first, then publish with request cancellation token, e.g. [src/ContosoUniversity.Api/Controllers/StudentsController.cs](src/ContosoUniversity.Api/Controllers/StudentsController.cs#L83) and [src/ContosoUniversity.Api/Controllers/StudentsController.cs](src/ContosoUniversity.Api/Controllers/StudentsController.cs#L86). Notification publish writes with same token in [src/ContosoUniversity.Api/Services/NotificationService.cs](src/ContosoUniversity.Api/Services/NotificationService.cs#L37) and [src/ContosoUniversity.Api/Services/NotificationService.cs](src/ContosoUniversity.Api/Services/NotificationService.cs#L42).
Impact: A disconnected or canceled request can surface 5xx after DB state is already committed, creating inconsistent client-observed outcomes.

3. [High] Architecture deviates from declared modernization constraints.
Evidence: Lab constraints specify no SQL Server and file-based DB in [student/lab3-plan-modernization.md](student/lab3-plan-modernization.md#L77) and SQLite-first milestone in [student/lab4-execute-migration.md](student/lab4-execute-migration.md#L36). Current implementation uses SQL Server in [src/ContosoUniversity.Api/Program.cs](src/ContosoUniversity.Api/Program.cs#L15), [src/ContosoUniversity.Api/appsettings.json](src/ContosoUniversity.Api/appsettings.json#L3), SQL container in [docker-compose.yml](docker-compose.yml#L4), and SQL Server package in [src/ContosoUniversity.Api/ContosoUniversity.Api.csproj](src/ContosoUniversity.Api/ContosoUniversity.Api.csproj#L10).
Impact: Workshop deliverable expectations and runtime dependencies are mismatched, increasing setup friction and review ambiguity.

4. [Medium] Notification fan-out can be blocked by slow subscribers and has unbounded buffering.
Evidence: Per-subscriber channels are unbounded in [src/ContosoUniversity.Api/Services/NotificationService.cs](src/ContosoUniversity.Api/Services/NotificationService.cs#L80), and publish loops sequentially through all subscribers in [src/ContosoUniversity.Api/Services/NotificationService.cs](src/ContosoUniversity.Api/Services/NotificationService.cs#L40).
Impact: Slow clients can increase memory usage and raise latency for publish calls under load.

5. [Medium] Backend automated test coverage is effectively absent.
Evidence: Modern solution contains only API project in [src/ContosoUniversity.Modern.slnx](src/ContosoUniversity.Modern.slnx#L2), and no modern test project was found in the repository scan. Build-check runs `dotnet test` in [scripts/docker/build-check.sh](scripts/docker/build-check.sh#L31) but there are no dedicated test assemblies to validate behavior.
Impact: Regressions in concurrency, notification behavior, and file handling are unlikely to be caught early.

6. [Low] Frontend has stale-closure risk flagged by lint.
Evidence: `useEffect` dependency warning at [src/ContosoUniversity.Web/src/App.tsx](src/ContosoUniversity.Web/src/App.tsx#L205), where multiple refresh functions are used from an empty dependency array.
Impact: Future refactors can introduce subtle stale state bugs in startup refresh behavior.

7. [Low] Repository documentation pathing is internally inconsistent.
Evidence: README points legacy app at [README.md](README.md#L10) `src/ContosoUniversity/`, while active workspace structure and scripts commonly route through `scripts/docker/ContosoUniversity` for container workflows.
Impact: New contributors may follow incorrect paths before discovering workshop-specific layout nuances.

# Notes

This report is intentionally findings-first and severity-ordered. It does not include code fixes in this pass.