# build-pdf

Builds one PDF from a list of Markdown files, with their Mermaid diagrams drawn. The content of every
deliverable's documentation lives in [spec/](../../spec/README.md); a deliverable only lists which
files go in, in what order.

```bash
tools/build-pdf/build.sh <list.txt> <output.pdf>
```

## The list

One path per line, relative to the list file; `#` starts a comment; the word `TOC` puts the table
of contents there. Each file starts on a new page.

```text
cover.md
change-logs.md
TOC
../careerbridge-spring/spec/vision.md
../careerbridge-spring/spec/requirements.md
../careerbridge-spring/spec/use-cases.md
../careerbridge-spring/spec/domain-model.md
../careerbridge-spring/spec/design.md
../careerbridge-spring/spec/architecture.md
```

A new deliverable needs a new list, not a new script.

## What it does

1. `join.py` joins the files, drops the spec files' "Part of the CareerBridge specification" line
   and makes relative links and images absolute.
2. mermaid-cli (through `npx`, pinned) turns each ```` ```mermaid ```` block into an image.
3. pandoc writes one HTML file with everything embedded; `place-toc.py` puts the table of contents
   where the list's `TOC` line was.
4. Headless Chrome prints it to PDF, US Letter (`style.css`).

## Needs

pandoc (`brew install pandoc`), Node.js with `npx`, and Google Chrome. Chrome is looked for in
`/Applications`; elsewhere, set `CHROME` to its executable.
