# UC-03 steps 5-7; minimum scope Applicant 7 (UC-04 sends a copy of this resume with each application)
@UC-03 @steps-5-7 @scope-applicant-7
Feature: UC-03 Update Applicant Profile

  Scenario: An applicant with no resume puts one on file
    Given an applicant "Pat" is registered and logged in
    When "Pat" uploads a PDF resume
    Then the resume is on file with its file name and today's date
    And the resume is still on file when "Pat" views the profile again
