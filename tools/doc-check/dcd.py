#!/usr/bin/env python3
"""Check that the design class diagrams agree on the multiplicities of each association.

Why: the Iteration II feedback was "Most multiplicities are not consistent between Figure 34 and
figures of each UC". The DCD views in spec/design.md are drawn by hand, one per use case, next to
the whole DCD, and the domain model (spec/domain-model.md, section 5.3) gives the multiplicities
they must share. This script reads every Mermaid classDiagram in design.md, collects the
associations that carry multiplicities (A "1" -- "*" B, with any arrow and label), and reports:

- the same pair of classes with different multiplicities in the whole DCD and a use-case view,
  or twice in one diagram;
- a pair whose multiplicities differ from the associations table of domain-model.md 5.3.

The whole DCD is the diagram whose caption says whole, complete, full or overall, else the one
with the most classes; the others are the per-use-case views. Exit 0 when they all agree, 1 with
the list of differences.
"""

import argparse
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ARROW = r"(?:<\|--|--\|>|\*--|--\*|o--|--o|<--|-->|<\.\.|\.\.>|<\|\.\.|\.\.\|>|\.\.|--)"
ASSOCIATION = re.compile(
    rf'^\s*(\w+)\s*(?:"([^"]*)")?\s*({ARROW})\s*(?:"([^"]*)")?\s*(\w+)\s*(?::\s*(.*?))?\s*$')
CAPTION = re.compile(r"^\*\*(Figure \d+:[^*]*)\*\*")
CLASS = re.compile(r"^\s*class\s+(\w+)")
WHOLE = re.compile(r"\b(whole|complete|full|overall)\b", re.I)
SAME = {"*": "*", "0..*": "*", "1..1": "1", "n": "*", "many": "*"}


def norm(mult):
    m = (mult or "").strip()
    return SAME.get(m, m)


def key(a, ma, b, mb):
    """The pair in one direction (classes sorted), so A "1" -- "*" B equals B "*" -- "1" A."""
    return ((a, b), (norm(ma), norm(mb))) if a <= b else ((b, a), (norm(mb), norm(ma)))


def show(pair, mults):
    return f'{pair[0]} "{mults[0]}" -- "{mults[1]}" {pair[1]}'


def diagrams_in(design):
    """Each classDiagram block: its caption (or section), line, classes and associations."""
    lines = design.read_text(encoding="utf-8").splitlines()
    blocks, heading, i = [], "", 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("#"):
            heading = line.lstrip("# ").strip()
        fence = line.strip()[:3]
        if fence in ("```", "~~~") and line.strip()[3:].strip() == "mermaid":
            j = i + 1
            while j < len(lines) and (not lines[j].strip() or lines[j].strip().startswith("%%")):
                j += 1  # blank lines and %% directives may come before the diagram type
            if j >= len(lines) or lines[j].strip() != "classDiagram":
                i += 1
                continue
            start, classes, assocs = j, set(), []
            i = j + 1
            while i < len(lines) and not lines[i].strip().startswith(fence):
                m = CLASS.match(lines[i])
                if m:
                    classes.add(m.group(1))
                m = ASSOCIATION.match(lines[i])
                if m and (m.group(2) or m.group(4)):
                    a, ma, _, mb, b, label = m.groups()
                    classes.update((a, b))
                    assocs.append((a, ma, b, mb, label, i + 1))
                i += 1
            caption = next((CAPTION.match(l).group(1) for l in lines[i + 1:i + 4] if CAPTION.match(l)),
                           heading)
            blocks.append({"name": caption, "line": start, "classes": classes, "assocs": assocs})
        i += 1
    return blocks


def domain_associations(domain):
    """The associations table of section 5.3 as {pair: (mults, line)}; empty if not parsable."""
    found, in_section = {}, False
    for no, line in enumerate(domain.read_text(encoding="utf-8").splitlines(), start=1):
        if line.startswith("### "):
            in_section = line.startswith("### 5.3")
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not in_section or len(cells) < 4 or cells[0] in ("From", "") or set(cells[0]) <= {"-", " "}:
            continue
        a, ma, b, mb = (c.replace(" ", "") if n % 2 == 0 else c for n, c in enumerate(cells[:4]))
        pair, mults = key(a, ma, b, mb)
        found[pair] = (mults, no)
    return found


def internal_problems(block, where):
    problems, seen = [], {}
    for a, ma, b, mb, label, line in block["assocs"]:
        pair, mults = key(a, ma, b, mb)
        if pair in seen and seen[pair][0] != mults:
            problems.append(f"{where}:{line}: {show(pair, mults)} but line {seen[pair][1]} has "
                            f"{show(pair, seen[pair][0])} ({block['name']})")
        seen.setdefault(pair, (mults, line))
    return problems, seen


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter,
                                     epilog="Fix a difference in the view it names, or in domain-model.md 5.3 "
                                            "if the model is what changed, in one pull request.")
    parser.add_argument("--design", type=Path, default=REPO / "spec/design.md")
    parser.add_argument("--domain", type=Path, default=REPO / "spec/domain-model.md")
    args = parser.parse_args()

    if not args.design.is_file():
        print(f"dcd.py: {args.design}: no such file")
        return 1
    blocks = diagrams_in(args.design)
    if not blocks:
        print(f"dcd.py: no classDiagram in {args.design}")
        return 1
    problems, notes = [], []
    views = []
    for block in blocks:
        p, seen = internal_problems(block, args.design)
        problems += p
        views.append((block, seen))

    if len(blocks) == 1:
        notes.append(f"only one class diagram ({blocks[0]['name']}, line {blocks[0]['line']}): no per-use-case "
                     "views to compare, so only its own consistency and the domain model are checked")
    else:
        whole = next((v for v in views if WHOLE.search(v[0]["name"])), None) or \
            max(views, key=lambda v: len(v[0]["classes"]))
        notes.append(f"whole DCD: {whole[0]['name']} (line {whole[0]['line']}); "
                     f"{len(views) - 1} use-case view(s)")
        for block, seen in views:
            if block is whole[0]:
                continue
            for pair, (mults, line) in seen.items():
                if pair in whole[1] and whole[1][pair][0] != mults:
                    problems.append(f"{args.design}:{line}: {show(pair, mults)} in {block['name']}, but "
                                    f"{show(pair, whole[1][pair][0])} in the whole DCD (line {whole[1][pair][1]})")

    domain = domain_associations(args.domain) if args.domain.exists() else {}
    if not domain:
        notes.append(f"no associations table found in {args.domain} section 5.3; not compared")
    else:
        for block, seen in views:
            for pair, (mults, line) in seen.items():
                if pair in domain and domain[pair][0] != mults:
                    problems.append(f"{args.design}:{line}: {show(pair, mults)} in {block['name']}, but "
                                    f"{show(pair, domain[pair][0])} in {args.domain.name}:{domain[pair][1]}")
        notes.append(f"{len(domain)} associations in domain-model.md 5.3")

    total = sum(len(b["assocs"]) for b in blocks)
    print(f"dcd.py: {len(blocks)} class diagram(s), {total} association(s) with multiplicities")
    for n in notes:
        print(f"  note: {n}")
    if problems:
        print(f"dcd.py: {len(problems)} difference(s):")
        for p in problems:
            print(f"  {p}")
        return 1
    print("dcd.py: OK, the multiplicities agree")
    return 0


if __name__ == "__main__":
    sys.exit(main())
