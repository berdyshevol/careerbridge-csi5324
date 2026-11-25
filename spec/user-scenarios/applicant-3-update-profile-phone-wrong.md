# A malformed phone number is refused

**Use case:** UC-03: extension 4a  
**Minimum scope:** Applicant 3; the system validates input

## Scenario

```gherkin
Given Jordan Lee is logged in on "Profile and resume"
When Jordan changes "Phone" to "call me" and selects "Save details"
Then "Phone" says "Enter a phone number like (254) 555-0142."
And after a reload "Phone" still shows Jordan's old number
```
