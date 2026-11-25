# A visitor finds the open postings that match a keyword

**Use case:** UC-01 Search Job Postings: main success scenario, steps 1–2  
**Minimum scope:** Applicant 4 (browse and search jobs)

## Scenario

```gherkin
Feature: UC-01 Search Job Postings

  Scenario: A visitor finds the open postings that match a keyword
    Given open postings "Data Analyst Intern" and "Backend Developer"
    And a closed posting "Logistics Analyst"
    And a posting "Research Analyst" that is waiting for approval
    When a visitor who is not logged in searches the open postings for "analyst"
    Then "Data Analyst Intern" is returned with its title, organization, location, employment type, application deadline, description, requirements and number of openings
    And "Backend Developer" is not returned, because it does not match
    And neither "Logistics Analyst" nor "Research Analyst" is returned, because only open postings are public
```
