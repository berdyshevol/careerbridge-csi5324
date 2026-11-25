# UC-11 extension 5a; minimum scope Recruiter 2, input validation
@UC-11 @extension-5a @scope-recruiter-2 @validation @meaningful-errors
Feature: UC-11 Create Job Posting

  Scenario: A posting with no title is refused and nothing is saved
    Given a recruiter "Riley" with an active account
    And "Riley" is logged in
    When "Riley" saves a posting with no title
    Then the posting is refused because the title is missing
    And no posting is saved
