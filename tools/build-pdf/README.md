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

1. `join.py` joins the files, drops each spec file's title and "Part of the CareerBridge
   specification" line (the template's numbered sections are the headings), turns the Word bullet
   glyph left in some tables into "•" and makes relative links and images absolute.
2. mermaid-cli (through `npx`, pinned) turns each ```` ```mermaid ```` block into an image.
3. pandoc writes one HTML file with everything embedded; `place-toc.py` puts the table of contents
   of what follows the `TOC` line where that line was.
4. Paged.js (`pagedjs-cli`, pinned, through `npx`) lays out US Letter pages (`style.css`): page
   numbers in the footer and in the table of contents, none on the cover, tall diagrams shrunk to
   one page.

## Needs

pandoc (`brew install pandoc`) and Node.js with `npx`. The first run downloads mermaid-cli and
pagedjs-cli with their own headless browser.
