# A visitor registers as an applicant and is logged in at once

**Use case:** UC-02 Register as Applicant: main success scenario, steps 1–3  
**Minimum scope:** Applicant 1 (register)

## Scenario

```gherkin
Feature: UC-02 Register as Applicant

  Scenario: A visitor registers as an applicant and is logged in at once
    Given a visitor "Pat" who is not logged in
    And no account exists for Pat's email address
    When Pat registers as an applicant with a full name, that email address and a password that meets the policy
    Then an active applicant account is created for Pat
    And Pat is logged in as that applicant
    And Pat is invited to add a resume, with no resume on file
    When Pat logs out and logs in again with that email address and password
    Then Pat is logged in as that applicant
```
