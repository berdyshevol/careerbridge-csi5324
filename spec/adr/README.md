# Architecture decision records

One file per decision that shapes the code. A record is not edited after it is accepted; a changed
decision gets a new record that names the one it replaces.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-spring-boot-and-nextjs.md) | Backend on Spring Boot, frontend on Next.js | Accepted |
| [0002](0002-repository-layout.md) | `spec/` for the specification, `app/backend/` and `app/frontend/` for the code | Accepted |
| [0003](0003-pull-requests-and-manual-deploy.md) | Changes reach `main` through pull requests; deploys are started by hand | Accepted |
| [0004](0004-frontend.md) | One responsive frontend for phone, tablet and laptop, built with Tailwind and daisyUI | Accepted |
| [0005](0005-user-inheritance.md) | Applicant, Recruiter and Administrator are stored with joined-table inheritance | Accepted |
| [0006](0006-public-backend-is-read-only-without-login.md) | The public backend changes no data until users can log in | Accepted |
| [0007](0007-administrator-signs-in-with-http-basic.md) | The Administrator signs in with HTTP Basic until Log In exists | Accepted |
| [0008](0008-pull-requests-name-their-ticket.md) | A pull request names its ticket; Jira follows it; Claude reviews it | Accepted |
