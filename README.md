# CareerBridge

A recruiting and application management system: a job board where many organizations publish
postings and applicants apply across them. Semester project of team CareerBridge for CSI 5324
Software Engineering (Baylor University, Fall 2026).

- **Application:** <https://careerbridge-csi5324.vercel.app>
- **Scrum board:** <https://careerbridge-csi5324.atlassian.net/jira/software/projects/SCRUM/boards/1>

## What is where

- [spec/](spec/README.md) — the specification: requirements, use cases, domain model, design,
  architecture and decision records.
- [app/](app/README.md) — the application: [backend/](app/backend/) (Spring Boot) and
  [frontend/](app/frontend/) (Next.js). Start with `app/README.md` to run it.
- [spec/team.md](spec/team.md) — who does what.

## Contributing

Work in your own branch and open a pull request into `main`. The tests run on the pull request and
must pass before it can be merged.

## Jira from Claude Code

The repository carries the address of the Jira server for Claude Code (`.mcp.json`), so nobody has to configure it.

1. Open Claude Code in the repository folder. The first time it asks whether to use the `atlassian` server: say yes.
2. Type `/mcp`, choose `atlassian` and sign in with your Atlassian account in the browser. Once per computer.
3. Then ask in plain words: "show my cards in the current sprint", "implement SCRUM-69", "move SCRUM-69 to Done".

Claude acts in Jira as you, with your permissions. Nothing secret is stored in the repository.
