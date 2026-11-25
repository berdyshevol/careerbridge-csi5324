# Five wrong passwords lock the account

**Use case:** Log In: 5 failed attempts in 15 minutes lock the account for 15 minutes (A15)  
**Minimum scope:** Applicant 2; the system authenticates users

## Scenario

```gherkin
Given a visitor on "Log in"
When they try "sam.rivera@example.com" with a wrong password five times
Then the page says "This account is locked. Five failed log-ins within 15 minutes lock it for 15 minutes."
When they now try Sam's right password
Then the page still says the account is locked
# Restart the backend, or wait 15 minutes, before Sam logs in again
```
