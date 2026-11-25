# An applicant logs in and gets an applicant session

**Use case:** Log In: the user enters email and password, the system starts a session with the role  
**Minimum scope:** Applicant 2 (log in)

## Scenario

```gherkin
Feature: Log In

  Scenario: An applicant logs in and gets an applicant session
    Given an applicant "Sam" is registered
    And Sam is not logged in
    When Sam logs in with Sam's email and password
    Then the system starts a session for Sam
    And the session carries the Applicant role
```
