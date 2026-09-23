# Course-provided documentation template

Downloaded from Canvas → Modules → **Team Project → Documentation** on 2026-09-22.

| File | Size | What it is |
|---|---|---|
| `CSI5324_Project_Documentation_Template.docx` | 43 KB | The template every deliverable PDF must follow |
| `Sample Documentation.pdf` | 566 KB | A worked example of a completed document |

Canvas requires the documentation PDF to **use this template**
([Deliverable 2](../../deliverables/deliverable-2/assignment.md)).

## How the template works

- The title page is pre-filled with **"Recruiting & Application Management System"** — the same
  system this team is building — plus `Version <1.0>`, `<Team Name>`, `<Team member>`, `<Date>`.
- All guidance text is in **blue italics, style `InfoBlue`, inside square brackets**. The template
  says explicitly: **delete every blue bracketed paragraph before submitting.**
- The **table of contents must be auto-generated** and refreshed after every edit.
- Diagrams: the template repeats the same instruction for each one — *"Make sure the diagram looks
  clear after zoom in. Export the diagram as PDF file then import picture from file."* For the use
  case diagram it adds: if the diagram overflows the margins, split it into several diagrams, one
  per actor.

## Full section list (spans all three iterations)

| § | Section | Needed for Iteration 1? |
|---|---|---|
| 1 | Introduction | **yes** — purpose, what the system is, target users, problem solved; high-level, no implementation |
| 2 | Project Overview | **yes** |
| 2.1 | Product Perspective | **yes** — standalone or part of a larger system, external components, system boundary |
| 2.2 | Assumptions and Dependencies | **yes** — technical assumptions, simplifications; skip trivia |
| 3 | Requirements | **yes** — clear, precise, testable |
| 3.1 | Functional Requirements | **yes** — must align with the use cases; no UI or implementation detail |
| 3.2 | Non-functional Requirements | **yes** — performance, usability, constraints; bullet list preferred |
| 3.3 | Requirements Clarifications | **yes** — questions found during development + resolved answers |
| 4 | Use Case Model | **yes** |
| 4.1 | Use Case Diagram | **yes** — system boundary, actors, major use cases |
| 4.2 | Fully-Dressed Use Cases | **yes** — ≥3 main use cases per student, no cap on the total |
| 5 | Domain Model (Analysis) | **yes** — real-world concepts, attributes, relationships. **Not a design model: no methods, no implementation** |
| 6 | Sequence Diagrams (Design) | unclear — see the open question in the deliverable |
| 7 | Design Class Diagram (DCD) | no — Iteration 2 |
| 8 | Implementation Overview (Architecture, Key Design Decisions) | no — Iteration 2 |
| 9 | Testing (JUnit summary, test case table) | no — Iteration 2/3 |
| 10 | Team Contribution | likely — roles, responsibilities, contribution % (new page) |
| 11 | Setup / Installation Guide | no — Iteration 3 (new page) |
| 12 | User Manual | no — Iteration 3 (new page) |

> The numbering inside the file is inconsistent: the body headings after §5 restart their
> subsection numbers (Implementation Overview is numbered 10.1/10.2, Testing 11.1/11.2) while the
> table of contents lists them as 8 and 9. Fix the numbering when filling the template in.

## Required format of a fully-dressed use case (§4.2)

The template fixes the field order:

- Use Case Name
- Author
- Actor
- Preconditions
- Postconditions
- Main Success Scenario
- Extensions
- Special Requirements *(only when applicable)*

## Required format of a test case (§11.2, later iterations)

Test Case ID · Assigned Tester · Scenario/Condition · Test Inputs · Expected Result ·
Actual Result *(blank if not tested yet)* · Test Status *(Passed/Failed)*
