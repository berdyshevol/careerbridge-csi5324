# UC-13 extension *a; minimum scope Recruiter 4
@UC-13 @extension-a @scope-recruiter-4
Feature: UC-13 Expire Job Posting

  Scenario: A recruiter closes their open posting and it leaves the job board
    Given a recruiter "Riley" with an active account
    And an open posting "Dock Supervisor" of the organization "Riley" acts for
    And "Riley" is logged in
    When "Riley" closes "Dock Supervisor"
    Then "Dock Supervisor" shows as closed by its recruiter
    And "Dock Supervisor" is not on the job board
