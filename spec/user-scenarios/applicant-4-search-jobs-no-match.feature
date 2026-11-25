# UC-01 extension 2b; minimum scope Applicant 4, meaningful errors
@UC-01 @extension-2b @scope-applicant-4 @meaningful-errors
Feature: UC-01 Search Job Postings

  Scenario: A search that matches nothing says no posting matches
    Given an open posting "Backend Developer"
    And no open posting mentions "astronaut"
    When a visitor searches the open postings for "astronaut"
    Then the visitor is told that no posting matches the criteria
    And "Backend Developer" is not returned
    And the criteria are kept for another search
