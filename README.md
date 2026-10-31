# watermarks-kit

Claude Code plugin built on [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) (MIT, pinned commit `5c18093`).

## What it does

- **Automatic check (hook)**: every time Claude writes or edits a file, it is scanned for invisible Unicode and AI/C2PA metadata. Findings are reported to Claude. **Report only: files are never modified.**
- **`/remove-ai-marks` skill**: inspect and strip metadata from PDF, DOCX, images, SVG, HTML, Markdown and more. Output goes to `*.cleaned.*`.
- **`/clean-user-facing-text` skill**: remove invisible Unicode from prose and, when needed, rewrite it while keeping facts and voice.

Not included on purpose: the upstream auto-clean mode and its `stealer/` module.

## Requirements

Node.js (comes with Claude Code), Git, Python 3.10+. The first check clones the upstream repo into `~/.cache/watermarks-remover` (override with `WATERMARKS_REPO`).

## Install

From GitHub (after pushing this folder to `du8309-ai/watermarks-kit`), inside a Claude Code session:

```
/plugin marketplace add du8309-ai/watermarks-kit
/plugin install watermarks-kit@watermarks-kit
```

From a local folder (unzipped):

```
/plugin marketplace add /path/to/watermarks-kit
/plugin install watermarks-kit@watermarks-kit
```

## Use responsibly

For your own content (privacy, metadata hygiene, research). Cleaning does not prove text is human-written; keep any AI-use disclosure that school, publishers or clients require.

## License

MIT for this kit (`LICENSE`). Upstream license in `LICENSE.upstream`.
