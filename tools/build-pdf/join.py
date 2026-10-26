"""Joins the Markdown files of a list into one, each starting on a new page.

Paths in the list are relative to the list. Relative links and images in each file are made
absolute, so they still resolve once the files are joined somewhere else.
"""
import pathlib
import re
import sys

TOC = "TOC"
PAGE_BREAK = '\n\n<div class="page-break"></div>\n\n'
# The spec files open with a line pointing to the spec index, which means nothing in a PDF
SPEC_HEADER = re.compile(r"^> Part of the CareerBridge specification.*\n+", re.MULTILINE)
RELATIVE_LINK = re.compile(r"(\]\()(?!https?:|#|/|mailto:)([^)\s]+)(\))")

list_file = pathlib.Path(sys.argv[1]).resolve()
parts = []
for line in list_file.read_text().splitlines():
    entry = line.split("#", 1)[0].strip()
    if not entry:
        continue
    if entry == TOC:
        parts.append("[[TOC]]")
        continue
    path = (list_file.parent / entry).resolve()
    if not path.is_file():
        sys.exit(f"{list_file.name}: no such file: {entry}")
    text = SPEC_HEADER.sub("", path.read_text())
    text = RELATIVE_LINK.sub(lambda m: m.group(1) + str((path.parent / m.group(2)).resolve()) + m.group(3), text)
    parts.append(text.strip())

pathlib.Path(sys.argv[2]).write_text(PAGE_BREAK.join(parts) + "\n")
