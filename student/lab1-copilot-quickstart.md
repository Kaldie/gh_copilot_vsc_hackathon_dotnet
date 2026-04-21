# Lab 1: Prompt Engineering with GitHub Copilot

**Duration:** 40 minutes  
**Goal:** Learn practical prompt engineering techniques that make GitHub Copilot more effective — then put them to the test in a bug hunt challenge. You'll use these skills throughout the rest of the workshop.

---

## Background: Why Prompting Matters

GitHub Copilot is powerful, but the quality of its output depends heavily on **how you ask**. A vague prompt gets a vague answer. A well-structured prompt with context, intent, and examples gets production-quality code.

### The Four Cornerstones of a Good Prompt

| Cornerstone | What It Means | Example |
|-------------|---------------|---------|
| **Context** | Give Copilot the background it needs | *"In this ASP.NET MVC 5 app using Entity Framework..."* |
| **Intent** | State your specific goal | *"...create a method that returns paginated results..."* |
| **Clarity** | Be unambiguous | *"...sorted by last name ascending..."* |
| **Specificity** | Include precise details | *"...returning 10 items per page as a `PaginatedList<Student>`."* |

### Prompting Techniques

- **Zero-shot** — Ask directly, no examples provided
- **One-shot** — Provide one example of the desired input/output
- **Few-shot** — Provide multiple examples so Copilot can infer the pattern
- **Role prompt** — Tell Copilot to act as a specific expert (*"You are a senior .NET architect..."*)
- **Chain of thought** — Ask Copilot to think step-by-step before answering

---

## Exercise 1: Zero-Shot vs. One-Shot (10 min)

In this exercise you'll see how adding a single example dramatically improves Copilot's output.

### Step 1 — Zero-Shot

Open **Copilot Chat** (`Ctrl+Shift+I`) and type:

```
Write a C# method that validates an email address.
```

Look at the result. It works, but you have no control over the style, return type, or error handling approach.

### Step 2 — One-Shot (Add an Example)

Now try again with an example of the pattern you want:

```
Write a C# method that validates an email address.

Follow this pattern:
public static ValidationResult ValidatePhoneNumber(string phone)
{
    if (string.IsNullOrWhiteSpace(phone))
        return ValidationResult.Fail("Phone number is required.");

    if (!Regex.IsMatch(phone, @"^\+?[\d\s\-()]{7,15}$"))
        return ValidationResult.Fail("Phone number format is invalid.");

    return ValidationResult.Ok();
}
```

Compare the two results. The one-shot version should match your coding style, use the same `ValidationResult` return type, and follow the same guard-clause pattern.

### Reflect

- How did the output change when you added an example?
- What aspects of your example did Copilot pick up on? (return type, naming, structure, error messages)

---

## Exercise 2: Vague vs. Specific Prompts (10 min)

### Step 1 — Vague Prompt

```
Create a function to sort a list.
```

What language did Copilot pick? What type of list? What sort order? You'll likely get something generic.

### Step 2 — Specific Prompt

```
Create a TypeScript function called sortStudentsByName that takes an array of
{ firstName: string; lastName: string; enrollmentDate: string } objects
and returns a new array sorted by lastName ascending, then firstName ascending.
Do not mutate the original array.
```

### Step 3 — Add a Role

```
You are a senior TypeScript developer who follows strict immutability patterns.

Create a function called sortStudentsByName that takes a readonly array of
{ firstName: string; lastName: string; enrollmentDate: string } objects
and returns a new array sorted by lastName ascending, then firstName ascending.
Use localeCompare for string comparison.
```

### Reflect

- How did specificity change the output quality?
- What did the role prompt add that the specific prompt didn't?

---

## Exercise 3: Iterative Refinement (5 min)

Good prompting is often a **conversation**, not a single question. Practice iterating on Copilot's output.

### Step 1 — Start Broad

```
Write a SQL query that finds the top 5 most popular courses by enrollment count.
```

### Step 2 — Refine

Look at the result and ask a follow-up:

```
Update the query to also include courses with zero enrollments (show them with count 0).
Use a LEFT JOIN instead.
```

### Step 3 — Refine Again

```
Now wrap this in a C# method that executes the query using Dapper and returns
a List<CoursePopularityDto> with properties CourseId, Title, and EnrollmentCount.
```

### Reflect

- Notice how each step built on the previous result
- Copilot maintained context across the conversation — use this to your advantage

---

## Exercise 4: Contextual Prompts (5 min)

Copilot can reference your actual codebase. This is the most powerful technique you'll use in the workshop.

### Step 1 — Ask Without Context

```
What database does this application use?
```

Copilot may guess or give a generic answer.

### Step 2 — Ask in Agent Mode

Switch Copilot Chat to **Agent mode** (the default in VS Code). Agent mode automatically searches your workspace for relevant files. Try the same question:

```
What database does this application use? Show me where the connection string is configured.
```

Now Copilot searches through your files and gives a grounded answer with file references.

> **Tip:** If you want to explicitly scope a question to your codebase in Ask mode, you can use `#codebase` in your prompt.

### Step 3 — Try More Codebase Queries

Pick 2-3 of these and try them out:

```
What models/entities does this application have?
```

```
How does the application handle pagination?
```

```
What NuGet packages does this project depend on?
```

### Reflect

- Agent mode turns Copilot from a general AI into a codebase-aware assistant
- You'll use this extensively in Lab 2 to explore the legacy codebase

---

## Exercise 5: Bug Hunt Challenge (10 min)

Time to put your skills to work on something more hands-on. We've planted **6 bugs** in a C# file — your job is to use Copilot to find them all.

### Setup

Open the file [`exercises/BuggyStudentService.cs`](exercises/BuggyStudentService.cs) in VS Code.

This is a student enrollment service with methods for getting names, calculating GPAs, enrolling in courses, and searching. It compiles, but it's full of logic bugs.

### The Challenge

1. **Open Copilot Chat** and paste the entire file (or use `#file` to reference it), then ask:

   ```
   Review this C# file for bugs. List every bug you find, explain why it's wrong,
   and show the fix. Be thorough — there are 6 bugs hidden in this code.
   ```

2. **Check Copilot's work** — Did it find all 6? If it missed some, try refining:

   ```
   Look more carefully at the EnrollInCourse method. Is the null check logic correct?
   ```

   ```
   What happens in GetHonorRollStudents when i equals _students.Count?
   ```

3. **Try a different approach** — Select just one method at a time and use Inline Chat (`Ctrl+I`):

   ```
   Find the bug in this method
   ```

### Scoring

| Bugs Found | Rating |
|------------|--------|
| 6 out of 6 | Copilot whisperer |
| 4–5 | Solid prompting |
| 2–3 | Getting there — try being more specific |
| 0–1 | Re-read the cornerstones and try again! |

> **Don't peek at the answer key yet!** After the exercise, your facilitator will walk through all 6 bugs.

### Reflect

- Did Copilot find all the bugs in one shot, or did you need to guide it?
- Which prompting technique helped most — broad review, targeted questions, or method-by-method?
- Were there any "bugs" Copilot flagged that weren't actually bugs?

---

## Quick Reference Card

Keep these tips handy for the rest of the workshop:

| Tip | Example |
|-----|---------|
| **Be specific** | Say "ASP.NET Core 9 Web API controller" not "a controller" |
| **Give examples** | Show one instance of the pattern you want |
| **Set a role** | "You are a senior developer reviewing code for security issues" |
| **Use Agent mode** | Ground Copilot's answers in your actual code (or `#codebase` in Ask mode) |
| **Iterate** | Start broad, then refine with follow-up prompts |
| **Break big tasks down** | "First, create the interface. Then, implement it." |
| **Ask for explanation** | "Explain your reasoning step by step" for complex logic |

---

## Done!

You now have a practical toolkit for communicating with Copilot. In the next lab, you'll put these techniques to work exploring a real legacy codebase.

**Next up:** [Lab 2: Understand the Legacy Codebase →](lab2-understand-legacy.md)
