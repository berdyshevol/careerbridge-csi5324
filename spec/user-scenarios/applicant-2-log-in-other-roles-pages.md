# An applicant cannot review job postings, which only an administrator does

**Use case:** Log In: the role decides what the user can reach  
**Minimum scope:** Applicant 2; permissions follow the role

## Scenario

```gherkin
Feature: Log In

  Scenario: An applicant cannot review job postings, which only an administrator does
    Given an applicant "Sam" is registered
    And a recruiter "Riley" with an active account has submitted a posting "Backend Developer" for review
    And "Sam" is logged in
    When "Sam" asks to review the postings awaiting approval
    Then "Sam" is refused because only an administrator reviews postings
    And "Sam" is not shown the postings awaiting approval
    And "Backend Developer" stays awaiting review
    And "Sam" is offered only the applicant's own functions
```
