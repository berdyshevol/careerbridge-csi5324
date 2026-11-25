# Registration is refused when an account already exists for the email

**Use case:** UC-02: extension 2b  
**Minimum scope:** Applicant 1; meaningful errors

## Scenario

```gherkin
Feature: UC-02 Register as Applicant

  Scenario: Registration is refused when an account already exists for the email
    Given an applicant "Sam" is registered
    When a visitor registers as an applicant with Sam's email address, another full name and another valid password
    Then the registration is refused because an account already exists for that email
    And the visitor is offered to log in instead
    And no new account is created
```
