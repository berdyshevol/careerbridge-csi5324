# UC-03 extension 6a; minimum scope Applicant 7, input validation
@UC-03 @extension-6a @scope-applicant-7 @validation
Feature: UC-03 Update Applicant Profile

  Scenario: A resume that is not a PDF or DOCX is refused and the current resume is kept
    Given an applicant "Pat" is registered and logged in
    And "Pat" has uploaded a PDF resume
    When "Pat" uploads a plain-text file as the resume
    Then the file is refused because only a PDF or DOCX of at most 5 MB is accepted
    And the PDF resume is still on file
