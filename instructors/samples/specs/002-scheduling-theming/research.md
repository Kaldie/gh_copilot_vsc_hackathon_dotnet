# Research: Course Scheduling & Theming

**Feature**: 002-scheduling-theming  
**Date**: 2026-04-21

## Research Task 1: Calendar / Drag-and-Drop Library Selection

### Context

The schedule page requires a weekly calendar grid (Mon–Sun, 7AM–9PM, 30-min intervals) with drag-and-drop support for creating and moving course events. Must work with React 19, TypeScript strict, and TailwindCSS 4.

### Options Evaluated

| Library | Bundle (gzip) | React 19 | TS Support | TailwindCSS-only | External Drag | Maintenance |
|---------|--------------|----------|------------|-------------------|--------------|-------------|
| `@fullcalendar/react` + plugins | ~15 kB | ✅ | ✅ Excellent (built-in) | ⚠️ Has own CSS, can override | ✅ via `@fullcalendar/interaction` | Very active (v6.1.20, 9 days ago) |
| `@dnd-kit/core` | 13.9 kB | ✅ | ✅ Excellent (built-in) | ✅ Fully unstyled | ✅ | Very active (v6.3.1) |
| `react-big-calendar` | 50.9 kB | ✅ | ✅ Good (@types) | ❌ Requires SCSS | ✅ | Slower (10 months) |
| HTML5 DnD API (native) | 0 kB | ✅ | ✅ Native | ✅ | ✅ | N/A (standard) |

### Decision: `@fullcalendar/react` with TailwindCSS overrides

### Rationale

- **Pre-built weekly time grid** with 30-min interval support eliminates ~2 weeks of custom grid development
- **External drag source support** via `@fullcalendar/interaction` — courses can be dragged from a sidebar onto the calendar
- **Event moving** and **event resizing** built-in
- **Excellent TypeScript** declarations (84.1% TS codebase)
- **React 19 peer dependency** explicitly supported
- **MIT license**
- **Modular CSS** — FullCalendar has its own minimal stylesheet but allows complete CSS customization; TailwindCSS utility classes can be applied to wrapper elements and event content
- Small modular bundle (~15 kB gzip for core + timegrid + interaction)

### Alternatives Rejected

- **@dnd-kit/core**: Excellent DnD toolkit but requires building the entire calendar grid, time slot calculation, and snap logic from scratch. The DnD behavior is only ~30% of the work; the calendar grid layout is the other ~70%.
- **react-big-calendar**: SCSS dependency conflicts with the constitution's TailwindCSS-only constraint. Heavy dependency tree (16+).
- **HTML5 native**: Too much custom development for the same result. No snap, no visual feedback, no accessibility out of the box.

### Packages to Install

```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/timegrid @fullcalendar/interaction
```

---

## Research Task 2: Tailwind CSS 4 Dark Mode Strategy

### Context

The app uses Tailwind CSS 4 with the CSS-first approach (`@import "tailwindcss"` in index.css, no tailwind.config.js). Need a dark mode toggle with localStorage persistence and OS preference detection.

### Decision: Class-based dark mode with `@custom-variant`

### Rationale

Tailwind CSS 4 supports custom dark mode selectors via CSS-only configuration:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

This enables `dark:` utility classes throughout the app, activated by adding/removing the `.dark` class on the `<html>` element.

**Theme management approach**:
1. A `useTheme` React hook reads from `localStorage.theme` on mount
2. If no stored preference, checks `window.matchMedia('(prefers-color-scheme: dark)')`
3. Toggles the `.dark` class on `document.documentElement`
4. Stores the explicit choice in `localStorage.theme`
5. Removing the stored key reverts to OS preference

This matches the official Tailwind CSS 4 documentation exactly — no third-party theme library needed.

### Alternatives Considered

- **`prefers-color-scheme` only** (default): Cannot toggle manually — rejected because spec requires a toggle button.
- **`data-theme` attribute**: Works but `.dark` class is the more conventional approach and better documented.
- **Third-party library (next-themes, etc.)**: Unnecessary complexity — the built-in Tailwind CSS mechanism is sufficient.

---

## Research Task 3: Department Color Palette

### Context

Need 4+ distinguishable colors for department coding on the calendar, accessible in both light and dark modes (WCAG 2.1 AA). Colors are auto-assigned but optionally overridable via a color picker.

### Decision: Built-in palette of 8 colors with HSL-based fallback generation

### Rationale

A predefined palette of 8 colors covers the 4 existing departments with room for 4 more. If a department exceeds the palette, a deterministic HSL algorithm generates additional colors by distributing evenly around the hue wheel.

**Proposed palette** (light mode / dark mode pairs):

| Index | Department (default) | Light Background | Light Text | Dark Background | Dark Text |
|-------|---------------------|-----------------|------------|-----------------|-----------|
| 0 | English | `#dbeafe` (blue-100) | `#1e40af` (blue-800) | `#1e3a5f` | `#93c5fd` |
| 1 | Mathematics | `#fce7f3` (pink-100) | `#9d174d` (pink-800) | `#4a1942` | `#f9a8d4` |
| 2 | Engineering | `#d1fae5` (green-100) | `#065f46` (green-800) | `#064e3b` | `#6ee7b7` |
| 3 | Economics | `#fef3c7` (amber-100) | `#92400e` (amber-800) | `#78350f` | `#fcd34d` |
| 4 | (unassigned) | `#ede9fe` (violet-100) | `#5b21b6` (violet-800) | `#3b0764` | `#c4b5fd` |
| 5 | (unassigned) | `#ffedd5` (orange-100) | `#9a3412` (orange-800) | `#7c2d12` | `#fdba74` |
| 6 | (unassigned) | `#e0e7ff` (indigo-100) | `#3730a3` (indigo-800) | `#312e81` | `#a5b4fc` |
| 7 | (unassigned) | `#f0fdfa` (teal-100) | `#115e59` (teal-800) | `#134e4a` | `#5eead4` |

All combinations meet WCAG 2.1 AA contrast ratio (≥4.5:1 for text).

**Auto-assignment logic**: When a department has no explicit color, assign the palette color at index `(departmentId % paletteSize)`. When an explicit `Color` hex value is stored, use it directly.

### Alternatives Considered

- **CSS variables per department**: Adds complexity for 4 departments. The palette approach with a simple index is simpler.
- **Random color generation**: Not deterministic — same department would get different colors on different loads. Rejected.

---

## Research Task 4: ScheduledInstance Data Model

### Context

Need a new entity to store course schedule entries (day of week + start time). Must integrate with existing EF Core 9 SQLite schema.

### Decision: ScheduledInstance entity with DayOfWeek enum + TimeOnly start time

### Rationale

- `DayOfWeek` (int 0–6, stored as integer in SQLite) — maps to .NET's `System.DayOfWeek`
- `TimeOnly` for start time — EF Core 9 supports `TimeOnly` with SQLite as TEXT
- `int DurationMinutes` defaults to 60 — allows future flexibility
- Foreign key to `Course.CourseId`
- Unique constraint on `(CourseId, DayOfWeek, StartTime)` prevents exact duplicates

SQLite stores `TimeOnly` as ISO 8601 text (`"09:00:00"`), which is sortable and queryable.

### Alternatives Considered

- **DateTime instead of DayOfWeek + TimeOnly**: Overly specific — ties schedule to a calendar week. DayOfWeek is more appropriate for recurring weekly schedules.
- **String-based day storage**: Fragile, not sortable. Enum is type-safe.
