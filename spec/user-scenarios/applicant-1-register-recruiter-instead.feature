# UC-02 extension 1a, which continues in UC-08; minimum scope Applicant 1
@UC-02 @extension-1a @scope-applicant-1
Feature: UC-02 Register as Applicant

  Scenario: A visitor who wants a recruiter account is handed to recruiter and organization registration
    Given a visitor "Casey" who is not logged in
    When "Casey" starts to register as an applicant and chooses a recruiter account instead
    Then "Casey" is handed to registering a recruiter and an organization
    And no applicant account exists for "Casey"
