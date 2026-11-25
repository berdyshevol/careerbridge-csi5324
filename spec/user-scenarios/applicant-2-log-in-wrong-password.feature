# Log In: an unknown email and a wrong password get the same answer; minimum scope Applicant 2, meaningful errors
@Log-In @scope-applicant-2 @meaningful-errors
Feature: Log In

  Scenario: A wrong password and an unknown email are refused alike
    Given an applicant "Sam" is registered
    When someone logs in as "Sam" with a wrong password
    Then the log-in is refused because the email or password is not right
    And nobody is logged in
    When someone logs in with an email address that has no account
    Then the log-in is refused because the email or password is not right
    And nobody is logged in
