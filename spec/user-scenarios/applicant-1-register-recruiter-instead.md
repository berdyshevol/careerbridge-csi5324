# A visitor who is hiring is sent to recruiter registration

**Use case:** UC-02: extension 1a (continues in UC-08)  
**Minimum scope:** Applicant 1

## Scenario

```gherkin
Given a visitor on "Create your account"
When they select "Register your organization" under the form
Then they are on the page to register a recruiter and an organization, /recruiter/register
# Today that page says "Not implemented yet. Owner: Reagan." until UC-08 is merged
```
