# A visitor who gives no last name and a weak password is refused on both, and nothing is saved

**Use case:** UC-02: extensions 2a and 2c  
**Minimum scope:** Applicant 1; the system validates input

## Scenario

```gherkin
Feature: UC-02 Register as Applicant

  Scenario: A visitor who gives no last name and a weak password is refused on both, and nothing is saved
    Given a visitor "Pat" who is not logged in
    When Pat registers as an applicant with a full name that has no last name and a password that does not meet the password policy
    Then the registration is refused
    And the system reports that the full name needs a last name
    And the system reports the password policy: at least 10 characters, including a letter and a number
    And no account is created for Pat's email address
```
