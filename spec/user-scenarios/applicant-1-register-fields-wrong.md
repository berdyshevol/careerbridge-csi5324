# Registration with a one-word name and a weak password is refused

**Use case:** UC-02: extensions 2a and 2c  
**Minimum scope:** Applicant 1; the system validates input

## Scenario

```gherkin
Given a visitor on "Create your account"
When they fill in "Full name" with "Pat", "Email" with "pat@example.com" and "Password" with "short", and select "Create account"
Then "Full name" says "Enter your first and last name."
And "Password" says "The password needs at least 10 characters, including a letter and a number."
And they are still on "Create your account", not logged in
```
