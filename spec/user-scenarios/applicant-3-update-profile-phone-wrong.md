# An applicant's malformed phone number is refused and the saved profile is kept

**Use case:** UC-03: extension 4a  
**Minimum scope:** Applicant 3; the system validates input

## Scenario

```gherkin
Feature: UC-03 Update Applicant Profile

  Scenario: An applicant's malformed phone number is refused and the saved profile is kept
    Given an applicant "Sam" is registered with the phone number "(254) 555-0100" in the profile
    And "Sam" is logged in
    When "Sam" updates the profile with the phone number "call me"
    Then the update is refused because the phone number is malformed
    And the profile still holds the phone number "(254) 555-0100"
```
