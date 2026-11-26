---
name: build-doc-pdf
description: The one way in to the project documentation PDF - check the spec, offer the drafting skills (Change Logs, Introduction, testing summary, user-manual check), then build the PDF from spec/ with tools/build-pdf using a deliverable's list (contents.txt) and cover (cover.md), and check the result. Use when someone asks to build, make, export or regenerate the documentation PDF ("собери PDF", "сделай документацию", "export the PDF"), or before submitting a deliverable.
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

## 3. Run the document checks

From this repository, on the list's spec files:

```bash
python3 tools/doc-check/figures.py --spec <contents.txt>   # Figure N / Table N numbered 1, 2, 3 … in list order
python3 tools/doc-check/dcd.py                             # DCD multiplicities: views, whole DCD, domain model 5.3
python3 tools/doc-check/manual-labels.py                   # bold labels of the user manual are on the screens
```

Each prints its problems with the file and line and exits 1. On any failure stop: show the
problems as they were printed, say which spec file each fix goes in (a pull request to `spec/`),
and ask "Build anyway?". Build only on a yes. A label that the screen puts together at run time
is reported as a note, not a failure; check it against the running app, not in the text.

## 4. Offer the drafts

Before a final deliverable, some sections are written from the system as it is now. Ask once,
listing what is still unfinished (from step 3 and a quick look for "Not written yet" in the
list's files), which of these to run now, in this order:

1. **Change Logs** — the `doc-changelog` skill.
2. **Introduction** — the `doc-draft` skill with `intro`.
3. **Testing summary (9.1)** — the `doc-draft` skill with `testing-summary`.
4. **User manual against the app** — the `doc-check-manual` skill (the longest: it walks the app).

Run each one chosen with the Skill tool, one after another. Each shows its own draft or report and
waits for its own yes; an approved text reaches `spec/` through its own pull request
(`implement-task`). The PDF shows `main`: build after those pull requests are merged, or say which
approved text the PDF does not have yet. None chosen: go on to the build. Each skill also runs on
its own, without this one.

## 5. Build

From the list's folder (it takes about a minute):

```bash
cd <folder of contents.txt>
<this repository>/tools/build-pdf/build.sh contents.txt deliverable-N.pdf
```

If a Mermaid diagram fails, name the spec file and the diagram; the fix is a pull request to
`spec/`.

## 6. Check the result

- `pdfinfo deliverable-N.pdf` for the page count.
- Read the table of contents (the Read tool on the PDF, pages 3–4) and list the top-level sections.
  Every section 1–12 must be there; name a missing one and why (no `## N.` heading in its spec
  file, or the file is not in the list).
- `python3 <this repository>/tools/doc-check/figures.py deliverable-N.pdf --spec contents.txt`, from the list's
  folder where the PDF is: the captions of the built PDF, with their page numbers. Report its
  problems; a figure that renders as an image may have lost its caption.
- Placeholder text a reader would see: `pdftotext deliverable-N.pdf - | grep -n "Not written yet\|TODO\|TBD"`.

## 7. Report

A few lines: the PDF path, the page count, the sections present, the result of each check, and
what is missing or unfinished, with the spec file that holds it. Do not submit, upload or send the PDF.
