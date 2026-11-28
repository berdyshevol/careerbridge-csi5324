# UC-14 main success scenario, steps 3-4; minimum-scope item to confirm with Oleg
@UC-14 @main-success-scenario @permissions
Feature: UC-14 Screen Applications

  Scenario: A recruiter reviews one application and sees its resume copy, the applicant's details and its history, and nothing of the applicant's other applications
    Given a recruiter "Riley" with an active account
    And an open posting "Data Analyst" of the organization "Riley" acts for
    And an open posting "Night Nurse" of another organization
    And an applicant "Sam" has applied to "Data Analyst"
    And "Sam" has also applied to "Night Nurse"
    And "Riley" is logged in
    When "Riley" takes up the application of "Sam" to "Data Analyst"
    Then "Riley" is shown the resume copy that "Sam" sent with the application
    And "Riley" is shown the profile details of "Sam"
    And "Riley" is shown that the application is at Applied
    And "Riley" is shown nothing about the application of "Sam" to "Night Nurse"
