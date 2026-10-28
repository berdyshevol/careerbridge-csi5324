# Instructions for AI coding assistants

Copilot, Cursor, Codex, Gemini and any other assistant: the rules for this repository are in
[CLAUDE.md](CLAUDE.md) and the decisions in [spec/adr/](spec/adr/README.md). They apply to you too.
Read them before writing code.

Known traps (`npm run lint` and the backend tests catch the common forms of the first two, not every one):

- Await every backend call and show its refusal on the screen; never leave a `catch` empty.
- A GET changes nothing in the database: reads need no role (ADR-0010), and `ReadsChangeNothingTest` checks every one.
- When the request lacks a value (a resume, an applicant), refuse; do not invent one.
