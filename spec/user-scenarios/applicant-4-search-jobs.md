# Anyone searches the open jobs

**Use case:** UC-01 Search Job Postings: main success scenario, steps 1–2  
**Minimum scope:** Applicant 4 (browse and search jobs)

## Scenario

```gherkin
Given a visitor on the job board
Then only open postings are listed: "Backend Developer" is there; "QA Engineer" (closed), "Product Designer" (pending) and "Marketing Coordinator" (draft) are not
When they type "analyst" in "Keywords" and select "Search"
Then "Data Analyst Intern" and "Logistics Analyst" are listed and "Backend Developer" is not
When they clear "Keywords", choose "On-site" in "Location" and "Internship" in "Employment type", and select "Search"
Then "Data Analyst Intern" is listed and "IT Support Specialist" is not
```
