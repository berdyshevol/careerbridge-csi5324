# Anyone opens a job's details

**Use case:** UC-01: step 2, the posting's details (shown on its page, UC-04 step 1)  
**Minimum scope:** Applicant 5 (view a job's details)

## Scenario

```gherkin
Given a visitor on the job board
When they select "Backend Developer"
Then the posting page shows "Backend Developer" at "Brazos Analytics" with its location, employment type, openings and application deadline
And "About the role", and "Requirements" with "Java, Spring Boot, PostgreSQL"
When they select "← Back to results"
Then they are back on the job board
```
