# A logged-in user cannot use another role's page

**Use case:** Log In: the role decides what the user can reach  
**Minimum scope:** Applicant 2; permissions follow the role

## Scenario

```gherkin
Given Jordan Lee is logged in
When Jordan opens the posting approvals page, /admin/postings
Then the page says Jordan is logged in as an applicant and only an administrator reviews postings
And no posting can be approved there
And Jordan's navigation holds only Home, Find jobs, Applications and Profile
```
