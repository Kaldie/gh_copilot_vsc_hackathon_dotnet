# Lab 1 — Instructor Guide: Prompt Engineering with GitHub Copilot

> This is the instructor companion to [student/lab1-copilot-quickstart.md](../student/lab1-copilot-quickstart.md).  
> It contains talking points, expected Copilot responses, common pitfalls, and the bug hunt answer key.

---

## Before You Start

- Verify all participants have **VS Code** open with **Copilot Chat** working (`Ctrl+Shift+I`)
- Ensure participants have the workshop repo cloned and open as workspace
- This lab is **chat-only** (no legacy app setup needed) — save troubleshooting for Lab 2
- Keep the background section brief (~3 min) — participants learn best by doing

---

## Exercise 1: Zero-Shot vs. One-Shot — Talking Points

**What to demo (if doing live):** Run both prompts side by side and compare the output structure.

**Key observations to draw out:**

| Zero-Shot | One-Shot |
|-----------|----------|
| Copilot picks its own return type (usually `bool` or throws exceptions) | Matches the `ValidationResult` pattern from your example |
| Naming is generic (`IsValidEmail`, `ValidateEmail`) | Follows your naming convention (`ValidateEmailAddress`) |
| Error handling approach varies | Mirrors the guard-clause → regex → success pattern |
| May use `try/catch` or `MailAddress` class | Uses `Regex.IsMatch` like the example |

**Talking point:** One-shot prompting is the single most impactful technique. It's like showing a contractor an example room before they renovate your house — you get consistent style with minimal explanation.

**Common issue:** Some participants may get a very good zero-shot result (Copilot has been heavily trained on email validation). If so, point out that the output *happened* to be good but wasn't *predictably* styled — the one-shot version gives you control.

---

## Exercise 2: Vague vs. Specific — Talking Points

**Expected vague prompt output:** Copilot will likely pick Python or JavaScript and generate a generic `sort()` wrapper. The language, types, and sort order are all guesses.

**Expected specific prompt output:** A TypeScript function with the exact signature, using `[...array].sort()` or `Array.from()` with a comparator on `lastName` then `firstName`.

**Expected role prompt additions:**
- `readonly` keyword on parameter type
- `localeCompare` for comparison
- Possibly `Readonly<>` utility type
- May add JSDoc or explanatory comments

**Talking point:** The role prompt is especially useful when you want Copilot to follow a specific engineering philosophy (security-first, performance-first, immutability). It's also helpful for code reviews: *"You are a security auditor. Review this code for vulnerabilities."*

---

## Exercise 3: Iterative Refinement — Talking Points

**Key message:** Most real-world Copilot usage is a conversation, not a single prompt. Encourage participants to think in iterations:

1. Get a rough draft
2. Critique it / ask for changes
3. Extend it to the next layer

**Talking point:** This is the technique that matters most in Labs 3-5. When migrating the app, participants will start broad ("scaffold an API project") and iteratively refine ("now add the Student entity", "now add the controller with pagination").

**If participants finish early:** Ask them to continue the chain — e.g., "Now add error handling" → "Now add a unit test for this method."

---

## Exercise 4: Contextual Prompts — Talking Points

**Expected without context:** Copilot will give a generic answer like "It depends on your configuration" or guess SQL Server / PostgreSQL.

**Expected with Agent mode:** Copilot should find `Web.config`, identify the `SchoolContext` connection string pointing to LocalDB, and reference `SchoolContext.cs`.

**Common issue:** If the workspace isn't indexed yet, Agent mode may give a partial answer. Have participants try again — indexing happens in the background.

**Talking point:** This is the bridge to Lab 2. In 15 minutes they'll be using these exact techniques to deeply explore the legacy codebase. Point out that the quality of codebase exploration depends entirely on the quality of their prompts — the skills from Exercises 1-3 directly apply here.

---

## Exercise 5: Bug Hunt Challenge — Answer Key

### The 6 Bugs

| # | Method | Bug | Why It's Wrong | Fix |
|---|--------|-----|----------------|-----|
| 1 | `GetFullName` | Uses `LastName` twice | Returns "Smith Smith" instead of "John Smith" | Change second `LastName` → `FirstName` |
| 2 | `CalculateGpa` | No null check on `Enrollments` | `NullReferenceException` if `Enrollments` is null | Add `if (student.Enrollments == null \|\| student.Enrollments.Count == 0)` |
| 3 | `EnrollInCourse` | Inverted null-check logic | Returns `false` (meaning "already enrolled") when the course is NOT found, then adds the enrollment anyway | Swap: return `false` when `existing != null`, add enrollment when `existing == null` |
| 4 | `GetHonorRollStudents` | Off-by-one: `i <= _students.Count` | `IndexOutOfRangeException` on the last iteration | Change `<=` to `<` |
| 5 | `GetTopStudent` | Uses strict `>` with `highestGpa` initialized to `0` | A student with a 4.0 GPA won't be selected if another student also has 4.0 (first one is skipped). Also, if all students have 0.0 GPA, returns `null` instead of one of them | Change `>` to `>=` |
| 6 | `SearchByName` | `Contains()` is case-sensitive by default | Docstring says "case-insensitive" but `Contains` uses ordinal comparison | Use `Contains(query, StringComparison.OrdinalIgnoreCase)` |

### What Copilot Typically Finds

In testing, Copilot usually finds **4-5 bugs** on the first try with a broad prompt:
- Almost always catches: #1 (copy-paste), #3 (inverted logic), #4 (off-by-one)
- Usually catches: #6 (case sensitivity)
- Sometimes misses: #2 (null check — depends on whether it assumes Enrollments is initialized)
- Often misses: #5 (subtle — the `>` vs `>=` issue, especially the edge case with the 0.0 initialization)

### Facilitation Tips

- **After 5 minutes**, ask how many bugs people have found. If most have 3-4, give them hint prompts for the remaining ones
- **Common false positive:** Copilot may flag that `Grade = 0` in `EnrollInCourse` is a bug (saying grades should start as null/unset). This is debatable — acknowledge it as a design concern but not one of the 6 intentional bugs
- **Common false positive:** Copilot may suggest `_students` should be thread-safe. Valid concern but not an intentional bug
- **Debrief prompt:** Ask the group: *"Who got all 6 on the first try? Who needed to ask more targeted follow-ups?"* This reinforces that iterative prompting (Exercise 3) applies to code review too

### Walkthrough Script

After the exercise, walk through the bugs on screen. For each one:

1. Show the buggy code
2. Ask: *"Who caught this one? What prompt did you use?"*
3. Show the fix
4. Connect it to a prompting technique:
   - Bug #1 → A broad "review for bugs" prompt usually catches obvious copy-paste errors
   - Bug #3 → Sometimes you need to ask about a specific method to catch logic inversions
   - Bug #5 → The hardest to find — requires asking about edge cases specifically

---

## Timing Guide

| Exercise | Duration | Notes |
|----------|----------|-------|
| Background + cornerstones | 3 min | Quick overview — don't lecture, let them read |
| Exercise 1: Zero/One-shot | 8 min | Can demo live before participants try |
| Exercise 2: Vague vs. specific | 7 min | Let participants explore freely |
| Exercise 3: Iterative refinement | 5 min | Quickest exercise — concept is simple |
| Exercise 4: Contextual prompts | 5 min | Bridge to Lab 2 |
| Exercise 5: Bug hunt | 10 min | Most engaging — save time for debrief |
| Debrief + answer key | 2 min | Walk through bugs, connect to techniques |
| **Total** | **~40 min** | |

If running short on time, exercises 2 and 3 can be combined or shortened. Exercise 5 is the highlight — don't skip it.

---

## Wrap-Up Checklist

Before moving to Lab 2, verify that participants:

- [ ] Can open Copilot Chat and get responses
- [ ] Understand the difference between zero-shot and one-shot prompting
- [ ] Know how to switch between Ask mode and Agent mode
- [ ] Have completed the bug hunt (or at least attempted it)
- [ ] Feel comfortable iterating on Copilot's output rather than accepting the first result
