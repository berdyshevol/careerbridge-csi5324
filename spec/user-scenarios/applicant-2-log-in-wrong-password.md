# A wrong password or an unknown email gets the same answer

**Use case:** Log In: an unknown email and a wrong password get the same answer  
**Minimum scope:** Applicant 2; meaningful errors

## Scenario

```gherkin
Given a visitor on "Log in"
When they log in as "sam.rivera@example.com" with the password "not-the-password-1"
Then the page says "The email or password is not right. Check both and try again."
When they log in as "nobody@example.com" with any password
Then the page says the same, so it does not reveal who has an account
And nobody is logged in
```
