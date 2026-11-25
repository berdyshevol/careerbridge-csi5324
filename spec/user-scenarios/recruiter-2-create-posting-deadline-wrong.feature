# UC-11 extension 5b; minimum scope Recruiter 2, input validation
@UC-11 @extension-5b @scope-recruiter-2 @validation @meaningful-errors
Feature: UC-11 Create Job Posting

  Scenario: A posting whose deadline is more than 90 days away cannot be sent for approval
    Given a recruiter "Riley" with an active account
    And "Riley" is logged in
    When "Riley" saves the posting "Lab Analyst" with a deadline more than 90 days away
    And "Riley" submits it for approval
    Then the submission is refused because the deadline must be 1 to 90 days away
    And "Lab Analyst" is not waiting for approval
