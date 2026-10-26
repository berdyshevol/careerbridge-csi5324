# CareerBridge — specification

What the system must do and how it is built. These files are the current version; they change
together with the code. If code and specification disagree, fix one of them in the same pull request.

Each file is one part of the documentation, in the order of the course template; the documentation
PDF is built from them (`tools/build-pdf/`). Find the topic here before reading or adding text.

| File | Holds | Read when | Put here, not elsewhere | Section |
| --- | --- | --- | --- | --- |
| [change-log.md](change-log.md) | Main changes of each iteration | Writing a deliverable | Iteration summaries; not every commit (that is git) | Change Logs |
| [vision.md](vision.md) | Introduction, scope, product perspective, assumptions (A-n), dependencies | Asking why or what is in scope | Assumptions and scope; not requirements | 1, 2 |
| [requirements.md](requirements.md) | FRs and NFRs per use case, clarifications, traceability matrix | Checking what the system must do | Testable requirements with IDs; not step flows | 3 |
| [use-cases.md](use-cases.md) | Use-case diagram, the fully-dressed use cases, subfunctions | Building or naming a ticket for a use case | Steps and extensions; not operations | 4.1, 4.2 |
| [ssd-and-contracts.md](ssd-and-contracts.md) | System sequence diagrams and operation contracts | Naming a service method | Pre/postconditions of operations; not UI | 4.3 |
| [ui-drafts.md](ui-drafts.md) | Wireframes | Designing a screen | Screen sketches; not styling (ADR-0004) | 4.4 |
| [domain-model.md](domain-model.md) | Conceptual classes, attributes, associations | Naming an entity or a field | What the data means; not tables or methods | 5 |
| [design.md](design.md) | Design sequence diagrams (SD-n) and the design class diagram | Drawing an SD or the DCD | Mermaid diagrams from the code, one row each in §7.1 | 6, 7 |
| [architecture.md](architecture.md) | Parts, layers, data, tests, deployment | Changing how the system is built | How it is built; decisions go in adr/ | 8 |
| [testing.md](testing.md) | Test summary and test-case table | Writing or listing tests for a use case | Test cases in the template's columns; not test code | 9 |
| [team.md](team.md) | Members, roles, use cases, contribution | Checking who owns what | People and ownership | 10 |
| [adr/](adr/README.md) | One decision per record | Before changing a design choice | New decisions; replace a record, do not rewrite it | — |
| [diagrams/](diagrams/) | Figures that are images | Changing such a figure | Images only; new diagrams are Mermaid in the text | — |

## Identifiers

| Prefix | Meaning | Example |
| --- | --- | --- |
| `UC-nn` | Use case | UC-04 Apply for Job |
| `FR-UCnn.n`, `NFR-UCnn.n` | Functional / non-functional requirement of that use case | FR-UC04.1 |
| `SSD-nn` | System sequence diagram of UC-nn | SSD-04 |
| `CO-nn.n` | Operation contract of UC-nn | CO-04.1 submitApplication |
| `BR-n` | Business rule | BR-4 |
| `A-n` | Working assumption for the customer to confirm | A6 |
| `ADR-nnnn` | Architecture decision record | ADR-0001 |

Names in the code follow these documents: entity classes and attributes come from the domain model,
service methods are the system operations of the contracts.
