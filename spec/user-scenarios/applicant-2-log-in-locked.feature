# Log In: five failed attempts in 15 minutes lock the account for 15 minutes (A15); minimum scope Applicant 2
@Log-In @A15 @scope-applicant-2 @authentication
Feature: Log In

  Scenario: Five failed log-ins lock the account, even against the right password
    Given an applicant "Sam" is registered
    When someone fails to log in as "Sam" five times
    And "Sam" then logs in with the right password
    Then the log-in is refused because the account is locked
    And nobody is logged in
