# Registration with an email that already has an account

**Use case:** UC-02: extension 2b  
**Minimum scope:** Applicant 1; meaningful errors

## Scenario

```gherkin
Given a visitor on "Create your account"
When they register as "Sam Rivera" with "sam.rivera@example.com" and the password "Sunrise-2026x"
Then "Email" says "An account already exists for this email. Log in instead"
When they select "Log in instead"
Then they are on "Log in"
```
