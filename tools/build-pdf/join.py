"""Joins the Markdown files of a list into one, each starting on a new page.

Paths in the list are relative to the list. Relative links and images in each file are made
absolute, so they still resolve once the files are joined somewhere else. A second output holds
only what follows the list's TOC line: the table of contents lists that part, not the cover.
"""
import pathlib
import re
import sys

TOC = "TOC"
PAGE_BREAK = '\n\n<div class="page-break"></div>\n\n'
# A spec file opens with its file title and a line pointing to the spec index; in the PDF the
# numbered sections of the template are the headings, so both go
SPEC_HEADER = re.compile(r"\A# CareerBridge — .*\n+(> Part of the CareerBridge specification.*\n+)?")
# Bullets pasted from the Iteration 1 Word document are a private-use glyph no font draws
WORD_BULLET = "\uf0b7"
RELATIVE_LINK = re.compile(r"(\]\()(?!https?:|#|/|mailto:)([^)\s]+)(\))")

list_file = pathlib.Path(sys.argv[1]).resolve()
parts = []
toc_at = None
for line in list_file.read_text().splitlines():
    entry = line.split("#", 1)[0].strip()
    if not entry:
        continue
    if entry == TOC:
        parts.append("[[TOC]]")
        toc_at = len(parts)
        continue
    path = (list_file.parent / entry).resolve()
    if not path.is_file():
        sys.exit(f"{list_file.name}: no such file: {entry}")
    text = SPEC_HEADER.sub("", path.read_text()).replace(WORD_BULLET, "•")
    text = RELATIVE_LINK.sub(lambda m: m.group(1) + str((path.parent / m.group(2)).resolve()) + m.group(3), text)
    parts.append(text.strip())

pathlib.Path(sys.argv[2]).write_text(PAGE_BREAK.join(parts) + "\n")
pathlib.Path(sys.argv[3]).write_text(PAGE_BREAK.join(parts[toc_at or 0:]) + "\n")
