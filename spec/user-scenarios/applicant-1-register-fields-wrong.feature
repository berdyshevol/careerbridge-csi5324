# UC-02 extensions 2a and 2c; minimum scope Applicant 1, input validation
@UC-02 @extension-2a @extension-2c @scope-applicant-1 @validation
Feature: UC-02 Register as Applicant

  Scenario: A registration with no last name and a weak password is refused on both, and nothing is saved
    Given a visitor "Pat" who is not logged in
    When "Pat" registers as an applicant with a full name that has no last name and a password that does not meet the policy
    Then the registration is refused because the full name needs a last name
    And the registration is refused because the password needs at least 10 characters, including a letter and a number
    And no account exists for "Pat"
