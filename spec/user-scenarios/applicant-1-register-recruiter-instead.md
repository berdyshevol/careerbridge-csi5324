# A visitor who wants a recruiter account is handed to recruiter and organization registration

**Use case:** UC-02: extension 1a (continues in UC-08)  
**Minimum scope:** Applicant 1

## Scenario

```gherkin
Feature: UC-02 Register as Applicant

  Scenario: A visitor who wants a recruiter account is handed to recruiter and organization registration
    Given a visitor "Casey" who is not logged in
    And "Casey" has begun to register as an applicant
    When "Casey" chooses a recruiter account instead
    Then "Casey" is handed to registering a recruiter and an organization
    And no applicant account is created for "Casey"
```
