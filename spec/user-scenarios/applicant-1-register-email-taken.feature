# UC-02 extension 2b; minimum scope Applicant 1, meaningful errors
@UC-02 @extension-2b @scope-applicant-1 @meaningful-errors
Feature: UC-02 Register as Applicant

  Scenario: Registration is refused when an account already exists for the email
    Given an applicant "Sam" is registered
    When a visitor registers as an applicant with the email address of "Sam"
    Then the registration is refused because an account already exists for that email
    And the visitor is offered to log in instead
    And "Sam" still has only the original account
