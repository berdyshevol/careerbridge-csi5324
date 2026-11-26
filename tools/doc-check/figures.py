#!/usr/bin/env python3
"""Check that figure and table captions are numbered 1, 2, 3 ... in document order.

Why: the documentation PDF is joined from many spec files, and each file numbers its own captions
by hand. A file moved in the list, a figure removed or a section reordered leaves gaps, repeats and
numbers out of order that a reader (and the grader) sees. Figures and tables are counted
separately.

    figures.py <document.pdf>            the built PDF, through pdftotext, with page numbers
    figures.py --spec <contents.txt>     the Markdown files of a list, in its order, before building

Exit 0 when both sequences run 1, 2, 3 ...; 1 with the list of problems.
"""

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

KINDS = ("Figure", "Table")
# In the PDF a caption is a line that opens with "Figure N:"; a reference in the text has no colon.
PDF_CAPTION = re.compile(r"^\s*(Figure|Table)\s+(\d+)\s*:")
# In Markdown a caption is a paragraph that opens with bold "**Figure N: ...**" (tools/build-pdf/README.md).
MD_CAPTION = re.compile(r"^\*\*(Figure|Table)\s+(\d+)\s*:\s*(.*?)\**\s*$")
LIST_KEYWORDS = ("TOC", "PAGEBREAK", "WATERMARK")


def captions_in_pdf(pdf):
    """Yield (kind, number, where, text) for each caption line of the PDF."""
    if not shutil.which("pdftotext"):
        sys.exit("figures.py: pdftotext not found (brew install poppler)")
    text = subprocess.run(["pdftotext", str(pdf), "-"], check=True,
                          capture_output=True, text=True).stdout
    for page_no, page in enumerate(text.split("\f"), start=1):
        for line in page.splitlines():
            m = PDF_CAPTION.match(line)
            if m:
                yield m.group(1), int(m.group(2)), f"page {page_no}", line.strip()


def files_of_list(contents):
    """The Markdown files of a build list, in order, resolved against the list's folder."""
    base = contents.parent
    for raw in contents.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.split(" ")[0] in LIST_KEYWORDS:
            continue
        yield (base / line).resolve()


def captions_in_markdown(path):
    """Yield (kind, number, where, text) for each bold caption outside code blocks."""
    fenced = False
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if fenced:
            continue
        m = MD_CAPTION.match(line.strip())
        if m:
            yield m.group(1), int(m.group(2)), f"{path}:{line_no}", line.strip()


def problems_of(captions):
    """Each problem as one line; captions are already in document order."""
    problems = []
    for kind in KINDS:
        seen = {}
        last = 0
        for k, n, where, text in captions:
            if k != kind:
                continue
            if n in seen:
                problems.append(f"{where}: {kind} {n} repeats (first at {seen[n]}): {text}")
            elif n < last:
                problems.append(f"{where}: {kind} {n} out of order, after {kind} {last}: {text}")
            elif n > last + 1:
                missing = f"{last + 1}" if n == last + 2 else f"{last + 1}-{n - 1}"
                problems.append(f"{where}: {kind} {n} follows {kind} {last}; {kind} {missing} missing: {text}")
            seen.setdefault(n, where)
            last = max(last, n)
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter,
                                     epilog="Fix a problem in the spec file and line it names; "
                                            "renumber the captions after it, and the text that refers to them.")
    parser.add_argument("pdf", nargs="?", type=Path, help="the built documentation PDF")
    parser.add_argument("--spec", type=Path, metavar="CONTENTS_TXT",
                        help="check the Markdown files of this build list instead of a PDF")
    args = parser.parse_args()
    if bool(args.pdf) == bool(args.spec):
        parser.error("give either a PDF or --spec <contents.txt>")

    if args.spec:
        captions, missing_files = [], []
        for path in files_of_list(args.spec):
            if path.suffix != ".md":
                continue
            if not path.exists():
                missing_files.append(f"{path}: listed in {args.spec} but not found")
                continue
            captions.extend(captions_in_markdown(path))
        problems = missing_files + problems_of(captions)
    else:
        captions = list(captions_in_pdf(args.pdf))
        problems = problems_of(captions)

    counts = ", ".join(f"{sum(1 for c in captions if c[0] == k)} {k.lower()}s" for k in KINDS)
    if problems:
        print(f"figures.py: {len(problems)} problem(s) in {counts}:")
        for p in problems:
            print(f"  {p}")
        return 1
    print(f"figures.py: OK, {counts} numbered in order")
    return 0


if __name__ == "__main__":
    sys.exit(main())
