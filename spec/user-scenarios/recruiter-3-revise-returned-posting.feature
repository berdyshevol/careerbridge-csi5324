# UC-11 extension 6a; minimum scope Recruiter 3
@UC-11 @extension-6a @scope-recruiter-3
Feature: UC-11 Create Job Posting

  Scenario: A recruiter revises a returned posting and sends it for approval again
    Given a recruiter "Riley" with an active account
    And a posting "Night Clerk" waiting for approval
    And "Night Clerk" was returned with the comment "Add the salary range."
    And "Riley" is logged in
    When "Riley" opens "Night Clerk" to revise it
    Then "Riley" sees the comment "Add the salary range."
    When "Riley" adds the salary range "40,000 USD per year" and submits it again
    Then "Night Clerk" is waiting for approval
    And "Night Clerk" is not on the job board
