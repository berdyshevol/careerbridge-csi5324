# Iteration 1 — Common Documentation Pitfalls

> Source: [Canvas page "Iteration 1 – Common Documentation Pitfalls (Read Carefully)"](https://baylor.instructure.com/courses/257917/pages/iteration-1-common-documentation-pitfalls-read-carefully?module_item_id=5544227), posted by Dr. Ren, retrieved Sep 9, 2026.
>
> This is the grading guidance for [Deliverable 2 = Iteration 1](assignment.md). Read it before writing any section; the "How we avoid it" column is ours, not the instructor's.

Dr. Ren's framing: *Iteration 1 is the foundation of the entire project — most major project issues originate here*, and these seven mistakes are the most common reasons teams lose points.

## 1. Jumping to implementation without solid analysis

- **Symptom:** UI sketches or screenshots but unclear requirements; classes or code discussed before the use cases are complete; "we plan to implement …" with no *why*.
- **Why it costs points:** Iteration 1 is analysis-first, not implementation-first. Weak analysis forces redesign later.
- **Fix:** finish requirements and use cases before discussing classes. **Every planned feature must appear in at least one use case.**
- **How we avoid it:** the stack decision (D-004) and the AI-scope question are recorded as decisions with rationale, not as an implementation plan. No class diagrams in this deliverable.

## 2. Use cases that are just UI click steps

- **Symptom:** "User clicks button → system shows page"; no business rules, no alternative flows, no constraints.
- **Why it costs points:** use cases describe *system behavior*, not UI navigation. UI details change; system responsibilities should not.
- **Fix:** focus on what the system **guarantees**.
- **How we avoid it:** each of the 15 fully-dressed use cases must have alternative flows and business rules. Reviewer check before submission: if a step names a button, rewrite it.

## 3. Missing or weak system boundary

- **Symptom:** actors doing system work; external systems treated as internal components; no clear split between user and system responsibility.
- **Why it costs points:** the boundary defines what we are responsible for building; unclear boundaries cause inconsistent diagrams and scope creep.
- **Fix:** explicitly define the actors and the system scope.
- **How we avoid it:** the use-case diagram task explicitly calls for the boundary **and system actors** (email/notification service, resume storage, any auth provider) — not just human actors.

## 4. Domain model that looks like a class diagram

- **Symptom:** methods, data types, or technical classes in the domain model; UI or database concepts mixed in.
- **Why it costs points:** domain models represent business concepts, not implementation. Premature design hides real domain complexity.
- **Fix:** use **nouns from the problem statement**. No methods, no UI classes, no persistence details.
- **How we avoid it:** the domain model is built from the problem-statement vocabulary (Applicant, Organization, Job Posting, Application, Resume, Recruiter…). The data-schema task is kept as a **separate** artifact feeding Deliverable 3, and stays out of the domain model.

## 5. SSDs that are too detailed (or too empty)

- **Symptom:** SSDs with internal objects and method calls; or an SSD with a single "do everything" message.
- **Why it costs points:** SSDs are system-level, not object-level. They define system operations, not internal design.
- **Fix:** **one SSD per major system operation**; messages go actor → system (the system stays a single black box).
- **How we avoid it:** each member produces SSDs for their own 3 use cases and keeps the system as one lifeline.

## 6. Treating Iteration 1 as "draft" documentation

- **Symptom:** placeholder text, "to be decided" sections, sloppy diagrams expecting later fixes.
- **Why it costs points:** Iteration 1 is graded as a **complete analysis deliverable**; later iterations build on it.
- **Fix:** write it as if a client will review it. Assume every section is final unless explicitly revised later.
- **How we avoid it:** **no "TBD" survives into the submitted PDF.** The open items we currently carry — the admin model (D-005/Q-013), resume retention (Q-015), the AI scope — must be resolved into a stated position before Sep 28, not left blank. Diagrams must be legible in both the PDF and the slides.

## 7. Poor traceability and consistency across artifacts

- **Symptom:** requirements not reflected in use cases; use cases not appearing in SSDs; no mapping between artifacts.
- **Why it costs points:** traceability and consistency are **core learning objectives** of the course.
- **Fix:** cross-check the chain **Requirements → Use Cases → SSDs → Operation Contracts**, with consistent naming and IDs.
- **How we avoid it:** every use case gets an ID (UC-xx) reused verbatim in the SSD title, the operation contracts and the wireframes; a traceability table (requirement → UC → SSD → contract) goes into the document before assembly.

## Final reminder (instructor's words)

> If Iteration 1 is weak, Iteration 2 and 3 will suffer. Strong teams invest time here and save effort later.
>
> **Iteration 1 success = clear requirements + solid use cases + correct system boundary.**

## Pre-submission checklist

- [ ] Every functional requirement appears in at least one use case (pitfall 1, 7)
- [ ] No use-case step names a UI control; every use case has alternative flows and business rules (pitfall 2)
- [ ] Use-case diagram shows the system boundary and **system** actors (pitfall 3)
- [ ] Domain model has nouns only — no methods, no UI, no persistence (pitfall 4)
- [ ] One SSD per system operation, actor → system only, system as one lifeline (pitfall 5)
- [ ] Zero placeholders / "TBD" in the submitted PDF; every open question has a stated position (pitfall 6)
- [ ] Traceability table Requirements → UC → SSD → Operation Contract, consistent IDs throughout (pitfall 7)
- [ ] All figures legible in both the PDF and the presentation
