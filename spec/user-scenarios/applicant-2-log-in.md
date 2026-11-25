# An applicant logs in

**Use case:** Log In: the user enters email and password, the system starts a session with the role  
**Minimum scope:** Applicant 2 (log in)

## Scenario

```gherkin
Given Jordan Lee is not logged in and is on the job board
When Jordan selects "Log in" in the header
And fills in Jordan's email and password and selects "Log in"
Then Jordan is back on the job board
And the header shows "Jordan Lee" as an applicant
```
