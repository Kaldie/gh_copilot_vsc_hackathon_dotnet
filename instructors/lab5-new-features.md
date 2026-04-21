# Lab 5 — Instructor Guide: New Features

> This is the instructor companion to [student/lab5-new-features.md](../student/lab5-new-features.md).  
> It contains facilitation tips, feature-specific guidance, and showcase preparation.

---

## Key Teaching Goals

1. **Copilot for creative/exploratory work** — Not just migration, but building genuinely new functionality
2. **Pushing boundaries** — Seeing what Copilot can generate when given ambitious UI requests
3. **Iteration speed** — Agent mode scaffolding + Inline Chat refinement = fast feature development
4. **Before/after contrast** — These features were impractical in the legacy MVC app; they're natural in React

---

## Facilitation Approach

This lab is intentionally open-ended. Your role shifts from "troubleshooter" to "coach":

- **Don't prescribe** which feature to build — let participants choose
- **Do encourage ambition** — "What would make this app actually better than the legacy one?"
- **Circulate and show interest** — Ask "What are you building?" and react to what they show you
- **Highlight good Copilot interactions** — If someone gets a great result from a prompt, ask them to share it with the group

---

## Feature Guidance for Facilitators

### Feature 1: Drag-and-Drop Course Assignment

**Difficulty:** Medium  
**Copilot quality:** Good — HTML5 drag-and-drop is well-represented in training data

**Key prompt that works well:**

```
Create a React component for instructor course assignment using drag and drop.
Two columns: "Available Courses" on the left and "Assigned Courses" on the right.
Users can drag courses between columns. Use HTML5 Drag and Drop API (no library).
Style with TailwindCSS. Include visual feedback: highlight the drop zone on 
dragover, show a ghost element during drag.
```

**What to watch for:**
- HTML5 drag API is verbose — Copilot sometimes generates incomplete `onDragStart`/`onDragOver`/`onDrop` handlers
- The save-to-backend part often gets missed — remind students to wire up the API call
- If drag-and-drop feels too complex, suggest `@dnd-kit/core` as a simpler alternative

**What a good result looks like:**
- Two-column layout with course cards
- Drag a card from left to right (assign) or right to left (unassign)
- Drop zone highlights on hover
- Save button calls the backend API

### Feature 2: Course Schedule Calendar

**Difficulty:** Medium-High  
**Copilot quality:** Varies — calendar layout from scratch is hit-or-miss, library integration is reliable

**Two approaches:**

1. **From scratch** — Ask Copilot to build a calendar grid component. Good for showcasing code generation. May need refinement.

```
Build a monthly calendar component in React with TailwindCSS. Show a grid of 
days for the current month with navigation (previous/next month). Each day cell 
shows courses scheduled on that date, color-coded by department. Click a course 
to see its details. The component receives courses from the API.
```

2. **With a library** — More reliable, faster result.

```
Install and configure @fullcalendar/react for my Vite + React + TypeScript 
project. Create a page that shows courses in a monthly calendar view. Color 
events by department. Click an event to navigate to the course detail/edit form.
```

**What to watch for:**
- Calendar from scratch often has off-by-one errors (wrong starting day of week, wrong number of days)
- Library approach needs `npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid`
- The course data model may not have explicit schedule dates — students might need to add a `StartDate`/`EndDate` to the API or use enrollment dates

**Talking point:** "This is a great example of where Copilot accelerates development. Building a calendar from scratch would take hours. Even with the bugs Copilot introduces, you're still way ahead."

### Feature 3: Dashboard with Analytics

**Difficulty:** Easy-Medium  
**Copilot quality:** Excellent — dashboards are a very common pattern

**Good prompt:**

```
Create a dashboard page as the landing page for the app. Include:
- 4 summary cards at the top (total students, courses, instructors, departments) 
  with icons and counts fetched from the API
- A bar chart showing enrollment counts by month using recharts
- A "Recent Activity" panel showing the last 10 notifications from the SSE stream
Style with TailwindCSS. Make the cards responsive (2x2 grid on desktop, 
stacked on mobile).
```

**Library needed:** `npm install recharts` (or `chart.js` + `react-chartjs-2`)

**What to watch for:**
- API needs to return count data — may need a `/api/stats` endpoint (or students call each entity's list and count client-side)
- Recharts integration is usually clean
- Recent activity panel can reuse the existing SSE hook from Milestone 7

### Feature 4: Dark Mode

**Difficulty:** Easy  
**Copilot quality:** Excellent — TailwindCSS dark mode is well-documented

**Steps:**
1. Configure `tailwind.config.js`: `darkMode: 'class'`
2. Add a toggle button that adds/removes `dark` class on `<html>`
3. Use Inline Chat on existing components: "Add dark mode variants using TailwindCSS dark: classes"

**What to watch for:**
- If using Tailwind v4 with CSS-based config, the setup is different from v3 — `@custom-variant dark (&:where(.dark, .dark *));`
- Students may forget to persist the preference — suggest `localStorage`
- Most impactful when applied after other features are built (so there's more UI to theme)

---

## Timing Guide

| Activity | Time |
|----------|------|
| Choose a feature and start | 0-5 min |
| Primary feature development | 5-45 min |
| Second feature (if time) or polish | 45-55 min |
| Prep for showcase | 55-60 min |

**At ~30 min:** Check in with the group. "Who wants to do a quick show of what they have so far?" This energizes the room and gives ideas to people who are stuck.

**At ~50 min:** "Start wrapping up — we'll do showcases in 10 minutes. Make sure your app runs and your feature is demonstrable."

---

## Showcase Preparation (Last 5 min of Lab)

Before the wrap-up session, ask participants to:

1. Have their app running (both backend and frontend)
2. Be ready to show their new feature in the browser
3. Prepare to share one Copilot prompt that worked particularly well (or one that didn't)

**Facilitator prep:**
- Have the legacy app running side-by-side for comparison (use the `scripts/run-legacy-app.ps1`)
- Prepare 2-3 comparison points: "Look at the notification system — legacy polls every 5 seconds, modernized uses SSE. Look at course assignment — legacy uses checkboxes, modernized uses drag-and-drop."

---

## Wrap-Up Session (30 min after Lab 5)

### Structure

| Time | Activity |
|------|----------|
| 5 min | Side-by-side: legacy app vs a participant's modernized version |
| 10 min | 3-4 participant showcases (2-3 min each) |
| 10 min | Group discussion: what worked, what didn't, what surprised you |
| 5 min | Key takeaways and closing |

### Showcase Format

For each participant who presents:
1. "Show us your new feature" (browser demo)
2. "What Copilot prompt got you the best result?" (share screen of chat history)
3. "What did you have to fix manually?" (honest assessment)

### Discussion Prompts

- "Where did Copilot save the most time today?"
- "Where did you spend the most time fixing Copilot's output?"
- "How did Spec Kit change your approach compared to just chatting?"
- "Would you use this workflow on a real migration project? What would you change?"
- "What surprised you about working with Copilot on a full-day project?"

### Key Takeaways to Reinforce

1. **Structure matters** — Spec Kit's constitution → specify → plan → tasks → implement workflow produces better results than "just ask Copilot to do it"
2. **Context is everything** — The more context you give Copilot (via Spec Kit artifacts, custom instructions, or detailed prompts), the better the output
3. **Review is non-negotiable** — Copilot accelerates, but you still need to read and understand every line
4. **Modernization > migration** — The new tech stack doesn't just reproduce features, it enables capabilities that were impractical before (SSE, drag-and-drop, calendar views)
5. **Iteration is fast** — The build-test-refine loop with Copilot + hot-reload is dramatically faster than traditional development

---

## If Time Permits: Bonus Demos

- **Agent mode multi-file edit** — Show how Agent mode can modify multiple files in one operation (e.g., "add a new field to Student across the model, controller, and React form")
- **Custom instructions impact** — Show how adding a `.github/copilot-instructions.md` file with project context changes Copilot's recommendations
- **Model comparison** — Switch between Claude and GPT-4o for the same prompt and compare results
