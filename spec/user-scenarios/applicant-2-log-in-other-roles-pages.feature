# Log In: the role decides what the user can reach; minimum scope Applicant 2, permissions by role
@Log-In @scope-applicant-2 @permissions
Feature: Log In

  Scenario: An applicant cannot review job postings, which only an administrator does
    Given a posting "Backend Developer" waiting for approval
    And an applicant "Sam" is registered and logged in
    When "Sam" asks to review the postings waiting for approval
    Then "Sam" is refused because only an administrator reviews postings
    And "Sam" is not shown "Backend Developer"
    And "Backend Developer" is still waiting for approval
    And "Sam" is offered only the applicant's own work
