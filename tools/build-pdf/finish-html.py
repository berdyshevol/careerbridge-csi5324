"""Gives pandoc's HTML the template's shapes that CSS alone cannot select.

- The table of contents goes where the list's TOC line was, or nowhere if it had none.
- Headings before it (cover, change logs) become plain titles: they are not numbered sections,
  so they stay out of the PDF bookmarks, which are built from h2 and h3.
- A section number ("1.") gets its own box, like the tab after it in the template.
- A paragraph that opens with a bold "Figure N" or "Table N" is a caption.
"""
import pathlib
import re
import sys

HEADING = re.compile(r"<h([1-6])(?: [^>]*)?>(.*?)</h\1>", re.S)
NUMBER = r'\1<span class="num">\2</span> '
SECTION_HEADING = re.compile(r"(<h2 [^>]*>)(\d+\.)\s+")
TOC_ENTRY = re.compile(r'(<a href="#[^"]*"[^>]*>)(\d+\.)\s+')
CAPTION = re.compile(r"<p>(?=<strong>(Figure|Table) \d+)")

body_file, toc_file = map(pathlib.Path, sys.argv[1:3])
toc = '<nav class="toc"><h1>Table of Contents</h1>' + TOC_ENTRY.sub(NUMBER, toc_file.read_text()) + "</nav>"
body = body_file.read_text()

front, marker, rest = body.partition("<p>[[TOC]]</p>")
if marker:
    top = min((int(level) for level, _ in HEADING.findall(front)), default=1)
    front = HEADING.sub(
        lambda m: f'<p class="{"front-title" if int(m[1]) == top else "front-heading"}">{m[2]}</p>', front)
    body = front + toc + rest

body = SECTION_HEADING.sub(NUMBER, body)
body = CAPTION.sub(lambda m: f'<p class="caption {m[1].lower()}">', body)
body_file.write_text(body)
