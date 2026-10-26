#!/usr/bin/env bash
# Builds one PDF from a list of Markdown files: usage and the list format are in README.md.
set -euo pipefail

if [ $# -ne 2 ]; then
  echo "usage: $0 <list.txt> <output.pdf>" >&2
  exit 2
fi

here="$(cd "$(dirname "$0")" && pwd)"
list="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
output="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

command -v pandoc > /dev/null || { echo "pandoc is missing: brew install pandoc" >&2; exit 1; }
[ -x "$chrome" ] || { echo "Chrome not found; set CHROME to its executable" >&2; exit 1; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 1. Join the listed files in order
python3 -I "$here/join.py" "$list" "$work/joined.md"

# 2. Mermaid blocks become images (mermaid-cli writes them next to its output)
npx -y @mermaid-js/mermaid-cli@11.4.2 -q -i "$work/joined.md" -o "$work/rendered.md" -e png -s 2 -b white \
  -t neutral -c "$here/mermaid-config.json" -p "$here/puppeteer.json"

# 3. HTML with everything embedded, the table of contents where the list asks for it
pandoc "$work/rendered.md" --from gfm --to html5 --toc --toc-depth=3 --template "$here/toc-only.html" \
  -o "$work/toc.html"
pandoc "$work/rendered.md" --from gfm --to html5 --standalone --embed-resources --resource-path "$work" \
  --css "$here/style.css" --metadata pagetitle="$(basename "$output" .pdf)" -o "$work/body.html"
python3 -I "$here/place-toc.py" "$work/body.html" "$work/toc.html"

# 4. Print
"$chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="$output" "file://$work/body.html" 2> /dev/null
echo "built $output"
