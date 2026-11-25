# UC-01 step 2, the details of a posting, shown on its own page (UC-04 step 1); minimum scope Applicant 5
@UC-01 @scope-applicant-5
Feature: UC-01 Search Job Postings

  Scenario: A visitor views an open posting's details without logging in
    Given an open posting "Platform Engineer"
    When a visitor views the details of "Platform Engineer"
    Then the visitor sees the title, organization, location, employment type, openings, description and requirements of "Platform Engineer"
    And no applicant data is shown
