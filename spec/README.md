# CareerBridge — specification

What the system must do and how it is built. These files are the current version; they change
together with the code. If code and specification disagree, fix one of them in the same pull request.

The files with a section number are the parts of the documentation, in the order of the course
template; the documentation PDF is built from them (`tools/build-pdf/`). The files with no section
number are for the team and are not in the PDF. Find the topic here before reading or adding text.

| File | Holds | Read when | Put here, not elsewhere | Section |
| --- | --- | --- | --- | --- |
| [change-log.md](change-log.md) | Main changes of each iteration | Writing a deliverable | Iteration summaries; not every commit (that is git) | Change Logs |
| [vision.md](vision.md) | Introduction, scope, product perspective, assumptions (A-n), dependencies | Asking why or what is in scope | Assumptions and scope; not requirements | 1, 2 |
| [requirements.md](requirements.md) | FRs and NFRs per use case, clarifications, traceability matrix | Checking what the system must do | Testable requirements with IDs; not step flows | 3 |
| [use-cases.md](use-cases.md) | Use-case diagram, the fully-dressed use cases, subfunctions | Building or naming a ticket for a use case | Steps and extensions; not operations | 4.1, 4.2 |
| [ssd-and-contracts.md](ssd-and-contracts.md) | The system operations of each use case and their contracts | Naming a service method | Pre/postconditions of operations; not UI | — |
| [screens/](screens/README.md) | The catalog of screens by role (each with its ID, address and use cases) and one mockup per screen ID, at phone, tablet and laptop width, with its picture | Designing, building or changing a screen | Which screens exist, what they hold and how they look; changed with its page (ADR-0011) | — |
| [domain-model.md](domain-model.md) | Conceptual classes, attributes, associations | Naming an entity or a field | What the data means; not tables or methods | 5 |
| [design.md](design.md) | Design sequence diagrams (SD-n) and the design class diagram | Drawing an SD or the DCD | Mermaid diagrams from the code, one row each in §7.1 | 6, 7 |
| [architecture.md](architecture.md) | Parts, layers, data, tests, deployment | Changing how the system is built | How it is built; decisions go in adr/ | 8 |
| [testing.md](testing.md) | Test summary and test-case table | Writing or listing tests for a use case | Test cases in the template's columns; not test code | 9 |
| [user-scenarios/](user-scenarios/README.md) | Acceptance scenarios in Gherkin (`.feature`), one per use-case outcome, run as end-to-end tests | Checking that the use cases still work, before a demo or a deliverable | Scenarios in the use cases' language; not use-case steps (use-cases.md) or test code (app/frontend/e2e/scenarios) | — |
| [team.md](team.md) | Members, roles, use cases, contribution | Checking who owns what | People and ownership | 10 |
| [setup-guide.md](setup-guide.md) | Tools, configuration and the steps to run the system and its tests | Running the system on another computer | How to install and run; not deployment secrets (app/README.md) | 11 |
| [user-manual.md](user-manual.md) | What each role can do and its typical workflows | Showing or learning how to use the system | How to use what works on `main`; not use-case steps (use-cases.md) | 12 |
| [adr/](adr/README.md) | One decision per record | Before changing a design choice | New decisions; replace a record, do not rewrite it | — |
| [diagrams/](diagrams/) | Figures that are images | Changing such a figure | Images only; new diagrams are Mermaid in the text | — |

## Identifiers

| Prefix | Meaning | Example |
| --- | --- | --- |
| `UC-nn` | Use case | UC-04 Apply for Job |
| `FR-UCnn.n`, `NFR-UCnn.n` | Functional / non-functional requirement of that use case | FR-UC04.1 |
| `CO-nn.n` | Operation contract of UC-nn | CO-04.1 submitApplication |
| `BR-n` | Business rule | BR-4 |
| `A-n` | Working assumption for the customer to confirm | A6 |
| `ADR-nnnn` | Architecture decision record | ADR-0001 |

Names in the code follow these documents: entity classes and attributes come from the domain model,
service methods are the system operations of the contracts.

## The documentation PDF

The documentation submitted for a deliverable is a PDF built from these files; nobody edits a Word
or Google document.

**Build and check it.** In Claude Code, in this repository, ask "build the documentation PDF"
("собери PDF"). The `build-doc-pdf` skill:

1. runs the checks in `tools/doc-check/`: figures and tables numbered 1, 2, 3… in order
   (`figures.py`), the same multiplicities in every design class diagram (`dcd.py`), every bold
   label of the user manual on the screens (`manual-labels.py`);
2. offers the drafting skills, each of which shows a draft and changes nothing before a yes:
   `doc-changelog` (Change Logs), `doc-draft intro` (section 1), `doc-draft testing-summary`
   (section 9.1) and `doc-check-manual` (section 12 walked in the running app);
3. builds the PDF with `tools/build-pdf` and checks that sections 1–12 are there and that no
   "Not written yet" is left.

Each of these skills also runs on its own, and each check runs alone:
`python3 tools/doc-check/figures.py --spec <contents.txt>`, `python3 tools/doc-check/dcd.py`,
`python3 tools/doc-check/manual-labels.py`. The deliverable's list of files and its cover are kept
by the project librarian, outside this repository, so the librarian builds the PDF that is
submitted.

**What each member keeps right.** The use cases, the sequence diagrams and the test cases are
graded one member at a time, so each member keeps their own up to date, through a pull request:

| Section | File | What to keep right |
| --- | --- | --- |
| 4.2 Fully-dressed use cases | [use-cases.md](use-cases.md) | Your use cases as built; the **Author** row of each names you (the template's format). A use case that is not built is not in the final document. |
| 6 Sequence diagrams | [design.md](design.md) | One SD per use case, in Mermaid, by the rules at the top of the file (HTTP request, controller, the service operation, names from the code); it renders in the GitHub preview. |
| 7 Design class diagram | [design.md](design.md) | Your classes' associations with the same multiplicities as the shared diagram (`dcd.py` checks). |
| 9.2 Test cases | [testing.md](testing.md) | Your test cases in the existing table's columns: tester, inputs, expected and actual result (the test's name), status; credit AI help when you had it. |
| 10 Team contribution | [team.md](team.md) | One page about your work, with your percentage. |
| 12 User manual | [user-manual.md](user-manual.md) | When your change renames a menu entry, page title or button, or changes a workflow it describes, update it in the same pull request. |

Use-case owners: Zeba Tusnia Towshi UC-11 to UC-13, Oleg Berdyshev UC-01 to UC-03, Josh Job Joseph
UC-04, UC-14 and UC-15, Rabeya Nazara UC-05 to UC-07, Reagan Rubio UC-08 to UC-10.

The librarian keeps the shared parts right before submission: the Change Logs, sections 1–2,
the domain model, the shared class diagram, section 8, section 9.1, the figure numbers and the
final build.
