"""Joins the Markdown files of a list into one; the list's format is in README.md.

Paths in the list are relative to the list. Relative links and images in each file are made
absolute, so they still resolve once the files are joined somewhere else. A second output holds
only what follows the list's TOC line: the table of contents lists that part, not the cover. A
third output is the CSS of the list's watermark, empty when it has none.
"""
import html
import pathlib
import re
import sys

TOC = "TOC"
PAGEBREAK = "PAGEBREAK"
WATERMARK = "WATERMARK"
PAGE_BREAK = '<div class="page-break"></div>'
# A spec file opens with its file title and a line pointing to the spec index; in the PDF the
# numbered sections of the template are the headings, so both go
SPEC_HEADER = re.compile(r"\A# CareerBridge — .*\n+(> Part of the CareerBridge specification.*\n+)?")
# Bullets pasted from the Iteration 1 Word document are a private-use glyph no font draws
WORD_BULLET = ""
RELATIVE_LINK = re.compile(r"(\]\()(?!https?:|#|/|mailto:)([^)\s]+)(\))")
FRONT_MATTER = re.compile(r"\A---\n(.*?)\n---\n", re.S)


def front_matter(text):
    """Reads the `key: value` and `- item` lines of a front matter, without a YAML library."""
    match = FRONT_MATTER.match(text)
    if not match:
        return {}, text
    fields, key = {}, None
    for line in match.group(1).splitlines():
        if line.strip().startswith("- ") and key:
            fields.setdefault(key, []).append(line.strip()[2:].strip())
        elif ":" in line:
            key, value = (s.strip() for s in line.split(":", 1))
            if value:
                fields[key] = value.strip("\"'")
    return fields, text[match.end():]


def cover(fields):
    """The title page of the template: title, Version, team, members, date, right-aligned."""
    members = fields.get("members", [])
    lines = [fields.get("version") and "Version " + fields["version"], fields.get("team"),
             *([members] if isinstance(members, str) else members), fields.get("date")]
    return "\n".join(['<section class="cover">',
                      f'<p class="cover-title">{html.escape(fields.get("title", ""))}</p>',
                      *(f'<p class="cover-line">{html.escape(text)}</p>' for text in lines if text),
                      "</section>"])


list_file = pathlib.Path(sys.argv[1]).resolve()
parts = []
toc_at = None
watermark = None
for line in list_file.read_text().splitlines():
    entry = line.split("#", 1)[0].strip()
    if not entry:
        continue
    if entry == TOC:
        parts.append("[[TOC]]")
        toc_at = len(parts)
        continue
    if entry == PAGEBREAK:
        parts.append(PAGE_BREAK)
        continue
    if entry.split()[0] == WATERMARK:
        watermark = entry[len(WATERMARK):].strip()
        continue
    path = (list_file.parent / entry).resolve()
    if not path.is_file():
        sys.exit(f"{list_file.name}: no such file: {entry}")
    fields, text = front_matter(path.read_text())
    text = SPEC_HEADER.sub("", text).replace(WORD_BULLET, "•")
    text = RELATIVE_LINK.sub(lambda m: m.group(1) + str((path.parent / m.group(2)).resolve()) + m.group(3), text)
    parts.append((cover(fields) + "\n\n" if fields else "") + text.strip())

pathlib.Path(sys.argv[2]).write_text("\n\n".join(parts) + "\n")
pathlib.Path(sys.argv[3]).write_text("\n\n".join(parts[toc_at or 0:]) + "\n")
css = ""
if watermark:
    quoted = watermark.replace("\\", "\\\\").replace('"', '\\"')
    css = f'.pagedjs_pagebox::before {{ content: "{quoted}"; }}\n'
pathlib.Path(sys.argv[4]).write_text(css)
