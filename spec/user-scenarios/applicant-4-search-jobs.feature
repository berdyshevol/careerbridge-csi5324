# UC-01 main success scenario, steps 1-2; minimum scope Applicant 4
@UC-01 @main-success-scenario @scope-applicant-4
Feature: UC-01 Search Job Postings

  Scenario: A visitor finds the open postings that match a keyword
    Given an open posting "Market Analyst"
    And an open posting "Cloud Developer"
    And a posting "Research Analyst" waiting for approval
    When a visitor searches the open postings for "analyst"
    Then "Market Analyst" is returned with its organization, location and employment type
    And "Cloud Developer" is not returned
    And "Research Analyst" is not returned
