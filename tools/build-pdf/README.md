# build-pdf

Builds one PDF from a list of Markdown files, with their Mermaid diagrams drawn, in the layout of the
course documentation template (`CSI5324_Project_Documentation_Template.docx`). The content of every
deliverable's documentation lives in [spec/](../../spec/README.md); a deliverable only lists which
files go in, in what order, and where pages break.

```bash
tools/build-pdf/build.sh <list.txt> <output.pdf>
```

## The list

One path per line, relative to the list file; `#` starts a comment. The files run on one after
another; three keywords, each on a line of its own, do the rest:

| Keyword | What it does |
| --- | --- |
| `TOC` | puts the table of contents here; it lists the numbered sections after this line |
| `PAGEBREAK` | starts a new page |
| `WATERMARK <text>` | prints `<text>` in light grey, diagonally, behind the content of every page; no watermark without it |

The template's order: a new page after the cover, the Change Logs and the table of contents, and
before sections 10, 11 and 12; sections 1 to 9 run on.

```text
WATERMARK Team CareerBridge · CSI 5324
cover.md
PAGEBREAK
change-logs.md
PAGEBREAK
TOC
PAGEBREAK
../careerbridge-spring/spec/vision.md
../careerbridge-spring/spec/requirements.md
../careerbridge-spring/spec/use-cases.md
../careerbridge-spring/spec/domain-model.md
../careerbridge-spring/spec/design.md
../careerbridge-spring/spec/architecture.md
../careerbridge-spring/spec/testing.md
PAGEBREAK
../careerbridge-spring/spec/team.md
PAGEBREAK
../careerbridge-spring/spec/setup-guide.md
PAGEBREAK
../careerbridge-spring/spec/user-manual.md
```

A new deliverable needs a new list, not a new script. In Claude Code, the `build-doc-pdf` skill (`.claude/skills/build-doc-pdf/`) runs
the build for a deliverable's list and checks the result. Before and after the build it runs the
checks of `tools/doc-check/` (`--help` on each): caption numbering (`figures.py`), DCD
multiplicities (`dcd.py`) and the user manual's labels (`manual-labels.py`).

## The cover

The first page is the cover: the header has its rule above the line and there is no footer. A file
that opens with a front matter becomes the template's title page, right-aligned: the title, then
"Version …", the team, one line per member and the date, closed by a blue rule. Each field is
optional; whatever follows the front matter in the file comes after it on the same page.

```markdown
---
title: Recruiting & Application Management System
version: 2.0
team: Team CareerBridge
members:
  - Zeba Tusnia Towshi, Project Manager
  - Rabeya Nazara, Requirements Engineer
  - Josh Job Joseph, Design Engineer
  - Reagan Rubio, Quality Assurance Engineer
  - Oleg Berdyshev, Project Librarian
date: November 30, 2026
---
```

## Headings

The numbered headings of the spec files are the template's headings: `## 1. Introduction` is
Heading 1, `### 2.1 …` Heading 2, `#### …` Heading 3. They make the table of contents (`##` and
`###`) and the PDF bookmarks. Headings before the `TOC` line (Change Logs) are not sections: the
highest is the page title (14pt bold), the others its sub-headings (11pt bold), and none is a
bookmark. A paragraph that opens with a bold `**Figure N: …**` or `**Table N: …**` is a caption.

## What it does

1. `join.py` joins the files, drops each spec file's title and "Part of the CareerBridge
   specification" line, turns a cover's front matter into the title page, turns the Word bullet
   glyph left in some tables into "•", makes relative links and images absolute, and writes the
   watermark's CSS.
2. mermaid-cli (through `npx`, pinned) turns each ```` ```mermaid ```` block into an image.
3. pandoc writes one HTML file with everything embedded; `finish-html.py` puts the table of contents
   where the `TOC` line was, gives section numbers their tab, marks captions and turns the headings
   before the table of contents into plain titles.
4. Paged.js (`pagedjs-cli`, pinned, through `npx`) lays out US Letter pages with `style.css`, which
   holds the template's styles: Times New Roman 11pt, line height 1.15, margins 1in left and right
   and 0.75in top and bottom, the header "Baylor CSI 5324 Software Engineering I", the footer
   "Confidential | Baylor University | Page N", blue headings, dot leaders in the table of
   contents, thin black table lines with a light-blue header row. Tall diagrams shrink to one page;
   bookmarks come from `##` and `###`.

## Needs

pandoc (`brew install pandoc`) and Node.js with `npx`. The first run downloads mermaid-cli and
pagedjs-cli with their own headless browser. Without Times New Roman, the text falls back to Times,
Liberation Serif or another serif font.
