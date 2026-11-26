---
name: build-doc-pdf
description: Build the project documentation PDF from spec/ with tools/build-pdf, using a deliverable's list (contents.txt) and cover (cover.md), and check the result. Use when someone asks to build, make, export or regenerate the documentation PDF ("собери PDF", "сделай документацию", "export the PDF"), or before submitting a deliverable.
---

# Build the documentation PDF

The PDF is built from the Markdown in `spec/` by `tools/build-pdf/build.sh`. A deliverable only
gives the list of files (`contents.txt`) and the cover (`cover.md`); the builder's rules (list
keywords `TOC`, `PAGEBREAK`, `WATERMARK`, cover fields, headings, captions) are in
[tools/build-pdf/README.md](../../../tools/build-pdf/README.md). Read it when a list or cover has
to change.

## 1. Find the list

- The list the person names, or
- the project librarian's private notes next to this repository: the highest
  `../group-project-notes/deliverables/deliverable-N/` that has a `contents.txt`. Say which.
- Neither: ask for the list, or offer to write one in the scratchpad from the example in the
  README (the template's order: cover, Change Logs, table of contents, sections 1–12).

The list's paths are relative to the list file. The deliverable lists live outside this
repository, which holds no course materials; never copy them in.

## 2. Check the inputs

- Every path in the list exists. For a final deliverable the list has a `WATERMARK` line, and
  `PAGEBREAK` after the cover, the Change Logs and `TOC`, and before sections 10, 11 and 12.
- `cover.md` opens with front matter (`title`, `version`, `team`, `members`, `date`), and the date
  and version fit this deliverable. If not, show the fix and ask before changing it.
- `git status -sb`: say so if this repository is not on an up-to-date `main`, because the PDF shows
  the branch that is checked out.

## 3. Build

From the list's folder (it takes about a minute):

```bash
cd <folder of contents.txt>
<this repository>/tools/build-pdf/build.sh contents.txt deliverable-N.pdf
```

If a Mermaid diagram fails, name the spec file and the diagram; the fix is a pull request to
`spec/`.

## 4. Check the result

- `pdfinfo deliverable-N.pdf` for the page count.
- Read the table of contents (the Read tool on the PDF, pages 3–4) and list the top-level sections.
  Every section 1–12 must be there; name a missing one and why (no `## N.` heading in its spec
  file, or the file is not in the list).
- Placeholder text a reader would see: `pdftotext deliverable-N.pdf - | grep -n "Not written yet\|TODO\|TBD"`.

## 5. Report

A few lines: the PDF path, the page count, the sections present, and what is missing or
unfinished, with the spec file that holds it. Do not submit, upload or send the PDF.
