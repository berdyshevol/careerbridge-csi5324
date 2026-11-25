# A file that is not a PDF or DOCX is refused

**Use case:** UC-03: extension 6a  
**Minimum scope:** Applicant 7; the system validates input

## Scenario

```gherkin
Given the applicant from applicant-7-upload-resume, with "Pat_Kim_Resume.pdf" on file
When they choose a text file, for example notes.txt
Then the page says "notes.txt was not uploaded. Use a PDF or DOCX file of 5 MB or less."
And "Pat_Kim_Resume.pdf" is still on file
```
