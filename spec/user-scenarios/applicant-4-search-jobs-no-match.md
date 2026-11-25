# A search with no match says so

**Use case:** UC-01: extension 2b  
**Minimum scope:** Applicant 4; meaningful errors

## Scenario

```gherkin
Given a visitor on the job board
When they search "Keywords" for "astronaut"
Then the page says "No matching postings."
And "astronaut" stays in "Keywords" so they can change it
```
