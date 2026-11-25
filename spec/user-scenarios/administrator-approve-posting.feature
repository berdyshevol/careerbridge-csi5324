# UC-12 main success scenario, steps 1-8; not a minimum-scope item
@UC-12 @main-success-scenario
Feature: UC-12 Approve Job Posting

  Scenario: The administrator approves a posting and it opens on the job board
    Given a recruiter "Riley" with an active account
    And a posting "Night Nurse" waiting for approval
    And the administrator
    When the administrator logs in
    And the administrator approves "Night Nurse"
    Then the administrator is told "Night Nurse" is published
    And "Night Nurse" is not waiting for approval
    And "Night Nurse" is on the job board
