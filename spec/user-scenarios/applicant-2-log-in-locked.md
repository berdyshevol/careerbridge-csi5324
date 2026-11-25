# Five failed log-ins lock the account, even against the right password

**Use case:** Log In: 5 failed attempts in 15 minutes lock the account for 15 minutes (A15)  
**Minimum scope:** Applicant 2; the system authenticates users

## Scenario

```gherkin
Feature: Log In

  Scenario: Five failed log-ins lock the account, even against the right password
    Given an applicant "Sam" is registered
    When someone fails to log in as Sam with a wrong password five times within 15 minutes
    Then the fifth attempt is refused because the account is locked
    When Sam then logs in with the right password within the 15 minutes
    Then Sam is refused because the account is locked
    And no session is started for Sam
```
