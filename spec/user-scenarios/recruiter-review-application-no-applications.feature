# UC-14 extension 3a; minimum-scope item to confirm with Oleg
@UC-14 @extension-3a
Feature: UC-14 Screen Applications

  Scenario: A posting that took no applications says so
    Given a recruiter "Riley" with an active account
    And an open posting "Data Analyst" of the organization "Riley" acts for
    And "Riley" is logged in
    When "Riley" asks to review the applications to "Data Analyst"
    Then "Riley" is told that "Data Analyst" has no applications
