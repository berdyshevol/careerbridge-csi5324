# CareerBridge — specification

What the system must do and how it is built. These files are the current version; they change
together with the code. If code and specification disagree, fix one of them in the same pull request.

| File | Contents | Documentation section |
| --- | --- | --- |
| [vision.md](vision.md) | Introduction, product perspective, assumptions (A1–A18) and dependencies | 1, 2 |
| [requirements.md](requirements.md) | Functional and non-functional requirements per use case, requirements clarifications, traceability matrix | 3 |
| [use-cases.md](use-cases.md) | Use-case diagram, application pipeline, posting lifecycle, the 15 fully-dressed use cases, subfunctions | 4.1, 4.2 |
| [ssd-and-contracts.md](ssd-and-contracts.md) | One system sequence diagram per use case and the operation contracts | 4.3 |
| [ui-drafts.md](ui-drafts.md) | Wireframes | 4.4 |
| [domain-model.md](domain-model.md) | Conceptual classes, attributes and associations, as a figure and as text | 5 |
| [design.md](design.md) | Design sequence diagrams and the design class diagram | 6, 7 |
| [architecture.md](architecture.md) | Parts of the system, layers, deployment | 8 |
| [adr/](adr/) | Architecture decision records | — |
| [team.md](team.md) | Members and roles | 10 |

Figures are in [diagrams/](diagrams/).

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
