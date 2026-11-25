# UC-02 main success scenario, steps 1-3; minimum scope Applicant 1
@UC-02 @main-success-scenario @scope-applicant-1
Feature: UC-02 Register as Applicant

  Scenario: A visitor registers as an applicant and is logged in at once
    Given a visitor "Pat" who is not logged in
    When "Pat" registers as an applicant with a full name, a new email address and a password that meets the policy
    Then "Pat" is logged in as an applicant
    And "Pat" is invited to add a resume, with no resume on file
    When "Pat" logs out and logs in again with that email address and password
    Then "Pat" is logged in as an applicant
