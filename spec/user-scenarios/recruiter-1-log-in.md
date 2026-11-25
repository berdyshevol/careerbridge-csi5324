# A recruiter logs in and reaches only the recruiter's work

**Use case:** Log In  
**Minimum scope:** Recruiter 1 (log in)

## Scenario

```gherkin
Feature: Log In

  Scenario: A recruiter logs in and reaches only the recruiter's work
    Given a recruiter "Riley" with an active account
    And Riley is not logged in
    When Riley logs in with Riley's email and password
    Then a session starts for Riley in the recruiter role
    And Riley can reach the recruiter's work
    And Riley is offered nothing that belongs to an applicant
    When Riley logs out
    Then Riley's session ends
    And the recruiter's work is no longer reachable until Riley logs in again
```
