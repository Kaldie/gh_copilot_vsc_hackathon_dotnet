# Lab 5: New Features

**Duration:** 60 minutes  
**Goal:** Go beyond what the legacy app could do. Use Copilot to add modern interactive features that showcase the power of the new tech stack.

---

## Why This Lab Matters

In Lab 4 you reproduced the legacy app's functionality with modern technology. That's migration. Now it's time for **modernization** — adding capabilities that would have been painful or impossible in the old MVC + MSMQ stack.

This lab is intentionally open-ended. Pick the features that interest you most, and use Copilot to build as much as you can in the time available.

---

## Feature 1: Drag-and-Drop Course Assignment

Replace the checkbox/multi-select pattern for instructor-course assignments with a visual drag-and-drop interface.

**What to build:**
- A two-column layout: "Available Courses" on the left, "Assigned Courses" on the right
- Drag courses from available → assigned (and back) to assign/unassign
- The assignment persists to the backend when you save
- Visual feedback during drag (highlight drop zone, ghost element)

> **Why this is hard in legacy MVC:** Server-rendered HTML + jQuery drag-and-drop is brittle and requires full-page postbacks or complex AJAX wiring. In React, drag-and-drop is a natural fit with component state.

**Copilot tips:**
- Ask Copilot to "create a drag-and-drop component using HTML5 drag and drop API with TailwindCSS" — no external library needed
- Or ask for a library recommendation if you prefer (`@dnd-kit`, `react-beautiful-dnd`, etc.)
- Show it your existing instructor edit component and ask it to replace the assignment UI

---

## Feature 2: Course Schedule Calendar

Build a calendar view that displays course schedules visually.

**What to build:**
- A monthly/weekly calendar showing when courses are scheduled
- Click on a day to see courses on that date
- Click on a course to view its details or navigate to the edit form
- Color-code by department

> **Extension idea:** Make the calendar interactive — drag a course to a different day to reschedule it.

**Copilot tips:**
- Ask Copilot to build a calendar grid component from scratch with TailwindCSS — it's a good test of its layout generation abilities
- Or ask it to integrate a calendar library like `react-big-calendar` or `@fullcalendar/react`
- Provide the course data shape (from your API types) so it generates the right data mapping

---

## Feature 3: Dashboard with Analytics

Create a landing page that gives an overview of the university at a glance.

**What to build:**
- Summary cards: total students, total courses, total instructors, total departments
- Enrollment trend chart (line or bar chart) showing enrollments over time
- Recent activity feed (using the SSE notification stream)
- Quick links to the most common actions (add student, add course)

**Copilot tips:**
- For charts, ask Copilot to use a lightweight library like `recharts` or `chart.js` with `react-chartjs-2`
- Ask it to build the summary cards as a reusable component with an icon, label, and count
- The activity feed can reuse your existing SSE notification hook

---

## Feature 4: Dark Mode

Add a light/dark theme toggle using TailwindCSS.

**What to build:**
- A toggle button in the header/navbar
- TailwindCSS `dark:` variant classes applied throughout the app
- Theme preference persisted in `localStorage`

**Copilot tips:**
- This is a great task for Copilot — ask it to "add dark mode support to this component using TailwindCSS dark: classes"
- Select your existing components one by one and use Inline Chat to add dark mode variants
- Ask it to configure `tailwind.config.js` for `darkMode: 'class'` if not already set

---

## Choose Your Own Adventure

Have extra time or a different idea? Go for it. Some possibilities:

- **Inline editing** — Click a cell in a table to edit it in-place, no modal needed
- **Bulk operations** — Select multiple students and enroll them in a course at once
- **Keyboard shortcuts** — Navigate tables and forms without touching the mouse
- **Export to CSV** — Download student or enrollment data as a spreadsheet
- **Responsive mobile layout** — Make the app work well on narrow screens

> **This is the creative part of the workshop.** Use Copilot to explore what's possible. Ask it to suggest features, generate complex interactions, or build layouts. See how far you can push it.

---

## Tips for Working with Copilot on Frontend Code

- **Agent mode works well for scaffolding** — ask it to create a new component with specific props and behavior
- **Inline Chat is great for tweaking** — select a component and ask "add drag-and-drop to this list"
- **Be specific about the library** — say "using TailwindCSS classes" to avoid CSS modules or styled-components
- **Show it the API** — paste a Swagger endpoint or TypeScript type and ask it to generate a component that uses it
- **Iterate visually** — keep the dev server running, make changes, and check the browser immediately

---

## Summary

By now you should:

- [x] Have added at least one new feature that goes beyond the legacy app
- [x] Have used Copilot to build interactive UI components (drag-and-drop, calendar, charts, etc.)
- [x] Have a modernized application that's clearly better than the original

**Next up:** Wrap-up session where we showcase results, compare approaches, and discuss key takeaways.
