# UC-11 main success scenario, steps 1-7; minimum scope Recruiter 2
@UC-11 @main-success-scenario @scope-recruiter-2
Feature: UC-11 Create Job Posting

  Scenario: A recruiter creates a posting and sends it for approval
    Given a recruiter "Riley" with an active account
    And "Riley" is logged in
    When "Riley" saves the posting "Cloud Engineer" as a draft
    And "Riley" submits it for approval
    Then the posting is sent to the administrator for approval
    And "Cloud Engineer" is waiting for approval
    And "Cloud Engineer" is not on the job board
