# A recruiter logs in

**Use case:** Log In  
**Minimum scope:** Recruiter 1 (log in)

## Scenario

```gherkin
Given Riley Chen is not logged in
When Riley selects "Log in" in the header and logs in with Riley's email and password
Then the header shows "Riley Chen" as a recruiter
And the navigation holds only the recruiter's entries, nothing of an applicant
When Riley logs out from the account menu
Then the header offers "Log in" again
```
