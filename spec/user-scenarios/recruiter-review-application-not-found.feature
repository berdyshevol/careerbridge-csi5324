# UC-14 extension *a, the answer "not found"; minimum-scope item to confirm with Oleg
@UC-14 @extension-a @permissions
Feature: UC-14 Screen Applications

  Scenario: An application of another organization is reported as not found and nothing of it is shown
    Given a recruiter "Riley" with an active account
    And an open posting "Night Nurse" of another organization
    And an applicant "Pat" has applied to "Night Nurse"
    And "Riley" is logged in
    When "Riley" asks for the application of "Pat" to "Night Nurse"
    Then "Riley" is told that the application was not found
    And "Riley" is shown nothing about "Pat"
