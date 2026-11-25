# UC-12 extension 5a; not a minimum-scope item
@UC-12 @extension-5a
Feature: UC-12 Approve Job Posting

  Scenario: The administrator returns a posting with a comment and it stays off the job board
    Given a recruiter "Riley" with an active account
    And a posting "Pharmacy Clerk" waiting for approval
    And the administrator
    When the administrator logs in
    And the administrator returns "Pharmacy Clerk" with the comment "Add the salary range."
    Then the administrator is told "Pharmacy Clerk" is returned with the comment "Add the salary range."
    And "Pharmacy Clerk" is not waiting for approval
    And "Pharmacy Clerk" is not on the job board
