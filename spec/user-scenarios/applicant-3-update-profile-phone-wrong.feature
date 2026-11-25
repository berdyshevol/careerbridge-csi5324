# UC-03 extension 4a; minimum scope Applicant 3, input validation
@UC-03 @extension-4a @scope-applicant-3 @validation
Feature: UC-03 Update Applicant Profile

  Scenario: A malformed phone number is refused and the saved profile is kept
    Given an applicant "Sam" is registered with the phone number "(254) 555-0100"
    And "Sam" is logged in
    When "Sam" changes the phone number to "call me"
    Then the update is refused because the phone number is malformed
    And the profile of "Sam" has the phone number "(254) 555-0100"
