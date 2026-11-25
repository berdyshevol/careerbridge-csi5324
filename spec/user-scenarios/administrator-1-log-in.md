# The administrator logs in and reaches the posting approval queue

**Use case:** Log In: starts a session with the Administrator role, which UC-12 requires (FR-UC12.1)  
**Minimum scope:** Administrator 1 (log in)

## Scenario

```gherkin
Feature: Log In

  Scenario: The administrator logs in and reaches the posting approval queue
    Given the administrator
    And the administrator is not logged in
    When the administrator logs in with their email and password
    Then a session starts with the Administrator role
    And the administrator can reach the job-posting approval queue
```
