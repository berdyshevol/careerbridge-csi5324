# Log In; minimum scope Applicant 2
@Log-In @scope-applicant-2
Feature: Log In

  Scenario: An applicant logs in and gets an applicant session
    Given an applicant "Sam" is registered
    When "Sam" logs in
    Then "Sam" is logged in as an applicant
