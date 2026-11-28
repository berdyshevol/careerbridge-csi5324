# ADR-0015: One typeface, Inter, for titles and text

- **Status:** Accepted
- **Date:** 2026-11-28
- **Amends:** [ADR-0004](0004-frontend.md) decision 4 (two typefaces)

## Context

ADR-0004 chose Figtree for text and Bricolage Grotesque for titles. Seen on the finished screens
before the final presentation, the display face read as playful rather than professional. Zeba (PM)
compared it with Inter, IBM Plex Sans and Plus Jakarta Sans on the same screen and chose Inter
(SCRUM-269).

## Decision

1. **Inter for everything**, loaded through `next/font` in `src/app/layout.tsx`.
2. `font-display` stays on titles, so pages need no change, but it now names the same face: a title
   stands out by its size and weight, not by a second font.
3. The mockups follow: `spec/screens/cb.css` and every mockup's font link use Inter.

## Consequences

- One font file family to load instead of two.
- A later wish for a distinct title face is one line in `globals.css` and one in `layout.tsx`.
