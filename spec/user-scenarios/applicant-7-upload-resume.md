# An applicant with no resume puts one on file

**Use case:** UC-03: steps 5–7  
**Minimum scope:** Applicant 7 (the resume that goes with an application; UC-04 attaches a copy of it)

## Scenario

```gherkin
Feature: UC-03 Update Applicant Profile

  Scenario: An applicant with no resume puts one on file
    Given an applicant "Pat" is registered and has no resume on file
    When Pat uploads a resume in an accepted format
    Then that resume is Pat's only resume on file
    And Pat is shown its file name and today's date as the upload date
    And the resume is still on file when Pat views the profile again later
```
