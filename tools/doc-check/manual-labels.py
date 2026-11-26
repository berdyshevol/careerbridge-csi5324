#!/usr/bin/env python3
"""Check that every bold UI label of the user manual is text the frontend really shows.

Why: spec/user-manual.md promises that "menu entries, page titles and buttons are written in
bold, exactly as the application shows them". Screens change in pull requests that do not touch
the manual, so a renamed button leaves the manual describing a screen that no longer exists. This
script takes each **bold** span of the manual and looks for it, verbatim and as whole words, in
the text the frontend can show: the string literals and JSX text of app/frontend/src (*.tsx and
*.ts, tests left out), not identifiers, so "Home" is not found in HomeIcon.

Not checked: bold lead-ins that open a paragraph and end in ":" or "." ("**Workflow: ...**",
"**Key features:**", "**Where.**"). A label with "…" is matched by the text before it ("Your role
at …" matches `Your role at {name}`). A label made of parts joined by " · " whose parts are all
found ("Closed · by recruiter") is reported as assembled at run time, to check in the browser,
and does not fail. Exit 0 when every label is found, 1 with the missing ones.
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
# Bold words of the manual that are not labels: its own note that labels are written in bold
NOT_LABELS = {"bold"}


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
        if label in NOT_LABELS or re.fullmatch(r"(Figure|Table) \d+:.*", label):
            continue
        yield text.count("\n", 0, m.start()) + 1, label


STRING = re.compile(r'"((?:[^"\\\n]|\\.)*)"|\'((?:[^\'\\\n]|\\.)*)\'|`((?:[^`\\]|\\.)*)`')
# Text between a tag's ">" and the next tag; not an arrow "=>" nor a comparison "a < b"
JSX_TEXT = re.compile(r"(?<![=\-])>([^<>]+)<(?=[/A-Za-z>])")
# What JSX text never holds; a match that holds it is code between a generic and a tag
CODE = re.compile(r"[;=]|&&|\|\||\w\(")
MODULE = re.compile(r"""\b(?:from|import|require\()\s*["'][^"']*["']""")
# A string that only names something in code is not screen text: a class, test id, key or address
NOT_SHOWN = re.compile(r"\b(?:className|data-testid|testId|id|key|href|src|role|type|name|htmlFor|variant)\s*=\s*\{?\s*$")
EXPRESSION = re.compile(r"\{[^{}]*\}")


def shown_texts(src):
    """The pieces of text the frontend can show: string literals and JSX text, one per entry."""
    texts = []
    for path in sorted(src.rglob("*")):
        if path.suffix not in (".ts", ".tsx") or TEST_FILE.search(path.name) or "__tests__" in path.parts:
            continue
        code = path.read_text(encoding="utf-8")
        # JSX writes an apostrophe as {"'"} and keeps a space at a line end as {" "}
        code = re.sub(r"\{\s*([\"'])(.{0,3}?)\1\s*\}", r"\2", code)
        code = MODULE.sub("", code)  # module paths name files, not screen text
        for m in STRING.finditer(code):
            if NOT_SHOWN.search(code[max(0, m.start() - 40):m.start()]):
                continue
            literal = next(g for g in m.groups() if g is not None)
            texts.extend(re.split(r"\$\{[^}]*\}", literal))  # template parts around ${...}
        for m in JSX_TEXT.finditer(code):
            text = EXPRESSION.sub("\n", m.group(1))
            if not CODE.search(re.sub(r"&#?\w+;", "", text)):  # an entity's ";" is not code
                texts.extend(text.split("\n"))  # JSX text parts around {expression}
    return [t for t in (" ".join(html.unescape(t).split()) for t in texts) if t]


def found(needle, texts):
    whole = re.compile(r"(?<!\w)" + re.escape(needle) + r"(?!\w)")
    return any(whole.search(t) for t in texts)


def verdict(label, texts):
    """'found', 'assembled' (every part of an "A · B" label is there) or 'missing'."""
    needle = label.split("…")[0].strip() if "…" in label else label
    if not needle or found(needle, texts):
        return "found"
    parts = [p.strip() for p in needle.split("·")]
    if len(parts) > 1 and all(p and found(p, texts) for p in parts):
        return "assembled"
    return "missing"


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter,
                                     epilog="Fix a missing label in the manual (the text the screen shows), or "
                                            "un-bold it if it is not a label.")
    parser.add_argument("--manual", type=Path, default=REPO / "spec/user-manual.md")
    parser.add_argument("--src", type=Path, default=REPO / "app/frontend/src")
    args = parser.parse_args()

    for path, what in ((args.manual, "manual"), (args.src, "frontend sources")):
        if not path.exists():
            print(f"manual-labels.py: {path}: no such {what}")
            return 1
    texts = shown_texts(args.src)
    labels = list(labels_of(args.manual))
    results = [(line, label, verdict(label, texts)) for line, label in labels]
    assembled = [(line, label) for line, label, v in results if v == "assembled"]
    missing = [(line, label) for line, label, v in results if v == "missing"]
    for line, label in assembled:
        print(f"  note: {args.manual}:{line}: **{label}** is assembled at run time from its parts; "
              "check it in the browser")
    if missing:
        print(f"manual-labels.py: {len(missing)} of {len(labels)} bold labels not shown by {args.src}:")
        for line, label in missing:
            print(f"  {args.manual}:{line}: **{label}**")
        return 1
    print(f"manual-labels.py: OK, {len(labels) - len(assembled)} of {len(labels)} bold labels found "
          f"in {args.src}, {len(assembled)} assembled at run time")
    return 0


if __name__ == "__main__":
    sys.exit(main())
