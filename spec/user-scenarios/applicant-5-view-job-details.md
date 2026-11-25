# Anyone opens a job's details

**Use cases:** UC-01

## Scenario

```gherkin
Given a visitor on the job board
When they select "Backend Developer"
Then the posting page shows the title "Backend Developer", the organization "Brazos Analytics", its location, type, openings and deadline
And "About the role" and "Requirements" with "Java, Spring Boot, PostgreSQL"
```
