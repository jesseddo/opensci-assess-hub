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

SEE_KEY_RE = re.compile(r"^See .+(?:Key|Assessment Key|Item alignment)", re.IGNORECASE)
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
    r"^(building towards:|what to look(?:/listen)?(?: for)?:|what to do:)",
    re.IGNORECASE,
)
LOOK_HEADER_RE = re.compile(r"^what to look(?:/listen)?(?: for)?:?\s*(.*)$", re.IGNORECASE)
LESSON_FLOW_RE = re.compile(
    r"^(Check criteria|Compare overall|Suggested prompt|Sample student response|Project slide|Display slide|Reflect on weighted|Say,|Ask students to complete|Circulate as|Allow students to work|\d+ · )",
    re.IGNORECASE,
)
TITLE_STOP_WORDS = frozenset(
    {
        "assessment",
        "performance",
        "task",
        "form",
        "other",
        "modeling",
    }
)


def part_proximity_bonus(paragraphs: List[str], start: int, assessment_title: str) -> int:
    part_match = re.search(r"part (\d+)", assessment_title.lower())
    if not part_match:
        return 0
    part_num = part_match.group(1)
    for offset, paragraph in enumerate(paragraphs[start : min(start + 10, len(paragraphs))]):
        if re.search(rf"part {part_num}\b", paragraph, re.IGNORECASE):
            return 24 - offset
        if re.search(rf"part {'2' if part_num == '1' else '1'}\b", paragraph, re.IGNORECASE):
            return -20
    return -8


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
    if stripped.lower().startswith("continued from previous"):
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


def is_lesson_flow(paragraph: str) -> bool:
    return bool(LESSON_FLOW_RE.match(paragraph.strip()))


def title_tokens(title: str) -> List[str]:
    return [w for w in re.findall(r"[a-z0-9]+", title.lower()) if len(w) > 2]


def excerpt_window_score(paragraphs: List[str], start: int, assessment_title: str) -> int:
    window = " ".join(paragraphs[start : min(start + 18, len(paragraphs))]).lower()
    title_lower = assessment_title.lower()
    score = 0

    if title_lower in window:
        score += 80

    for phrase in re.findall(r"[a-z0-9][a-z0-9\\-— ]{8,}", title_lower):
        phrase = phrase.strip()
        if phrase and phrase in window:
            score += 30

    part_match = re.search(r"part (\d+)", title_lower)
    if part_match:
        part_num = part_match.group(1)
        if re.search(rf"part {part_num}\b", window, re.IGNORECASE):
            score += 60
        wrong_part = "2" if part_num == "1" else "1"
        if re.search(rf"part {wrong_part}\b", window, re.IGNORECASE) and not re.search(
            rf"part {part_num}\b", window, re.IGNORECASE
        ):
            score -= 50

    assessment_num = re.search(r"assessment (\d+)", title_lower)
    if assessment_num:
        num = assessment_num.group(1)
        if re.search(rf"assessment {num}\b", window) or re.search(rf"key {num}\b", window):
            score += 50
        other = "2" if num == "1" else "1"
        if re.search(rf"key {other}\b", window) and not re.search(rf"key {num}\b", window):
            score -= 35
        if re.search(r"assessment 1 or", window) or re.search(r"assessment 2 or", window):
            score -= 45

    for token in title_tokens(assessment_title):
        if token not in TITLE_STOP_WORDS and token in window:
            score += 12

    if "baseball" in title_lower and "baseball" in window:
        score += 35
    if "baseball" in title_lower and "10.b" in window:
        score += 25
    if "soccer" in title_lower and "soccer" in window:
        score += 35
    if "cheerleading" in title_lower and "cheerleading" in window:
        score += 35
    if "stakeholder" in title_lower and "stakeholder feedback form" in window:
        score += 45
    if "looking back" in title_lower and "looking back" in window:
        score += 40

    if re.search(r"what to look", window, re.IGNORECASE):
        score += 10
    if "see key" in window or SEE_KEY_RE.search(window):
        score += 15

    score += part_proximity_bonus(paragraphs, start, assessment_title)
    return score


def find_distribute_anchor(paragraphs: List[str], assessment_title: str) -> Optional[int]:
    title_lower = assessment_title.lower()
    for i, paragraph in enumerate(paragraphs):
        lower = paragraph.lower()
        if f"distribute {title_lower}" in lower:
            return i
        if title_lower in lower and lower.startswith("materials:"):
            return i
    return None


def find_building_towards_start(paragraphs: List[str], assessment_title: str) -> Optional[int]:
    candidates = [
        i
        for i, paragraph in enumerate(paragraphs)
        if re.search(r"building towards:", paragraph, re.IGNORECASE)
    ]
    if not candidates:
        return None

    best = max(candidates, key=lambda idx: excerpt_window_score(paragraphs, idx, assessment_title))
    if excerpt_window_score(paragraphs, best, assessment_title) >= 12:
        return best
    return None


def excerpt_end_index(paragraphs: List[str], start: int) -> int:
    end = start + 1
    in_what_to_do = False

    while end < len(paragraphs):
        paragraph = paragraphs[end]
        if is_te_noise(paragraph):
            break

        if re.match(r"^what to do:?\s*$", paragraph, re.IGNORECASE):
            in_what_to_do = True
            end += 1
            continue

        if in_what_to_do and is_lesson_flow(paragraph):
            break

        if (
            not in_what_to_do
            and end > start + 2
            and is_lesson_flow(paragraph)
            and not re.match(r"^questions? \d", paragraph, re.IGNORECASE)
        ):
            break

        end += 1

    return end


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
    while i < len(paragraphs) and is_te_noise(paragraphs[i]):
        i += 1

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

        look_match = LOOK_HEADER_RE.match(p)
        if look_match:
            parts.append('<h2 class="section">What to look / listen for</h2>')
            inline = look_match.group(1).strip()
            if inline:
                if SEE_KEY_RE.search(inline) or inline.lower().startswith("see "):
                    parts.append(f'<aside class="callout">{escape(inline)}</aside>')
                else:
                    parts.append(f"<p>{escape(inline)}</p>")
            i += 1
            look_items: List[str] = []
            while i < len(paragraphs):
                nxt = paragraphs[i]
                if (
                    is_te_noise(nxt)
                    or TE_SECTION_START_RE.match(nxt)
                    or re.match(r"^what to do:?\s*$", nxt, re.IGNORECASE)
                ):
                    break
                if SEE_KEY_RE.match(nxt) or (
                    nxt.lower().startswith("see key") and look_items
                ):
                    break
                if is_lesson_flow(nxt):
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

        if SEE_KEY_RE.match(p) or p.lower().startswith("see key"):
            parts.append(f'<aside class="callout">{escape(p)}</aside>')
            i += 1
            continue

        if re.match(r"^what to do:?\s*$", p, re.IGNORECASE):
            parts.append('<h2 class="section">What to do</h2>')
            i += 1
            action_items: List[str] = []
            while i < len(paragraphs):
                nxt = paragraphs[i]
                if is_te_noise(nxt) or TE_SECTION_START_RE.match(nxt):
                    break
                if is_lesson_flow(nxt):
                    break
                action_items.append(nxt)
                i += 1
            if action_items:
                parts.append(
                    "<ul class=\"look-list\">"
                    + "".join(f"<li>{escape(item)}</li>" for item in action_items)
                    + "</ul>"
                )
            continue

        what_to_do = re.match(r"^what to do:\s*(.+)$", p, re.IGNORECASE)
        if what_to_do:
            parts.append('<h2 class="section">What to do</h2>')
            parts.append(f"<p>{escape(what_to_do.group(1))}</p>")
            i += 1
            continue

        if p.lower().startswith("distribute ") or p.lower().startswith("materials:"):
            parts.append(f"<p><strong>{escape(p)}</strong></p>")
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


FILE_UPLOAD_QUESTION_RE = re.compile(
    r"\b(draw|diagram|pictures?|sketches?|images?|upload|photos?)\b",
    re.IGNORECASE,
)


def is_remote_url(value: Optional[str]) -> bool:
    if not value:
        return False
    return value.startswith("http://") or value.startswith("https://")


def google_form_snapshot_styles() -> str:
    return """
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: Roboto, "Google Sans", system-ui, sans-serif;
      max-width: 46rem;
      margin: 0 auto;
      padding: 0.75rem 0.75rem 2rem;
      color: #202124;
      background: #f0ebf8;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .form-header-card,
    .form-question,
    .form-image-card {
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      margin: 0.75rem 0;
      overflow: hidden;
    }
    .form-header-card {
      border-top: 8px solid #673ab7;
      padding: 1.35rem 1.4rem 1.2rem;
    }
    .form-header-card h1 {
      font-family: "Google Sans", Roboto, sans-serif;
      font-size: 2rem;
      font-weight: 400;
      margin: 0 0 0.65rem;
      line-height: 1.25;
      color: #202124;
    }
    .form-header-card .form-description {
      font-size: 0.875rem;
      color: #5f6368;
      margin: 0;
    }
    .form-header-card .form-meta {
      font-size: 0.75rem;
      color: #80868b;
      margin: 0.85rem 0 0;
    }
    .form-question {
      padding: 1.15rem 1.4rem 1.25rem;
      display: flow-root;
    }
    .form-question-text {
      font-size: 1rem;
      font-weight: 400;
      color: #202124;
      margin: 0 0 0.85rem;
      line-height: 1.5;
      overflow-wrap: anywhere;
      word-wrap: break-word;
    }
    .choice-list { list-style: none; padding: 0; margin: 0; }
    .choice-list li {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      margin-bottom: 0.6rem;
      font-size: 0.875rem;
      color: #3c4043;
      line-height: 1.45;
    }
    .choice-list li::before {
      content: "";
      width: 1.125rem;
      height: 1.125rem;
      border: 2px solid #5f6368;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 0.1rem;
    }
    .response-surface {
      border-bottom: 1px solid #dadce0;
      min-height: 2.75rem;
      padding: 0.35rem 0;
      font-size: 0.875rem;
      color: #80868b;
    }
    .form-image-card {
      padding: 1rem 1.4rem 1.2rem;
    }
    .form-image-card figcaption {
      font-size: 0.875rem;
      font-weight: 500;
      color: #202124;
      margin-bottom: 0.75rem;
    }
    .form-image-card img {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #e8eaed;
    }
    .snapshot-note {
      margin: 1rem 0 0;
      font-size: 0.75rem;
      color: #5f6368;
      line-height: 1.5;
      padding: 0 0.25rem;
    }
    """


def google_form_snapshot_config_path(out_dir: Path) -> Path:
    return out_dir / "google-form.snapshot.json"


def load_google_form_snapshot_config(out_dir: Path) -> Optional[Dict[str, Any]]:
    path = google_form_snapshot_config_path(out_dir)
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def render_snapshot_response(response: str, hint: Optional[str] = None) -> str:
    if response == "file-upload":
        return ""
    if response == "multiple-choice":
        return ""
    return (
        '<div class="response-surface" aria-disabled="true">'
        "Your answer"
        "</div>"
    )


def render_snapshot_block(block: Dict[str, Any]) -> str:
    block_type = block.get("type")
    if block_type == "image":
        caption = block.get("caption") or ""
        src = block.get("src") or ""
        alt = block.get("alt") or caption
        return (
            '<figure class="form-image-card">'
            f"<figcaption>{escape(caption)}</figcaption>"
            f'<img src="{escape(src)}" alt="{escape(alt)}" loading="lazy" />'
            "</figure>"
        )

    if block_type != "question":
        return ""

    question = block.get("text") or ""
    response = block.get("response") or "paragraph"
    parts = [
        '<div class="form-question">',
        f'<p class="form-question-text">{escape(question)}</p>',
    ]
    choices = block.get("choices") or []
    if response == "multiple-choice" and choices:
        parts.append(
            '<ul class="choice-list">'
            + "".join(f"<li>{escape(choice)}</li>" for choice in choices)
            + "</ul>"
        )
    else:
        parts.append(render_snapshot_response(response, block.get("hint")))
    parts.append("</div>")
    return "".join(parts)


def format_google_form_snapshot_from_config(config: Dict[str, Any]) -> str:
    blocks = config.get("blocks") or []
    return "".join(render_snapshot_block(block) for block in blocks)


def google_form_snapshot_html_from_config(
    *,
    unit_id: str,
    lesson: str,
    config: Dict[str, Any],
    source_note: str,
) -> str:
    title = config.get("title") or "Google Form"
    description = config.get("description") or ""
    body_html = format_google_form_snapshot_from_config(config)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)} — Google Form snapshot</title>
  <style>{google_form_snapshot_styles()}</style>
</head>
<body>
  <header class="form-header-card">
    <h1>{escape(title)}</h1>
    <p class="form-description">{escape(description)}</p>
    <p class="form-meta">Eddo digitized Google Form · OpenSciEd Unit {escape(unit_id)} · {escape(lesson)}</p>
  </header>
  {body_html}
  <p class="snapshot-note">{escape(source_note)}</p>
</body>
</html>
"""


def form_response_markup(question: str) -> str:
    if FILE_UPLOAD_QUESTION_RE.search(question):
        return ""
    return (
        '<div class="response-surface" aria-disabled="true">'
        "Long answer text"
        "</div>"
    )


def format_google_form_snapshot(paragraphs: List[str]) -> str:
    parts: List[str] = []
    i = 0
    pending_intro: List[str] = []

    def flush_intro() -> None:
        if not pending_intro:
            return
        parts.append(
            '<div class="form-description">'
            + "".join(f"<p>{escape(p)}</p>" for p in pending_intro)
            + "</div>"
        )
        pending_intro.clear()

    while i < len(paragraphs):
        p = paragraphs[i]

        if FIELD_RE.match(p):
            i += 1
            continue

        if len(p) < 60 and p.endswith("Assessment") and not QUESTION_RE.match(p):
            i += 1
            continue

        if QUESTION_RE.match(p) or SUB_QUESTION_RE.match(p):
            flush_intro()
            question_html = escape(p)
            i += 1
            scenarios, i = collect_scenario_options(paragraphs, i)
            options, i = collect_mc_options(paragraphs, i)
            choices = scenarios or options

            block = [
                '<div class="form-question">',
                f'<p class="form-question-text">{question_html}</p>',
            ]
            if choices:
                block.append(
                    '<ul class="choice-list">'
                    + "".join(f"<li>{escape(opt)}</li>" for opt in choices)
                    + "</ul>"
                )
            else:
                block.append(form_response_markup(p))
            block.append("</div>")
            parts.append("".join(block))
            continue

        pending_intro.append(p)
        i += 1

    flush_intro()
    return "".join(parts)


def google_form_snapshot_html(
    *,
    unit_id: str,
    lesson: str,
    assessment_title: str,
    form_url: str,
    source_file: str,
    paragraphs: List[str],
) -> str:
    body_html = format_google_form_snapshot(paragraphs)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(assessment_title)} — Google Form snapshot</title>
  <style>{google_form_snapshot_styles()}</style>
</head>
<body>
  <header class="form-banner">
    <h1>{escape(assessment_title)}</h1>
    <p class="meta">Eddo digitized Google Form · OpenSciEd Unit {escape(unit_id)} · {escape(lesson)}</p>
  </header>
  {body_html}
  <p class="snapshot-note">Static form preview generated from {escape(source_file)} — not a live embed. Open the linked Google Form to respond or upload files.</p>
</body>
</html>
"""


def write_google_form_snapshot(
    *,
    repo_root: Path,
    unit_slug: str,
    assessment_id: str,
    unit_id: str,
    lesson: str,
    title: str,
    form_url: str,
    handout_path: Path,
    paragraphs: List[str],
) -> Dict[str, Any]:
    out_dir = repo_root / "public" / "previews" / unit_slug / assessment_id
    out_dir.mkdir(parents=True, exist_ok=True)
    html_name = "google-form.html"
    html_path = out_dir / html_name

    snapshot_config = load_google_form_snapshot_config(out_dir)
    if snapshot_config:
        config_path = google_form_snapshot_config_path(out_dir)
        html = google_form_snapshot_html_from_config(
            unit_id=unit_id,
            lesson=lesson,
            config=snapshot_config,
            source_note=(
                f"Curated form preview from {config_path.name} — matches the digitized Google Form. "
                "Open the linked form to respond or upload files."
            ),
        )
        source_modified = file_modified_iso(config_path)
        generated_from = config_path.name
        preview_count = len(snapshot_config.get("blocks") or [])
    else:
        html = google_form_snapshot_html(
            unit_id=unit_id,
            lesson=lesson,
            assessment_title=title,
            form_url=form_url,
            source_file=handout_path.name,
            paragraphs=paragraphs,
        )
        source_modified = file_modified_iso(handout_path)
        generated_from = handout_path.name
        preview_count = len(paragraphs)

    html_path.write_text(html, encoding="utf-8")
    return {
        "previewUrl": f"/previews/{unit_slug}/{assessment_id}/{html_name}",
        "sourceModifiedAt": source_modified,
        "formUrl": form_url,
        "generatedFrom": generated_from,
        "previewParagraphCount": preview_count,
    }


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


def trim_excerpt_start(paragraphs: List[str], start: int) -> int:
    while start < len(paragraphs) and is_te_noise(paragraphs[start]):
        start += 1
    return start


def teacher_guide_excerpt(paragraphs: List[str], assessment_title: str) -> Tuple[List[str], bool]:
    """Pull TE facilitation section for the named assessment."""
    distribute = find_distribute_anchor(paragraphs, assessment_title)
    building = find_building_towards_start(paragraphs, assessment_title)

    building_score = (
        excerpt_window_score(paragraphs, building, assessment_title) if building is not None else 0
    )
    distribute_score = (
        excerpt_window_score(paragraphs, distribute, assessment_title)
        if distribute is not None
        else 0
    )
    dual_assessment_distribute = bool(
        distribute is not None
        and re.search(r"assessment 1 or|assessment 2 or", paragraphs[distribute], re.IGNORECASE)
    )

    candidates: List[Tuple[int, int]] = []
    if building is not None:
        candidates.append((building, building_score))
    if distribute is not None and (
        building_score < 35
        or (distribute_score >= building_score + 25 and not dual_assessment_distribute)
    ):
        candidates.append((distribute, distribute_score))

    if candidates:
        start = trim_excerpt_start(paragraphs, max(candidates, key=lambda item: item[1])[0])
        end = excerpt_end_index(paragraphs, start)
        return paragraphs[start:end], False

    for i, paragraph in enumerate(paragraphs):
        if paragraph.lower().strip() == assessment_title.lower() or (
            assessment_title.lower() in paragraph.lower()
            and len(paragraph) < len(assessment_title) + 20
        ):
            end = min(len(paragraphs), i + 12)
            return paragraphs[i:end], end < len(paragraphs)

    return paragraphs[:25], len(paragraphs) > 25


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
            if kind == "google-form" and is_remote_url(rel):
                continue
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

        form_url = files.get("googleForm")
        handout_path = resolve_file(unit_dir, files.get("studentHandout"))
        if is_remote_url(form_url) and handout_path:
            handout_paragraphs = docx_paragraphs(handout_path)
            if handout_paragraphs:
                assessment_entry["google-form"] = write_google_form_snapshot(
                    repo_root=repo_root,
                    unit_slug=unit_slug,
                    assessment_id=assessment_id,
                    unit_id=unit_id,
                    lesson=lesson,
                    title=title,
                    form_url=form_url,
                    handout_path=handout_path,
                    paragraphs=handout_paragraphs,
                )

        if assessment_entry:
            index[assessment_id] = assessment_entry

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(index)} assessment preview sets → {out_json.relative_to(repo_root)}")


if __name__ == "__main__":
    main()
