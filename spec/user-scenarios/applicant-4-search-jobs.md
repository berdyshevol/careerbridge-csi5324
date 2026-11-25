# Anyone searches the open jobs

**Use cases:** UC-01

## Scenario

```gherkin
Given a visitor on the job board
Then only open postings are listed: Backend Developer is there, QA Engineer (closed) and Product Designer (pending) are not
When they type "analyst" in "Keywords" and select "Search"
Then Data Analyst Intern and Logistics Analyst are listed and Backend Developer is not
When they search for "astronaut"
Then the page says "No matching postings." and "astronaut" stays in "Keywords"
```
