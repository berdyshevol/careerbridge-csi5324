# Log In: a session with the Administrator role, which UC-12 requires (FR-UC12.1); minimum scope Administrator 1
@Log-In @UC-12 @scope-administrator-1
Feature: Log In

  Scenario: The administrator logs in and reaches the posting approval queue
    Given the administrator
    When the administrator logs in
    Then the administrator is logged in as the administrator
    And the administrator can review the postings waiting for approval
