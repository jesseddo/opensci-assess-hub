#!/usr/bin/env python3
"""
Extract Quick look HTML previews from OpenSciEd .docx materials.

Usage:
  python3 scripts/extract-material-previews.py <unit-dir> <manifest.json> <previews-out.json>

Writes HTML under public/previews/{unit-slug}/{assessment-id}/ and a JSON index
for the app to resolve preview URLs at runtime.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

KIND_TO_FILE_KEY = {
    "student-handout": "studentHandout",
    "answer-key": "answerKey",
    "teacher-guide": "teacherGuide",
    "google-form": "googleForm",
    "rubric": "rubric",
}

TE_NOISE = frozenset(
    {
        "ADDITIONAL GUIDANCE",
        "ASSESSMENT OPPORTUNITY",
    }
)

SEE_KEY_RE = re.compile(r"^See .+ Key for", re.IGNORECASE)
FIELD_RE = re.compile(r"^(Name|Date):\s", re.IGNORECASE)
QUESTION_RE = re.compile(r"^(\d+)\.\s+")
SUB_QUESTION_RE = re.compile(r"^(\d+[a-z])\.\s+", re.IGNORECASE)
MC_OPTION_RE = re.compile(
    r"^(In every collision|In some, but not all|In every\s+collision, the peak force)",
    re.IGNORECASE,
)
MC_OPTION_LETTER_RE = re.compile(r"^[A-C]\.\s+Player", re.IGNORECASE)
SCENARIO_OPTION_RE = re.compile(r"^Player #\d+", re.IGNORECASE)
SCORING_PLUS_RE = re.compile(r"^\+\s*")
RESPONSE_LABEL_RE = re.compile(
    r"^(Correct response|Expected response|Student responses should include)",
    re.IGNORECASE,
)
LESSON_STEP_RE = re.compile(r"^\d+\s*·\s")
TIMING_RE = re.compile(r"^\d+\s*min$", re.IGNORECASE)
TE_SECTION_START_RE = re.compile(
    r"^(building towards:|what to look/listen for:|what to do:)",
    re.IGNORECASE,
)


def docx_paragraphs(docx_path: Path) -> List[str]:
    with zipfile.ZipFile(docx_path) as zf:
        root = ET.fromstring(zf.read("word/document.xml"))
    texts: List[str] = []
    for para in root.iter(f"{NS}p"):
        parts = [node.text for node in para.iter(f"{NS}t") if node.text]
        t = "".join(parts).strip()
        if t:
            texts.append(t)
    return texts


def file_modified_iso(path: Path) -> Optional[str]:
    if not path.is_file():
        return None
    mtime = path.stat().st_mtime
    return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()


def is_te_noise(paragraph: str) -> bool:
    stripped = paragraph.strip()
    if stripped.upper() in TE_NOISE:
        return True
    if LESSON_STEP_RE.match(stripped):
        return True
    if TIMING_RE.match(stripped):
        return True
    if stripped.startswith("MATERIALS:"):
        return True
    if stripped.startswith("✱"):
        return True
    return False


def strip_te_label(text: str, label: str) -> str:
    pattern = re.compile(rf"^{re.escape(label)}\s*:?\s*", re.IGNORECASE)
    return pattern.sub("", text).strip()


def preview_styles() -> str:
    return """
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: Inter, system-ui, sans-serif;
      max-width: 42rem;
      margin: 0;
      padding: 1rem 1.25rem 1.5rem;
      color: #001242;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }
    h1.page-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #2f4a3e;
      margin: 0 0 0.35rem;
    }
    .meta {
      font-size: 0.75rem;
      color: #5a6b72;
      margin: 0 0 1.25rem;
      line-height: 1.5;
    }
    h2.section {
      font-size: 1.125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #2f4a3e;
      margin: 1.5rem 0 0.75rem;
    }
    h2.section:first-of-type { margin-top: 0; }
    h2.doc-title {
      font-size: 1rem;
      font-weight: 600;
      color: #001242;
      margin: 0 0 1rem;
    }
    h3.subhead, h3.question {
      font-size: 1rem;
      font-weight: 600;
      color: #001242;
      margin: 1.25rem 0 0.5rem;
      line-height: 1.45;
    }
    h3.subhead { font-size: 0.9375rem; }
    p {
      font-size: 0.875rem;
      color: #5a6b72;
      margin: 0 0 0.75rem;
    }
    p.field {
      font-size: 0.8125rem;
      color: #5a6b72;
      margin: 0 0 0.25rem;
    }
    .field-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    ul.look-list, ul.options, ul.scoring {
      margin: 0 0 1rem;
      padding-left: 1.25rem;
      font-size: 0.875rem;
      color: #5a6b72;
      line-height: 1.65;
    }
    ul.look-list li, ul.options li, ul.scoring li {
      margin-bottom: 0.5rem;
    }
    ul.options { list-style: none; padding-left: 0.5rem; }
    ul.options li::before { content: "○ "; color: #5a6b72; }
    ul.scoring { list-style: none; padding-left: 0; }
    ul.scoring li {
      padding-left: 0.75rem;
      border-left: 2px solid #2f4a3e33;
    }
    aside.callout {
      display: block;
      background: #f5f1e8;
      border-left: 3px solid #d96b3c;
      padding: 0.75rem 1rem;
      margin: 1rem 0 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #001242;
      border-radius: 0 4px 4px 0;
      line-height: 1.55;
    }
    p.answer {
      font-size: 0.875rem;
      font-weight: 600;
      color: #001242;
      margin: 0.25rem 0 0.75rem;
    }
    .intro-block { margin-bottom: 0.25rem; }
    @media print { body { margin: 0.75in; } }
    """


def format_teacher_guide(paragraphs: List[str]) -> str:
    parts: List[str] = []
    i = 0
    while i < len(paragraphs):
        p = paragraphs[i]
        if is_te_noise(p):
            break

        building = re.match(r"^building towards:\s*(.+)$", p, re.IGNORECASE)
        if building:
            parts.append('<h2 class="section">Building towards</h2>')
            parts.append(f"<p>{escape(building.group(1))}</p>")
            i += 1
            continue

        if re.match(r"^what to look/listen for:?\s*$", p, re.IGNORECASE):
            parts.append('<h2 class="section">What to look / listen for</h2>')
            i += 1
            look_items: List[str] = []
            while i < len(paragraphs):
                nxt = paragraphs[i]
                if is_te_noise(nxt) or TE_SECTION_START_RE.match(nxt) or SEE_KEY_RE.match(nxt):
                    break
                look_items.append(nxt)
                i += 1
            if look_items:
                parts.append(
                    "<ul class=\"look-list\">"
                    + "".join(f"<li>{escape(item)}</li>" for item in look_items)
                    + "</ul>"
                )
            continue

        if SEE_KEY_RE.match(p):
            parts.append(f'<aside class="callout">{escape(p)}</aside>')
            i += 1
            continue

        what_to_do = re.match(r"^what to do:\s*(.+)$", p, re.IGNORECASE)
        if what_to_do:
            parts.append('<h2 class="section">What to do</h2>')
            parts.append(f"<p>{escape(what_to_do.group(1))}</p>")
            i += 1
            continue

        parts.append(f"<p>{escape(p)}</p>")
        i += 1

    return "".join(parts)


def collect_scenario_options(paragraphs: List[str], start: int) -> Tuple[List[str], int]:
    options: List[str] = []
    i = start
    while i < len(paragraphs) and SCENARIO_OPTION_RE.match(paragraphs[i]):
        options.append(paragraphs[i])
        i += 1
    return options, i


def collect_mc_options(paragraphs: List[str], start: int) -> Tuple[List[str], int]:
    options: List[str] = []
    i = start
    while i < len(paragraphs):
        p = paragraphs[i]
        if MC_OPTION_RE.match(p) or MC_OPTION_LETTER_RE.match(p):
            options.append(p)
            i += 1
            continue
        if SUB_QUESTION_RE.match(p) or QUESTION_RE.match(p):
            break
        if RESPONSE_LABEL_RE.match(p):
            break
        if SCORING_PLUS_RE.match(p):
            break
        if len(p) < 90 and p[0].isupper() and not p.endswith("."):
            # Short title-like lines (e.g. scenario labels) — stop grouping.
            break
        break
    return options, i


def format_student_handout(paragraphs: List[str]) -> str:
    parts: List[str] = []
    i = 0
    field_lines: List[str] = []

    while i < len(paragraphs):
        p = paragraphs[i]

        if FIELD_RE.match(p):
            field_lines.append(p)
            i += 1
            continue

        if field_lines:
            parts.append(
                '<div class="field-row">'
                + "".join(f'<p class="field">{escape(line)}</p>' for line in field_lines)
                + "</div>"
            )
            field_lines = []

        if len(p) < 60 and p.endswith("Assessment") and not QUESTION_RE.match(p):
            parts.append(f'<h2 class="doc-title">{escape(p)}</h2>')
            i += 1
            continue

        if QUESTION_RE.match(p) or SUB_QUESTION_RE.match(p):
            parts.append(f'<h3 class="question">{escape(p)}</h3>')
            i += 1
            scenarios, i = collect_scenario_options(paragraphs, i)
            if scenarios:
                parts.append(
                    "<ul class=\"options\">"
                    + "".join(f"<li>{escape(opt)}</li>" for opt in scenarios)
                    + "</ul>"
                )
                continue
            options, i = collect_mc_options(paragraphs, i)
            if options:
                parts.append(
                    "<ul class=\"options\">"
                    + "".join(f"<li>{escape(opt)}</li>" for opt in options)
                    + "</ul>"
                )
            continue

        if MC_OPTION_RE.match(p) or MC_OPTION_LETTER_RE.match(p):
            options, i = collect_mc_options(paragraphs, i)
            parts.append(
                "<ul class=\"options\">"
                + "".join(f"<li>{escape(opt)}</li>" for opt in options)
                + "</ul>"
            )
            continue

        parts.append(f'<p class="intro-block">{escape(p)}</p>')
        i += 1

    if field_lines:
        parts.append(
            '<div class="field-row">'
            + "".join(f'<p class="field">{escape(line)}</p>' for line in field_lines)
            + "</div>"
        )

    return "".join(parts)


def format_answer_key(paragraphs: List[str]) -> str:
    parts: List[str] = []
    i = 0
    in_scoring_intro = False

    while i < len(paragraphs):
        p = paragraphs[i]

        if re.match(r"^lesson \d+:\s*answer key$", p, re.IGNORECASE):
            i += 1
            continue

        if re.match(r".+ assessment key$", p, re.IGNORECASE) and len(p) < 80:
            parts.append(f'<h2 class="doc-title">{escape(p)}</h2>')
            i += 1
            continue

        if p.lower().startswith("scoring guidance"):
            parts.append('<h2 class="section">Scoring guidance</h2>')
            body = re.sub(r"^scoring guidance\.?\s*", "", p, flags=re.IGNORECASE).strip()
            if body:
                parts.append(f"<p>{escape(body)}</p>")
            in_scoring_intro = True
            i += 1
            continue

        if in_scoring_intro and not QUESTION_RE.match(p) and not SUB_QUESTION_RE.match(p):
            if RESPONSE_LABEL_RE.match(p) or SCORING_PLUS_RE.match(p):
                in_scoring_intro = False
            else:
                parts.append(f"<p>{escape(p)}</p>")
                i += 1
                continue

        in_scoring_intro = False

        if RESPONSE_LABEL_RE.match(p):
            correct = re.match(r"^Correct response\s+(is\s+.+)$", p, re.IGNORECASE)
            if correct:
                parts.append('<h3 class="subhead">Correct response</h3>')
                answer_text = re.sub(r"^is\s+", "", correct.group(1).strip(), flags=re.IGNORECASE)
                parts.append(f'<p class="answer">{escape(answer_text)}</p>')
                i += 1
                continue

            if re.match(r"^Student responses should include these ideas:?\s*$", p, re.IGNORECASE):
                parts.append(
                    '<h3 class="subhead">Student responses should include these ideas</h3>'
                )
                i += 1
                continue

            expected = re.match(r"^Expected response:?\s*(.*)$", p, re.IGNORECASE)
            if expected:
                parts.append('<h3 class="subhead">Expected response</h3>')
                answer = expected.group(1).strip()
                if answer:
                    parts.append(f'<p class="answer">{escape(answer)}</p>')
                elif i + 1 < len(paragraphs) and len(paragraphs[i + 1].strip()) <= 3:
                    i += 1
                    parts.append(f'<p class="answer">{escape(paragraphs[i].strip())}</p>')
                i += 1
                continue

            label_match = RESPONSE_LABEL_RE.match(p)
            label = label_match.group(1) if label_match else p
            remainder = p[label_match.end() :].strip() if label_match else ""
            remainder = remainder.lstrip(":").strip()
            parts.append(f'<h3 class="subhead">{escape(label)}</h3>')
            if remainder:
                parts.append(f'<p class="answer">{escape(remainder)}</p>')
            i += 1
            continue

        if SCORING_PLUS_RE.match(p):
            scoring_items: List[str] = []
            while i < len(paragraphs) and SCORING_PLUS_RE.match(paragraphs[i]):
                scoring_items.append(SCORING_PLUS_RE.sub("", paragraphs[i]).strip())
                i += 1
            parts.append(
                "<ul class=\"scoring\">"
                + "".join(f"<li>{escape(item)}</li>" for item in scoring_items)
                + "</ul>"
            )
            continue

        if QUESTION_RE.match(p) or SUB_QUESTION_RE.match(p):
            parts.append(f'<h3 class="question">{escape(p)}</h3>')
            i += 1
            options, i = collect_mc_options(paragraphs, i)
            if options:
                parts.append(
                    "<ul class=\"options\">"
                    + "".join(f"<li>{escape(opt)}</li>" for opt in options)
                    + "</ul>"
                )
            continue

        if MC_OPTION_RE.match(p) or MC_OPTION_LETTER_RE.match(p):
            options, i = collect_mc_options(paragraphs, i)
            parts.append(
                "<ul class=\"options\">"
                + "".join(f"<li>{escape(opt)}</li>" for opt in options)
                + "</ul>"
            )
            continue

        parts.append(f"<p>{escape(p)}</p>")
        i += 1

    return "".join(parts)


def format_body_html(kind: str, paragraphs: List[str]) -> str:
    if kind == "teacher-guide":
        return format_teacher_guide(paragraphs)
    if kind == "student-handout":
        return format_student_handout(paragraphs)
    if kind == "answer-key":
        return format_answer_key(paragraphs)

    return "".join(f"<p>{escape(p)}</p>" for p in paragraphs)


def preview_html(
    *,
    unit_id: str,
    lesson: str,
    assessment_title: str,
    material_label: str,
    file_name: str,
    kind: str,
    paragraphs: List[str],
    truncated: bool,
) -> str:
    body_html = format_body_html(kind, paragraphs)
    trunc_note = (
        '<p class="meta">Preview truncated — export for the full document.</p>'
        if truncated
        else ""
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(assessment_title)} — {escape(material_label)}</title>
  <style>{preview_styles()}</style>
</head>
<body>
  <h1 class="page-title">{escape(material_label)}</h1>
  <p class="meta">OpenSciEd Unit {escape(unit_id)} · {escape(lesson)} · {escape(file_name)}</p>
  {body_html}
  {trunc_note}
  <p class="meta" style="margin-top:1.5rem">Verbatim excerpt from OpenSciEd unit materials — not edited by Eddo.</p>
</body>
</html>
"""


def teacher_guide_excerpt(paragraphs: List[str], assessment_title: str) -> Tuple[List[str], bool]:
    """Pull TE facilitation section for the named assessment."""
    title_words = [w.lower() for w in assessment_title.split() if len(w) > 2]
    start: Optional[int] = None

    for i, p in enumerate(paragraphs):
        if not re.search(r"building towards:", p, re.IGNORECASE):
            continue
        window = " ".join(paragraphs[i : min(i + 10, len(paragraphs))]).lower()
        if any(word in window for word in title_words):
            start = i
            break

    if start is None:
        for i, p in enumerate(paragraphs):
            if SEE_KEY_RE.search(p) and any(word in p.lower() for word in title_words):
                start = max(0, i - 2)
                break

    if start is None:
        for i, p in enumerate(paragraphs):
            if p.lower().strip() == assessment_title.lower() or (
                assessment_title.lower() in p.lower()
                and len(p) < len(assessment_title) + 20
            ):
                start = i
                break

    if start is None:
        return paragraphs[:25], len(paragraphs) > 25

    end = start + 1
    while end < len(paragraphs):
        if is_te_noise(paragraphs[end]):
            break
        end += 1

    chunk = paragraphs[start:end]
    return chunk, False


def preview_paragraphs(
    kind: str,
    paragraphs: List[str],
    assessment_title: str,
) -> Tuple[List[str], bool]:
    if kind == "teacher-guide":
        return teacher_guide_excerpt(paragraphs, assessment_title)
    max_count = 30 if kind == "answer-key" else 24
    if len(paragraphs) <= max_count:
        return paragraphs, False
    return paragraphs[:max_count], True


def resolve_file(unit_dir: Path, rel_path: Optional[str]) -> Optional[Path]:
    if not rel_path:
        return None
    path = unit_dir / rel_path
    return path if path.is_file() else None


def main() -> None:
    if len(sys.argv) != 4:
        print(
            "Usage: python3 scripts/extract-material-previews.py <unit-dir> <manifest.json> <previews-out.json>",
            file=sys.stderr,
        )
        sys.exit(1)

    unit_dir = Path(sys.argv[1]).expanduser().resolve()
    manifest_path = Path(sys.argv[2]).resolve()
    out_json = Path(sys.argv[3]).resolve()
    repo_root = Path(__file__).resolve().parents[1]

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    unit_id = manifest["unitId"]
    unit_slug = unit_id.replace(".", "-")
    index: Dict[str, Any] = {}

    label_by_kind = {
        "student-handout": "Student handout",
        "answer-key": "Answer key",
        "teacher-guide": "Teacher guide",
        "google-form": "Google Form",
        "rubric": "Rubric",
    }

    for row in manifest.get("assessments", []):
        if row.get("source") == "te-opportunity":
            continue
        assessment_id = row["id"]
        files = row.get("files") or {}
        title = row.get("shortTitle") or row.get("title") or assessment_id
        lesson = row.get("lesson") or ""
        assessment_entry: Dict[str, Any] = {}

        for kind, file_key in KIND_TO_FILE_KEY.items():
            rel = files.get(file_key)
            doc_path = resolve_file(unit_dir, rel)
            if not doc_path:
                continue

            paragraphs = docx_paragraphs(doc_path)
            if not paragraphs:
                continue

            preview_paras, truncated = preview_paragraphs(kind, paragraphs, title)
            html = preview_html(
                unit_id=unit_id,
                lesson=lesson,
                assessment_title=title,
                material_label=label_by_kind[kind],
                file_name=doc_path.name,
                kind=kind,
                paragraphs=preview_paras,
                truncated=truncated,
            )

            out_dir = repo_root / "public" / "previews" / unit_slug / assessment_id
            out_dir.mkdir(parents=True, exist_ok=True)
            html_name = f"{kind}.html"
            html_path = out_dir / html_name
            html_path.write_text(html, encoding="utf-8")

            assessment_entry[kind] = {
                "previewUrl": f"/previews/{unit_slug}/{assessment_id}/{html_name}",
                "sourceModifiedAt": file_modified_iso(doc_path),
                "paragraphCount": len(paragraphs),
                "previewParagraphCount": len(preview_paras),
            }

        if assessment_entry:
            index[assessment_id] = assessment_entry

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(index)} assessment preview sets → {out_json.relative_to(repo_root)}")


if __name__ == "__main__":
    main()
