export const meta = {
  name: 'chain-review',
  description: 'Review one member chain (FR/NFR -> UC -> SSD -> contracts) on 4 dimensions, adversarially verify, return a verdict',
  whenToUse: 'Called by the chain-review skill with args {target, ucId}. Not meant to be run directly.',
  phases: [
    { title: 'Review', detail: '4 independent reviewers: consistency, completeness, Dr. Ren requirements, method correctness' },
    { title: 'Verify', detail: 'one skeptic per reviewer tries to refute each finding' },
    { title: 'Verdict', detail: 'merge confirmed findings into a prioritized fix list' },
  ],
}

// args: { target: absolute path of the chain file, ucId: e.g. "UC-02", root?: repo root }
if (!args || !args.target || !args.ucId) throw new Error('chain-review needs args {target, ucId}')

const ROOT = args.root || '/Users/berdyshevo/Documents/Baylor/SW-Engineering/group_project'
const D2 = `${ROOT}/deliverables/deliverable-2`
const TARGET = args.target
const UC = args.ucId

const CONTEXT = `
Target under review (read it fully): ${TARGET}
It is one team member's "chain" for use case ${UC} in a university software-engineering team project (CSI 5324, Dr. Ren):
FR + NFR -> fully-dressed use case -> System Sequence Diagram (Mermaid) -> operation contracts -> traceability table.

Reference material (all inside the team repo; do NOT open any repository or folder outside ${ROOT}):
- ${D2}/assignment.md — the Canvas assignment, rubric, Sep 22 announcement (docs = template sections 1–6), lecture slide 20
- ${D2}/pitfalls.md — Dr. Ren's "Common Documentation Pitfalls" (pitfall 5 about SSDs was removed from Canvas on Sep 15 but is kept as guidance)
- ${D2}/team-guide.md — the team's conventions (IDs FR-<UC>.<n> / NFR-<UC>.<n>, one SSD per UC titled SSD-<nn>, one contract per system operation, Output row for query contracts)
- ${D2}/deliverable-2.md — the team working document: business rules BR-1.., assumptions A1.., use-case diagram, and Josh's original drafts of all use cases (section 3)
- ${D2}/chains/ — the other members' chain files; the approved reference layout is chains/uc-01-browse-job-postings.md. Names, states and IDs must be consistent across chains.
- ${ROOT}/course/templates/README.md — summary of the course template; the template itself is ${ROOT}/course/templates/CSI5324_Project_Documentation_Template.docx (unzip -p ... word/document.xml) and Dr. Ren's example is ${ROOT}/course/templates/Sample\\ Documentation.pdf (pdftotext -layout)
- ${ROOT}/course/group-project-problem-statement.md — the problem statement

This is a course project: keep it simple. Target size per use case is about 5 FRs, 3 NFRs, 4–5 extensions, 1 SSD and one contract per system operation. Do not propose splitting requirements, adding extensions, or edge cases (security, rare states) unless a grader following the rubric or pitfalls would actually mark their absence down; proposals that simplify are welcome.
Rules: read-only — do not edit any file. Report only real, specific problems in the TARGET (or real inconsistencies between the target and the reference files). Quote the exact text you criticize. Style preferences are not problems. Do not list things that are fine.
`

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['must-fix', 'should-fix', 'nice-to-have'] },
          section: { type: 'string', description: 'FR, NFR, UC, SSD, Contracts, Traceability, Header' },
          quote: { type: 'string' },
          problem: { type: 'string' },
          evidence: { type: 'string', description: 'which rule/source says so, short quote + file' },
          fix: { type: 'string', description: 'concrete replacement text or action' },
        },
        required: ['id', 'severity', 'section', 'quote', 'problem', 'evidence', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}

const VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          real: { type: 'boolean' },
          severity: { type: 'string', enum: ['must-fix', 'should-fix', 'nice-to-have'] },
          reason: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['id', 'real', 'severity', 'reason', 'fix'],
      },
    },
  },
  required: ['verdicts'],
}

const DIMENSIONS = [
  {
    key: 'consistency',
    prompt: `Dimension: INTERNAL CONSISTENCY AND TRACEABILITY.
Check every cross-reference: each FR's step and business-rule/assumption column vs the actual use-case steps and the BR/A definitions in deliverable-2.md; each contract's cross-references vs the FRs and steps; SSD operation names vs contract operation names (one spelling everywhere); the traceability table vs sections 1–5 (no row pointing to something that does not exist); extension numbering vs the step numbers of the two-column scenario; names, states and IDs vs the use-case diagram, the other use cases it references, and the other chain files; Jira card numbers vs team-guide.md.`,
  },
  {
    key: 'completeness',
    prompt: `Dimension: COMPLETENESS.
Is anything missing? Every behaviour in the main scenario and every extension covered by some FR; every Special Requirement by a measurable NFR; all template §4.2 fields present (Use Case Name, Author, Actor, Preconditions, Postconditions, Main Success Scenario, Extensions, Special Requirements); every system operation in the SSD has a contract; contracts have Operation, Cross-references, Preconditions, Postconditions (and Output for queries); nothing from Josh's original draft of ${UC} in deliverable-2.md lost without a reason (extensions, business rules, open issues — each open issue must be settled, e.g. as an assumption).`,
  },
  {
    key: 'dr-ren',
    prompt: `Dimension: DOES IT MEET DR. REN'S REQUIREMENTS?
Compare against: the template §4.2 format (read the .docx), the use-case style of Dr. Ren's Sample Documentation.pdf (two-column Actor | System, TUCBW/TUCEW with observable events), the rubric and item list in assignment.md, every pitfall in pitfalls.md (analysis-first, no UI clicks, system boundary incl. system actors, domain-model naming, SSD granularity, no draft/TBD text, traceability and consistent IDs), and the Sep 22 announcement. Flag anything a grader following those documents would mark down, including wording that would read as a draft in the final PDF.`,
  },
  {
    key: 'method',
    prompt: `Dimension: METHOD CORRECTNESS (Larman, "Applying UML and Patterns").
Judge as an experienced instructor: FRs single, testable "shall" statements at the right level (not design, not UI); use case at user-goal level with actor intent and system responsibility, correct pre/postconditions; SSD a correct system-level SSD (actors incl. system actors where the UC has them, system as black box, system operations with parameters, returns, fragments) and valid Mermaid syntax; operation contracts correct (postconditions = state changes only: instance creation/deletion, attribute modification, associations formed/broken; queries say "None" and use Output); domain-object names plausible domain-model concepts rather than design types.`,
  },
]

phase('Review')
const results = await pipeline(
  DIMENSIONS,
  d => agent(`${CONTEXT}\n${d.prompt}\n\nPrefix finding ids with ${d.key[0].toUpperCase()}.`, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS }),
  (review, d) => {
    if (!review || !review.findings.length) return { key: d.key, review, verdicts: [] }
    return agent(`${CONTEXT}
You are a skeptical second reviewer. Another reviewer (dimension: ${d.key}) reported the findings below about the target. For EACH finding, open the target and the cited sources yourself and try to REFUTE it: is the quote really in the file? Is the cited rule real and does it apply? Would a grader care, or is it taste? Default to real=false if the evidence is weak. You may change severity and correct the fix.

Findings:
${JSON.stringify(review.findings, null, 2)}`, { label: `verify:${d.key}`, phase: 'Verify', schema: VERDICTS })
      .then(v => ({ key: d.key, review, verdicts: v ? v.verdicts : [] }))
  },
)

const confirmed = []
const rejected = []
for (const r of results.filter(Boolean)) {
  const byId = Object.fromEntries((r.review ? r.review.findings : []).map(f => [f.id, f]))
  for (const v of r.verdicts) {
    const f = byId[v.id]
    if (!f) continue
    if (v.real) confirmed.push({ dimension: r.key, ...f, severity: v.severity, fix: v.fix, verifier: v.reason })
    else rejected.push({ dimension: r.key, id: f.id, problem: f.problem, why_rejected: v.reason })
  }
}
log(`${UC}: ${confirmed.length} findings confirmed, ${rejected.length} rejected by the skeptics`)

phase('Verdict')
const verdict = await agent(`${CONTEXT}
You are the final judge. Below are findings about the target that survived adversarial verification. Merge duplicates, order by importance, and give a verdict.

Confirmed findings:
${JSON.stringify(confirmed, null, 2)}

Return: verdict ("ready to submit" | "ready after small fixes" | "needs rework"); score 1–10 against Dr. Ren's rubric and pitfalls as it stands; fixes (merged, ordered; each with severity, section, concrete change, why); strengths (up to 4 things to keep).`, {
  label: 'verdict', phase: 'Verdict',
  schema: {
    type: 'object',
    properties: {
      verdict: { type: 'string', enum: ['ready to submit', 'ready after small fixes', 'needs rework'] },
      score: { type: 'number' },
      fixes: { type: 'array', items: { type: 'object', properties: {
        severity: { type: 'string', enum: ['must-fix', 'should-fix', 'nice-to-have'] },
        section: { type: 'string' }, change: { type: 'string' }, why: { type: 'string' } },
        required: ['severity', 'section', 'change', 'why'] } },
      strengths: { type: 'array', items: { type: 'string' } },
    },
    required: ['verdict', 'score', 'fixes', 'strengths'],
  },
})

return { ucId: UC, target: TARGET, verdict, confirmed_count: confirmed.length, rejected }
