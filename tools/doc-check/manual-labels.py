#!/usr/bin/env python3
"""Check that every bold UI label of the user manual is text the frontend really shows.

Why: spec/user-manual.md promises that "menu entries, page titles and buttons are written in
bold, exactly as the application shows them". Screens change in pull requests that do not touch
the manual, so a renamed button leaves the manual describing a screen that no longer exists. This
script takes each **bold** span of the manual and looks for it, verbatim, in the frontend sources
(app/frontend/src, *.tsx and *.ts, tests left out).

Not checked: bold lead-ins that open a paragraph and end in ":" or "." ("**Workflow: ...**",
"**Key features:**", "**Where.**"). A label with "…" is matched by the text before it ("Your role
at …" matches `Your role at {name}`). Exit 0 when every label is found, 1 with the missing ones.
"""

import argparse
import html
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BOLD = re.compile(r"\*\*(.+?)\*\*", re.S)
LEAD_IN_BEFORE = re.compile(r"^\s*(?:[-*]|\d+\.)?\s*$")
TEST_FILE = re.compile(r"\.(test|spec)\.tsx?$")


def labels_of(manual):
    """Yield (line, label) for each bold span that is not a paragraph lead-in or inside code."""
    text = manual.read_text(encoding="utf-8")
    text = re.sub(r"```.*?```", lambda m: re.sub(r"[^\n]", " ", m.group(0)), text, flags=re.S)
    for m in BOLD.finditer(text):
        label = " ".join(m.group(1).split())
        line_start = text.rfind("\n", 0, m.start()) + 1
        before = text[line_start:m.start()]
        if LEAD_IN_BEFORE.match(before) and label[-1:] in (":", "."):
            continue
        if re.fullmatch(r"(Figure|Table) \d+:.*", label):
            continue
        yield text.count("\n", 0, m.start()) + 1, label


def frontend_text(src):
    """All frontend sources as one string: entities decoded, whitespace collapsed, JSX quotes joined."""
    parts = []
    for path in sorted(src.rglob("*")):
        if path.suffix in (".ts", ".tsx") and not TEST_FILE.search(path.name) and "__tests__" not in path.parts:
            parts.append(path.read_text(encoding="utf-8"))
    joined = html.unescape("\n".join(parts))
    # JSX writes an apostrophe as {"'"} or {' '} to keep text on several lines
    joined = re.sub(r"\{\s*([\"'`])(.*?)\1\s*\}", r"\2", joined)
    return " ".join(joined.split())


def found(label, source):
    needle = label.split("…")[0].strip() if "…" in label else label
    return not needle or needle in source


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter,
                                     epilog="Fix a missing label in the manual (the text the screen shows), or "
                                            "un-bold it if it is not a label.")
    parser.add_argument("--manual", type=Path, default=REPO / "spec/user-manual.md")
    parser.add_argument("--src", type=Path, default=REPO / "app/frontend/src")
    args = parser.parse_args()

    source = frontend_text(args.src)
    labels = list(labels_of(args.manual))
    missing = [(line, label) for line, label in labels if not found(label, source)]
    if missing:
        print(f"manual-labels.py: {len(missing)} of {len(labels)} bold labels not found in {args.src}:")
        for line, label in missing:
            print(f"  {args.manual}:{line}: **{label}**")
        return 1
    print(f"manual-labels.py: OK, all {len(labels)} bold labels found in {args.src}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
