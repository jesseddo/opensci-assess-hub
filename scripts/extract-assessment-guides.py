#!/usr/bin/env python3
"""
Generate assessment-guides JSON from ingested manifest + OpenSciEd unit folder.

Links each formal assessment to a related TE opportunity row, then synthesizes
AssessmentGuide records from TE facilitation text and answer-key docx files.

Usage:
  python3 scripts/extract-assessment-guides.py <unit-dir> <manifest.json> <guides-out.json>
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def docx_paragraphs(docx_path: str) -> List[str]:
    with zipfile.ZipFile(docx_path) as zf:
        root = ET.fromstring(zf.read("word/document.xml"))
    texts: List[str] = []
    for para in root.iter(f"{NS}p"):
        parts = [node.text for node in para.iter(f"{NS}t") if node.text]
        t = "".join(parts).strip()
        if t:
            texts.append(t)
    return texts


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_pe_code(building_towards: str) -> Optional[str]:
    if not building_towards:
        return None
    match = re.search(
        r"Building\s+towards:\s*(\d+\.[A-Z0-9]+)",
        building_towards,
        re.IGNORECASE,
    )
    return match.group(1) if match else None


def strip_building_prefix(text: str) -> str:
    result = text.strip()
    result = re.sub(r"^Building towards:\s*", "", result, flags=re.IGNORECASE)
    result = re.sub(r"^\d+\.[A-Z0-9]+\s+", "", result)
    return normalize_space(result)


def first_sentence(text: str, max_len: int = 220) -> str:
    cleaned = normalize_space(text)
    if not cleaned:
        return ""
    match = re.match(r"^(.+?[.!?])(?:\s|$)", cleaned)
    sentence = match.group(1) if match else cleaned
    if len(sentence) > max_len:
        return sentence[: max_len - 1].rstrip() + "…"
    return sentence


def bulletize_look_listen(text: str) -> List[str]:
    if not text or not text.strip():
        return []
    body = text.strip()
    body = re.sub(r"^What to look/listen for:?\s*", "", body, flags=re.IGNORECASE)
    body = re.sub(r"^What to look for/listen for\s*", "", body, flags=re.IGNORECASE)
    body = re.sub(r"^What to listen for:?\s*", "", body, flags=re.IGNORECASE)
    body = re.sub(r"^What to look for:?\s*", "", body, flags=re.IGNORECASE)

    lines = [normalize_space(ln) for ln in body.split("\n") if normalize_space(ln)]
    bullets: List[str] = []
    for line in lines:
        if line.lower().startswith("see ") and "key" in line.lower():
            continue
        if len(line) < 24:
            continue
        if line.endswith(":") and len(line) < 48:
            continue
        bullets.append(line)

    if not bullets and body:
        for chunk in re.split(r"(?<=[.!?])\s+", normalize_space(body)):
            if len(chunk) >= 24:
                bullets.append(chunk)

    deduped: List[str] = []
    seen: set[str] = set()
    for item in bullets:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped[:8]


def score_te_link(formal: Dict[str, Any], te: Dict[str, Any]) -> int:
    if formal.get("lessonNum") != te.get("lessonNum"):
        return 0
    if te.get("source") != "te-opportunity":
        return 0

    score = 0
    title = (formal.get("title") or "").lower()
    title_tokens = [t for t in re.split(r"[^a-z0-9]+", title) if len(t) > 3]

    files = formal.get("files") or {}
    handout = (files.get("studentHandout") or "").replace("\\", "/")
    key_path = (files.get("answerKey") or "").replace("\\", "/")
    key_stem = Path(key_path).stem.lower() if key_path else ""

    look = (te.get("lookListenFor") or "").lower()
    todo = (te.get("whatToDo") or "").lower()
    blob = f"{look} {todo}"

    if title and title in blob:
        score += 12
    for token in title_tokens:
        if token in blob:
            score += 3
    if key_stem and key_stem[:24] in blob:
        score += 18
    if "assessment key" in blob and any(token in blob for token in title_tokens):
        score += 14

    te_handout = ((te.get("files") or {}).get("studentHandout") or "").replace("\\", "/")
    if handout and te_handout and handout == te_handout:
        score += 25

    if (te.get("buildingTowards") or "").strip():
        score += 1

    return score


def link_formal_to_te(formal: Dict[str, Any], opportunities: List[Dict[str, Any]]) -> Optional[str]:
    best_id: Optional[str] = None
    best_score = 0
    for te in opportunities:
        score = score_te_link(formal, te)
        if score > best_score:
            best_score = score
            best_id = te.get("id")
    return best_id if best_score >= 6 else None


def key_paragraphs(unit_dir: Path, key_rel: Optional[str]) -> List[str]:
    if not key_rel:
        return []
    key_path = unit_dir / key_rel
    if not key_path.exists():
        return []
    try:
        return docx_paragraphs(str(key_path))
    except (OSError, KeyError, ET.ParseError):
        return []


def classify_key_line(line: str) -> str:
    lower = line.lower()
    if any(k in lower for k in ("misconception", "incorrect", "common gap", "common error")):
        return "gap"
    if any(
        k in lower
        for k in (
            "if students",
            "students may",
            "students might",
            "students struggle",
            "students do not",
            "without explaining",
            "only one object",
        )
    ):
        return "gap"
    if lower.startswith("sample student") or lower.startswith("approaching"):
        return "sample"
    if len(line) >= 40 and any(ch in line for ch in ".!?"):
        return "strong"
    return "other"


def is_noise_paragraph(line: str) -> bool:
    lower = line.lower()
    if len(line) > 320:
        return True
    if lower.startswith("scoring guidance"):
        return True
    if "soccer is becoming" in lower or "traumatic brain injury" in lower:
        return True
    if lower.startswith("openscied") or lower.startswith("answer key"):
        return True
    return False


def insights_from_answer_key(paragraphs: List[str]) -> Tuple[List[str], List[str], List[Dict[str, str]]]:
    strong: List[str] = []
    gaps: List[str] = []
    samples: List[Dict[str, str]] = []

    for para in paragraphs:
        line = normalize_space(para)
        if len(line) < 20 or is_noise_paragraph(line):
            continue
        if re.match(r"^8\.1 Lesson", line, re.I):
            continue
        if re.match(r"^(Answer Key|OpenSciEd|Lesson \d+)", line, re.I):
            continue

        kind = classify_key_line(line)
        if kind == "strong" and len(line) <= 280 and len(strong) < 6:
            strong.append(line)
        elif kind == "gap" and len(gaps) < 6:
            cleaned = re.sub(r"^\+\s*", "", line).strip()
            gaps.append(cleaned)
        elif kind == "sample" and len(samples) < 2:
            samples.append({"label": "From answer key", "excerpt": line})

    return strong, gaps, samples


def sample_from_te(todo: str) -> List[Dict[str, str]]:
    if not todo:
        return []
    samples: List[Dict[str, str]] = []
    blocks = re.split(r"Suggested prompt|Sample student response", todo, flags=re.I)
    if len(blocks) >= 3:
        prompt = normalize_space(blocks[1])[:240]
        response = normalize_space(blocks[2])[:320]
        if prompt:
            samples.append({"label": "Suggested prompt", "excerpt": prompt})
        if response:
            samples.append({"label": "Sample student response", "excerpt": response})
    return samples[:2]


def build_progression(building: str, look: str) -> Dict[str, str]:
    target = first_sentence(strip_building_prefix(building)) if building else ""
    early = ""
    if look:
        bullets = bulletize_look_listen(look)
        partial = next(
            (b for b in bullets if re.search(r"\bmay\b|\bmight\b|\bpartial\b|\bincomplete\b", b, re.I)),
            None,
        )
        early = first_sentence(partial or bullets[0]) if bullets else ""
    if not early and target:
        early = (
            "Students may show partial understanding of the target ideas — "
            "use the criteria below to notice what is emerging versus what is still developing."
        )
    return {"early": early, "target": target}


def build_alignment(formal: Dict[str, Any], te: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    building = (te or {}).get("buildingTowards") or formal.get("buildingTowards") or ""
    pe = (te or {}).get("peCode") or extract_pe_code(building or "")
    note = first_sentence(strip_building_prefix(building), max_len=260) if building else ""
    return {
        "performanceExpectations": formal.get("standards") or [],
        "lessonPe": pe,
        "note": note or None,
    }


def build_guide(
    formal: Dict[str, Any],
    te: Optional[Dict[str, Any]],
    unit_dir: Path,
) -> Optional[Dict[str, Any]]:
    look = ((te or {}).get("lookListenFor") or "").strip()
    building = ((te or {}).get("buildingTowards") or "").strip()
    todo = ((te or {}).get("whatToDo") or "").strip()

    key_rel = (formal.get("files") or {}).get("answerKey")
    key_lines = key_paragraphs(unit_dir, key_rel)
    key_strong, key_gaps, key_samples = insights_from_answer_key(key_lines)

    strong = bulletize_look_listen(look)
    if key_strong:
        strong = dedupe_strings([*strong, *key_strong])[:6]

    gaps = dedupe_strings(key_gaps)[:6]
    misconceptions = [g for g in gaps if "misconception" in g.lower()][:4]

    progression = build_progression(building, look)
    if not progression["target"] and not strong and not gaps:
        return None

    samples = dedupe_samples([*key_samples, *sample_from_te(todo)])[:3]

    emerging: List[str] = []
    for item in strong:
        if is_noise_paragraph(item):
            continue
        if re.search(r"\bmay\b|\bmight\b|\bpartial\b|\bqualitative\b", item, re.I):
            emerging.append(item)
    emerging = dedupe_strings(emerging)[:4]

    alignment = build_alignment(formal, te)
    alignment = {k: v for k, v in alignment.items() if v is not None}

    return {
        "assessmentId": formal["id"],
        "status": "draft",
        "progression": progression,
        "alignment": alignment,
        "understanding": {
            "strong": strong,
            "emerging": emerging,
            "gaps": gaps if gaps else [],
        },
        "misconceptions": misconceptions,
        "studentSamples": samples,
    }


def dedupe_strings(items: List[str]) -> List[str]:
    out: List[str] = []
    seen: set[str] = set()
    for item in items:
        key = item.lower()
        if not item or key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def dedupe_samples(items: List[Dict[str, str]]) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    seen: set[str] = set()
    for item in items:
        excerpt = item.get("excerpt") or ""
        key = excerpt.lower()
        if not excerpt or key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def main() -> None:
    if len(sys.argv) != 4:
        print(
            json.dumps(
                {
                    "error": "Usage: extract-assessment-guides.py <unit-dir> <manifest.json> <guides-out.json>"
                }
            ),
            file=sys.stderr,
        )
        sys.exit(1)

    unit_dir = Path(sys.argv[1])
    manifest_path = Path(sys.argv[2])
    guides_out = Path(sys.argv[3])

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assessments: List[Dict[str, Any]] = manifest.get("assessments") or []

    formal_rows = [a for a in assessments if a.get("source") == "formal-assessment"]
    te_rows = [a for a in assessments if a.get("source") == "te-opportunity"]

    links: Dict[str, str] = {}
    guides: Dict[str, Any] = {}

    for formal in formal_rows:
        te_id = link_formal_to_te(formal, te_rows)
        if te_id:
            links[formal["id"]] = te_id
            formal["linkedTeOpportunityId"] = te_id

        te = next((row for row in te_rows if row.get("id") == te_id), None)
        guide = build_guide(formal, te, unit_dir)
        if guide and (guide["understanding"]["strong"] or guide["progression"]["target"]):
            guides[formal["id"]] = guide

    guides_out.parent.mkdir(parents=True, exist_ok=True)
    guides_out.write_text(json.dumps(guides, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(
        json.dumps(
            {
                "guideCount": len(guides),
                "linkCount": len(links),
                "guidesPath": str(guides_out),
                "links": links,
            }
        )
    )


if __name__ == "__main__":
    main()
