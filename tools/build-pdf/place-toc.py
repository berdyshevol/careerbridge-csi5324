"""Puts the table of contents where the list's TOC line was, or nowhere if it had none."""
import pathlib
import sys

body_file, toc_file = map(pathlib.Path, sys.argv[1:3])
toc = '<nav class="toc"><h1>Table of Contents</h1>' + toc_file.read_text() + "</nav>"
body = body_file.read_text()
body_file.write_text(body.replace("<p>[[TOC]]</p>", toc, 1))
