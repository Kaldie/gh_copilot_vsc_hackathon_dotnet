# Quickstart: Contoso University Modernization

**Date**: 2026-04-21 | **Feature**: 001-contoso-modernization

## Prerequisites

- .NET 9 SDK
- Node.js 20+

No other tools, databases, or services required.

## First Run

### 1. Backend API

```bash
cd src/ContosoUniversity.Api
dotnet restore
dotnet run
```

The API starts on `https://localhost:5001` (and `http://localhost:5000`).
On first run, the SQLite database is created and seeded automatically.

### 2. Frontend SPA

```bash
cd src/ContosoUniversity.Web
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api/*` requests to the backend.

### 3. Open the Application

Navigate to `http://localhost:5173` in your browser.

## Build Verification

```bash
# Backend — must produce zero errors and zero warnings
cd src/ContosoUniversity.Api
dotnet build --warnaserror

# Frontend — must produce zero errors and zero warnings
cd src/ContosoUniversity.Web
npm run build
```

## Project Layout

| Directory | Purpose |
|-----------|---------|
| `src/ContosoUniversity/` | Legacy app (read-only reference) |
| `src/ContosoUniversity.Api/` | .NET 9 Web API backend |
| `src/ContosoUniversity.Web/` | Vite + React + TypeScript frontend |
| `specs/001-contoso-modernization/` | Design artifacts |

## Key URLs (Development)

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Frontend (Vite dev server) |
| `https://localhost:5001/api/students` | Backend API (direct) |
| `http://localhost:5173/api/students` | Backend API (via Vite proxy) |
