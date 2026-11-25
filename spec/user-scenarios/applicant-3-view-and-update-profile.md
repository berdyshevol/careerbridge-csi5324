# An applicant views and updates the profile

**Use case:** UC-03 Update Applicant Profile: main success scenario, steps 1–4  
**Minimum scope:** Applicant 3 (view and update own profile)

## Scenario

```gherkin
Given Jordan Lee is logged in
When Jordan opens "Profile" in the navigation
Then "Profile and resume" shows Jordan's name, email, phone and the resume "Jordan_Lee_Resume.pdf"
When Jordan changes "Headline" to "Data analyst" and selects "Save details"
Then "Profile saved." appears next to the button
And after a reload "Headline" still reads "Data analyst"
```
