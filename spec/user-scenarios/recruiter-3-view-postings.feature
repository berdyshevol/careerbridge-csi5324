# UC-14 main success scenario, steps 1-2; minimum scope Recruiter 3, permissions by role
@UC-14 @main-success-scenario @scope-recruiter-3 @permissions
Feature: UC-14 Screen Applications

  Scenario: A recruiter sees every posting of the organization with its applications at each stage
    Given a recruiter "Riley" with an active account
    And an open posting "Data Analyst" of the organization "Riley" acts for
    And an open posting "Night Nurse" of another organization
    And an applicant "Sam" has applied to "Data Analyst"
    And an applicant "Jo" has applied to "Data Analyst"
    And "Riley" is logged in
    When "Riley" reviews the postings of the organization
    Then "Data Analyst" is shown with 2 applications at Applied
    And "Riley" is not shown "Night Nurse"
