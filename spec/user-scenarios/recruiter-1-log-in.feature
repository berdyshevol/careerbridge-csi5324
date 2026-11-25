# Log In; minimum scope Recruiter 1
@Log-In @scope-recruiter-1
Feature: Log In

  Scenario: A recruiter logs in and reaches only the recruiter's work
    Given a recruiter "Riley" with an active account
    When "Riley" logs in
    Then "Riley" is logged in as a recruiter
    And "Riley" can create a job posting
    And "Riley" is offered nothing of an applicant's work
    When "Riley" logs out
    Then nobody is logged in
    And creating a job posting asks to log in first
