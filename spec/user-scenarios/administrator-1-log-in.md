# The administrator logs in

**Use cases:** Log In

## Scenario

```gherkin
Given Avery Morgan is not logged in
When Avery opens the posting approvals page, /admin/postings
Then the page offers "Log in" instead of the queue
When Avery selects "Log in" there and logs in with the administrator's email and password
Then Avery is back on the posting approvals queue
And the header shows "Avery Morgan" as the administrator
```
