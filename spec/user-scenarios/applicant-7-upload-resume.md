# An applicant uploads a resume

**Use case:** UC-03: steps 5–7  
**Minimum scope:** Applicant 7 (the resume that goes with an application; UC-04 attaches a copy of it)

## Scenario

```gherkin
Given a visitor who has just registered (applicant-1-register) and has "No resume on file."
When they select "Choose a file" under "Resume on file" and pick a PDF, for example app/frontend/e2e/fixtures/Pat_Kim_Resume.pdf
Then "Resume on file" shows "Pat_Kim_Resume.pdf" and "Uploaded" with today's date
And after a reload the resume is still there
```
