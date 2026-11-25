# A wrong password and an unknown email are refused alike

**Use case:** Log In: an unknown email and a wrong password get the same answer  
**Minimum scope:** Applicant 2; meaningful errors

## Scenario

```gherkin
Feature: Log In

  Scenario: A wrong password and an unknown email are refused alike
    Given an applicant "Sam" is registered
    When someone logs in with Sam's email and a wrong password
    Then the log-in is refused because the credentials are not right
    And no session is started
    When someone logs in with an email that has no account
    Then the log-in is refused with the same answer, so it does not reveal who has an account
    And no session is started
```
