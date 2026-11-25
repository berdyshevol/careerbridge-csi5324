# An applicant registers

**Use case:** UC-02 Register as Applicant: main success scenario, steps 1–3  
**Minimum scope:** Applicant 1 (register)

## Scenario

```gherkin
Given a visitor on the job board who is not logged in
When they select "Register" in the header
And they fill in "Full name" with "Pat Kim", "Email" with an address nobody has used, and "Password" with "Sunrise-2026x"
And they select "Create account"
Then they are on "Profile and resume" with "No resume on file."
And the header shows "Pat Kim" as an applicant
When they log out from the account menu and log in again with that email and password
Then the header shows "Pat Kim" again
```
