---
name: clean-user-facing-text
description: Clean and finalize the user's own prose (articles, reports, emails, docs, Markdown/HTML) by removing invisible Unicode and rewriting while preserving facts, meaning and voice.
---

# Clean user-facing text

Adapted from `skills/clean-user-facing-text` in https://github.com/guillaumemeyer/watermarks-remover (MIT, pinned commit `5c180932a00c793261177f79aee21db8929f3fe2`). Self-contained Python 3 stdlib scripts, no service or network needed after the checkout exists.

Apply a final text-hygiene pass to prose the user owns or is authorized to process. Unicode cleanup is deterministic; statistical-mark reduction is best-effort. Never claim a rewrite proves human authorship or is undetectable. Keep required academic, legal, platform and regulatory disclosures. Do not use for code-only tasks or to hide AI use where disclosure is required.

## Setup

Reuse the pinned checkout the plugin's hook keeps (create it if missing):

```bash
WMDIR="${WATERMARKS_REPO:-$HOME/.cache/watermarks-remover}"
if [ "$(git -C "$WMDIR" rev-parse HEAD 2>/dev/null)" != "5c180932a00c793261177f79aee21db8929f3fe2" ]; then
  rm -rf "$WMDIR"
  git clone https://github.com/guillaumemeyer/watermarks-remover.git "$WMDIR"
  git -C "$WMDIR" checkout 5c180932a00c793261177f79aee21db8929f3fe2
fi
SCRIPTS="$WMDIR/skills/clean-user-facing-text/scripts"
```

Run scripts as `python3 -I "$SCRIPTS/<script>.py" ...` (`py -3` on Windows). Write output as `NAME.cleaned.EXT` unless the user asks for in-place.

## Workflow

1. Identify the prose readers will see.
2. Protect non-prose spans: fenced/inline code, commands, paths, URLs, identifiers, API names, exact values, formulas, citations, verbatim quotes.
3. Preserve every claim, fact, number, name, citation and requirement. Never invent details to vary the prose; flag gaps instead.
4. **Measure before**:
   ```bash
   python3 -I "$SCRIPTS/inspect_text.py" --stylometry --json INPUT
   python3 -I "$SCRIPTS/inspect_text.py" --audit INPUT   # detect-only, no rewrite
   ```
   Rewrite only when `density_tier` is `high`; for `low`/`medium`, verify and otherwise leave the text as is. Under 30 words the report says `insufficient_length`.
5. **Writing brief**: use a voice sample only if the user owns it; never imitate another named person; never inject fake first person, invented specifics or added stance; keep the writer's deliberate rough edges and domain terms.
6. **Layer A** (deterministic Unicode pass):
   ```bash
   python3 -I "$SCRIPTS/clean_text.py" INPUT -o OUTPUT --stats --no-normalize-spaces
   ```
7. **Layer B** – rewrite once: vary clause order, sentence boundaries, rhythm and connectors; replace formulaic transitions and stock words (delve, tapestry, testament, seamless, myriad, "it is important to note"...) with plain, concrete wording; vary sentence length; break formulaic structures (rule of three, "challenges and opportunities", upbeat closers). Keep language, tone, structure and formatting; never translate unless asked; for Korean or other non-English text use constructions native to that language.
8. **Layer A again** on the rewritten result.
9. **Measure after** with the same scorer; report it as a gauge, not a detector verdict.
10. Return only the polished result unless the user asks for an audit.

## Script options

- `--no-normalize-spaces` by default (keeps NBSP, CJK ideographic spaces).
- Do not use `--aggressive-homoglyphs`, `--nfkc`, `--strip-emoji-glue` unless the user asks and accepts changes to multilingual text/emoji.
- Supports plain text, source text, Markdown and HTML source. If a hit falls inside code or attributes, clean only prose segments. Do not pass PDF, DOCX, images or archives (use the remove-ai-marks skill for those).
- Use `-` for stdin. For a chat-only reply, do the rewrite directly and don't claim a Unicode filter ran.

## Presets

| Preset | Personality | Eliminate |
|---|---|---|
| General (default) | author's voice, no injected stance | stock AI words, uniform cadence |
| Essay / blog | stance and asides welcome | hype, aphorisms, rule of three |
| Technical / docs | neutral, precise | promo words, em dashes, bold mini-headers; code untouched |
| Academic / professional | formal, evidence-first | over-claiming verbs, padding; keep required disclosures |
| Business / product copy | plain concrete claims | "seamless", "empower", vague benefits |
| Fiction | invented detail allowed | uniform cadence, clichés |

Plain-language sub-mode (on request, for procedures/runbooks): short common words, one instruction per sentence, imperative steps.

## Code boundary

Rewrite prose only. Never rename variables, alter string literals, reformat code or change executable output.

## Reporting (when asked)

- **Verifiable**: Unicode characters removed/replaced with counts; stylometry before/after.
- **Best-effort**: prose rewritten to change token and syntax patterns.
- **Not established**: official detector evasion, human authorship, removal of a vendor's secret-key watermark.
