# UC-03 main success scenario, steps 1-4; minimum scope Applicant 3
@UC-03 @main-success-scenario @scope-applicant-3
Feature: UC-03 Update Applicant Profile

  Scenario: An applicant's changed profile details are kept
    Given an applicant "Casey" is registered and logged in
    When "Casey" views the profile
    Then "Casey" sees the name and email address "Casey" registered with
    And "Casey" sees that no resume is on file
    When "Casey" changes the headline to "Data analyst"
    Then the profile details are saved
    And the profile of "Casey" has the headline "Data analyst"
