---
name: doc-check-manual
description: Check the CareerBridge User Manual (spec/user-manual.md, section 12) against the running application - its bold labels against the frontend sources, then each role's workflows walked in a browser on a local copy of the app - and propose text fixes. Use when asked to "check the user manual", "does the manual still match the app", "walk the workflows", before a deliverable or demo, or after screens changed. Not for checking a screen against its mockup (use screen-review), and never against the live site.
---

# Check the User Manual against the app

The manual promises that every bold menu entry, page title and button is written exactly as the
application shows it, and that each workflow works as described. You check both on a local copy
of the app, report the mismatches with a proposed text fix, and change nothing before a yes.

## 1. Labels

```bash
python3 tools/doc-check/manual-labels.py
```

It lists each bold label of `spec/user-manual.md` that is not in `app/frontend/src`, with its
line. A label the screen puts together at run time (a status and its reason) is checked in the
browser instead.

## 2. Start a local copy

Never the live site, never the shared Neon database. Use free ports, so another app on 3000 or
8080 is not what you test (`lsof -i :3100 -i :8180`; pick others if busy):

- No `app/backend/.env`: the in-memory H2 database with the demo data the manual describes. Every
  demo account logs in with `Baylor@2026` (app/README.md).

  ```bash
  cd app/backend && PORT=8180 FRONTEND_ORIGINS=http://localhost:3100 ./mvnw -q spring-boot:run
  ```

- With `app/backend/.env`: the way the end-to-end tests start it (`playwright.config.ts`), a fresh
  database from the test classpath. The demo accounts log in with the test password of
  `app/backend/src/test/resources/config/application.properties`; demo postings are switched on
  here because the walk needs them.

  ```bash
  cd app/backend && PORT=8180 FRONTEND_ORIGINS=http://localhost:3100 ./mvnw -q spring-boot:test-run \
    -Dspring-boot.run.arguments=--careerbridge.demo.postings=true
  ```

- Frontend: `cd app/frontend && NEXT_PUBLIC_API_URL=http://localhost:8180 npx next dev -p 3100`.

Run both in the background and wait until `curl -sf http://localhost:8180/api/postings` and
`curl -sf http://localhost:3100` answer.

## 3. Walk the workflows

Launch four subagents in parallel, one per role: visitor (§12.1 log in and out, §12.2),
applicant (§12.3), recruiter (§12.4), administrator (§12.5). Give each:

- the role's section of the manual, the base URL `http://localhost:3100` and its own accounts
  from §12.1, so the walks do not change each other's data (visitor: registers new accounts;
  applicant: `jordan.lee@example.com` for the existing applications and `applicant1@example.com`
  for a first application; recruiter: `riley.chen@example.com`; administrator:
  `admin@careerbridge.example`), with the password from step 2;
- the task: follow every workflow step by step with Playwright (`chromium.launch()` from
  `@playwright/test`, a script run from `app/frontend` so the package resolves, screenshots saved
  outside the repository); for each step note whether the page, the labels, the order and the
  result are as the manual says;
- the report: one line per mismatch with the manual's line, what the app shows, and the proposed
  manual text. A step the app cannot do at all is a finding for the code, not the manual: say so.
  The subagent writes no file in the repository.

## 4. Stop and report

Stop both servers (`lsof -ti :8180 -ti :3100 | xargs kill`) and check the ports are free. Report:
the label check, then per role the mismatches with the proposed text, then what could not be
checked and why. Ask "Shall I make these changes to spec/user-manual.md?". On a yes, hand them to
the `implement-task` skill.

## Do not

- Do not edit the manual, the code or the test data before a yes.
- Do not log in to the live site or use real passwords; only the local copy and its demo accounts.
- Do not commit screenshots or walk scripts. Do not submit or send anything.
