# A visitor views an open posting's details without logging in

**Use case:** UC-01: step 2, the posting's details (shown on its page, UC-04 step 1)  
**Minimum scope:** Applicant 5 (view a job's details)

## Scenario

```gherkin
Feature: UC-01 Search Job Postings

  Scenario: A visitor views an open posting's details without logging in
    Given a recruiter "Riley" with an active account
    And Riley's organization has an open posting "Platform Engineer" with a location, an employment type, a number of openings, an application deadline, a description and requirements
    When a visitor who is not logged in views the details of "Platform Engineer"
    Then the visitor sees its title, organization, location, employment type, number of openings, application deadline, description and requirements
    And no applicant or application data is shown
```
