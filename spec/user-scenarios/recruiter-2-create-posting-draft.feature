# UC-11 extension 3b; minimum scope Recruiter 2
@UC-11 @extension-3b @scope-recruiter-2
Feature: UC-11 Create Job Posting

  Scenario: A posting saved as a draft is not sent for approval or shown to the public
    Given a recruiter "Riley" with an active account
    And "Riley" is logged in
    When "Riley" saves the posting "Data Engineer" as a draft
    Then the posting is kept as a draft
    And "Data Engineer" is not waiting for approval
    And "Data Engineer" is not on the job board
