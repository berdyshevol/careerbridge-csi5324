# Working in spec/

- Find the topic in [README.md](README.md) first; it says which file holds what and what does not
  belong there. Do not create a new file for a topic an existing file covers.
- One fact in one file: search for the term before adding text, and link to the file that holds it
  instead of repeating it.
- Diagrams are Mermaid blocks in the text, drawn from the code on `main`; check one renders before
  committing (`npx -y @mermaid-js/mermaid-cli@11.4.2 -i <file> -o /tmp/out.md`).
- Keep the template's section numbers in the headings (`## 6.`, `### 9.2`): the documentation PDF
  is built from these files in that order.
- A changed use case also changes its requirements, contracts and diagrams in the same pull request.
