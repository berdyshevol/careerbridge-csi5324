# An applicant's changed profile details are kept

**Use case:** UC-03 Update Applicant Profile: main success scenario, steps 1–4  
**Minimum scope:** Applicant 3 (view and update own profile)

## Scenario

```gherkin
Feature: UC-03 Update Applicant Profile

  Scenario: An applicant's changed profile details are kept
    Given an applicant "Casey" is registered and logged in
    When Casey views the profile
    Then Casey sees the current profile details, including the name and email Casey registered with
    And Casey sees whether a resume is on file
    When Casey changes the headline to "Data analyst"
    Then the system confirms the details are saved
    And when Casey views the profile again, the headline is "Data analyst"
```
