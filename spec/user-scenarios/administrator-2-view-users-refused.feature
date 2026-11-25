# Minimum scope Administrator 2 (NFR-ADM.1); permissions by role
@Administration @scope-administrator-2 @permissions
Feature: Administration

  Scenario: An applicant cannot see the list of users
    Given an applicant "Sam" is registered and logged in
    When "Sam" asks to see the users
    Then "Sam" is refused because only an administrator sees the users
