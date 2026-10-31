---
name: remove-ai-marks
description: Inspect and strip AI provenance marks (invisible Unicode, C2PA/EXIF/XMP metadata) from the user's own text and files using guillaumemeyer/watermarks-remover.
---

# Remove AI marks (watermarks-remover)

Wraps the open-source MIT project https://github.com/guillaumemeyer/watermarks-remover (pinned commit `5c180932a00c793261177f79aee21db8929f3fe2`). Covers:

- **Layer A** – invisible / suspicious Unicode in text (zero-width, word joiner, variation selectors, homoglyphs)
- **Containers** – C2PA / EXIF / XMP / document metadata in PNG, JPEG, WebP, SVG, PDF, DOCX, ODT, EPUB, HTML, MD, TEX
- **Layer B** – optional statistical rewrite of prose (paraphrase / humanize), only when the user asks

Intended for the user's **own** content (privacy, metadata hygiene, research). Never claim a result "proves human-written" or is "undetectable". If the user clearly wants to hide AI use where disclosure is required (school work, publisher, client), say so plainly and do not run Layer B for that purpose.

## 1. Setup

The cleaning code lives in an HTTP service from the repo. The plugin's hook keeps a pinned checkout in `~/.cache/watermarks-remover` (override with `WATERMARKS_REPO`); create it if missing, then start the service (Python 3.10+, stdlib only):

```bash
WMDIR="${WATERMARKS_REPO:-$HOME/.cache/watermarks-remover}"
if [ "$(git -C "$WMDIR" rev-parse HEAD 2>/dev/null)" != "5c180932a00c793261177f79aee21db8929f3fe2" ]; then
  rm -rf "$WMDIR"
  git clone https://github.com/guillaumemeyer/watermarks-remover.git "$WMDIR"
  git -C "$WMDIR" checkout 5c180932a00c793261177f79aee21db8929f3fe2
fi
WM=http://127.0.0.1:8765
curl -sf "$WM/health" || (python3 -I "$WMDIR/service/scripts/server.py" --host 127.0.0.1 --port 8765 &)   # run in background
curl -sf "$WM/health"   # {"ok": true, ...}
curl -s  "$WM/capabilities"
```

On Windows use `py -3` instead of `python3`. If the health check fails, tell the user the service did not start and stop — never improvise local cleaning. Drive advice from `/capabilities`: only offer pixel removal, SynthID scoring or detectors when it reports the backend present. Do NOT install the upstream repo's own plugin hooks or use its `stealer/` module.

## 2. HTTP API

JSON bodies, file as base64; the `name` extension decides routing.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | /health | – | ok, version |
| GET | /capabilities | – | optional tools/backends |
| POST | /inspect | {file, name} | kind, suspicious, report |
| POST | /detect | {file, name} | detections |
| POST | /clean | {file, name, options} | cleaned (base64), report |

`/clean` options: `nfkc`, `aggressive_homoglyphs`, `keep_non_ai_metadata`, `strip_all_metadata`, `also_layer_a_text`, `deep_images` (auto/always/lossless/never, PDF), `clean_attachments` (auto/always/never, PDF), `detect_before`/`detect_after`, `strategy` (text Layer B, e.g. `paraphrase@0.8`).

Note: for plain `.txt` the service requires a Layer B backend and returns 400 if none is configured. For Unicode-only cleaning of pasted text, send it as `.md` (container + Layer A, no rewrite).

## 3. Workflow

1. **Classify**: pasted text → temp `.md` file; documents/images → send as-is (keep the real extension).
2. **Inspect first**:
   ```bash
   curl -s -X POST "$WM/inspect" -H 'Content-Type: application/json' \
     -d "{\"file\": \"$(base64 < IN | tr -d '\n')\", \"name\": \"$(basename IN)\"}"
   ```
   Summarize findings with their confidence labels (confirmed / probable / informational / likely_false_positive).
3. **Clean**: same call to `/clean`; decode `cleaned` into `NAME.cleaned.EXT` (not in place unless asked). Never edit the user's original. Re-inspect the output when it matters.
4. **Layer B (only if asked)**: rewrite prose for word choice and sentence structure while preserving every fact, number, name and identifier; then run Layer A again. Tell the user it is best-effort and cannot be verified without vendor detectors.
5. **Deliver** the cleaned file and say where it is.

## 4. Report honestly

- What was verifiably removed (counts/actions from `report`).
- What was not touched: token-sampling text watermarks (without Layer B), pixel/audio watermarks, C2PA soft binding, secret-key detectors.
- PDF stripping is best-effort if `exiftool`/`qpdf` are missing (check `/capabilities`); re-written PDFs lose digital signatures.
- `.tex` cleaning is source-level only; clean the compiled PDF separately.
