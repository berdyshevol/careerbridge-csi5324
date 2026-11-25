# A resume that is not a PDF or DOCX is refused and the current resume is kept

**Use case:** UC-03: extension 6a  
**Minimum scope:** Applicant 7; the system validates input

## Scenario

```gherkin
Feature: UC-03 Update Applicant Profile

  Scenario: A resume that is not a PDF or DOCX is refused and the current resume is kept
    Given an applicant "Pat" is registered and logged in
    And "Pat" has the PDF resume "pat-resume" on file
    When "Pat" uploads a plain-text file as a new resume
    Then the file is refused, and "Pat" is told that only a PDF or DOCX of at most 5 MB is accepted
    And "pat-resume" is still the resume on file
```
