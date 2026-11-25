# A search that matches nothing is told no posting matches

**Use case:** UC-01: extension 2b  
**Minimum scope:** Applicant 4; meaningful errors

## Scenario

```gherkin
Feature: UC-01 Search Job Postings

  Scenario: A search that matches nothing is told no posting matches
    Given an open posting "Backend Developer"
    And no open posting mentions "astronaut"
    When a visitor searches open postings for "astronaut"
    Then no postings are returned
    And the visitor is told that no posting matches their criteria, not that no posting is open
    And they may search again with other criteria
```
