# Minimum scope Administrator 2 (FR-ADM.1)
@Administration @scope-administrator-2
Feature: Administration

  Scenario: The administrator sees every user with their role
    Given an applicant "Sam" is registered
    And a recruiter "Riley" with an active account
    And the administrator
    When the administrator logs in
    And the administrator views the users
    Then "Sam" is listed as an applicant
    And "Riley" is listed as a recruiter
    And the administrator is listed as an administrator
