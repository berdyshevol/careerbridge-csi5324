# UC-12 extension 5b; minimum scope item to confirm
@UC-12 @extension-5b
Feature: UC-12 Approve Job Posting

  Scenario: The administrator rejects a posting, and it cannot be sent for approval again
    Given a recruiter "Riley" with an active account
    And a posting "Quick Cash Job" waiting for approval
    And the administrator
    When the administrator logs in
    And the administrator rejects "Quick Cash Job" with the reason "The pay is not stated."
    Then the administrator is told "Quick Cash Job" is rejected
    And "Quick Cash Job" is not on the job board
    And "Quick Cash Job" cannot be submitted again
