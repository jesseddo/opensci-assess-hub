#!/usr/bin/env python3
"""Extract ASSESSMENT OPPORTUNITY blocks from OpenSciEd Teacher Edition docx files."""
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from html import escape
from pathlib import Path
from typing import Any, Dict, List, Optional

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


def extract_pe_code(building_towards: str) -> Optional[str]:
    if not building_towards:
        return None
    match = re.search(
        r"Building\s+towards:\s*(\d+\.[A-Z0-9]+)",
        building_towards,
        re.IGNORECASE,
    )
    return match.group(1) if match else None


def clean_handout_title(handout_path: Optional[str]) -> Optional[str]:
    if not handout_path:
        return None
    name = Path(handout_path).stem
    name = re.sub(r"^8\.1 Lesson \d+\s+", "", name, flags=re.I)
    name = re.sub(r"^(Handout|Assessment)\s+", "", name, flags=re.I)
    name = name.strip()
    return name or None


def first_actionable_look_listen(look_listen: str) -> Optional[str]:
    if not look_listen or len(look_listen.strip()) < 12:
        return None
    text = look_listen.strip()
    is_listen = bool(re.match(r"^What to listen", text, re.I))
    is_look = bool(re.match(r"^What to look", text, re.I))
    text = re.sub(r"^What to (look|listen) for:?\s*", "", text, flags=re.I).strip()
    # Drop subsection headers
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    body = lines[0] if lines else text
    for ln in lines:
        if len(ln) > 20 and not ln.endswith(":"):
            body = ln
            break
    sentence_match = re.match(r"^(.+?)(?:\.\s|\.\s*$)", body)
    sentence = (sentence_match.group(1) if sentence_match else body).strip()
    if len(sentence) < 12:
        return None
    if is_listen and not re.match(r"^listen", sentence, re.I):
        sentence = f"Listen: {sentence[0].lower()}{sentence[1:]}"
    elif is_look and not re.match(r"^look", sentence, re.I):
        sentence = f"Look for: {sentence}"
    if len(sentence) > 58:
        sentence = sentence[:55].rstrip() + "…"
    return sentence


def paraphrase_building_towards(building_towards: str, index: int) -> str:
    text = building_towards.strip()
    if text.lower().startswith("building towards:"):
        text = text.split(":", 1)[1].strip()
    text = re.sub(r"^\d+\.[A-Z0-9]+\s+", "", text)
    clause = re.split(r"[.—]\s+", text)[0].strip()
    if len(clause) > 56:
        clause = clause[:53].rstrip() + "…"
    return clause or f"Check-in {index}"


def compose_short_title(
    handout_path: Optional[str],
    look_listen: str,
    building_towards: str,
    lesson_num: int,
    index: int,
) -> str:
    handout_label = clean_handout_title(handout_path)
    if handout_label:
        return handout_label
    listen_label = first_actionable_look_listen(look_listen)
    if listen_label:
        return listen_label
    paraphrase = paraphrase_building_towards(building_towards, index)
    if paraphrase and not paraphrase.startswith("Check-in"):
        return paraphrase
    return f"Lesson {lesson_num:02d} · Check-in {index}"


def ose_assessment_type(
    building_towards: str,
    look_listen: str,
    what_to_do: str,
    handout_path: Optional[str],
    title: str = "",
) -> str:
    building = building_towards.lower()
    look = look_listen.lower()
    todo = what_to_do.lower()
    handout = (Path(handout_path).name if handout_path else "").lower()
    title_l = title.lower()
    combined_bl = building + look
    combined_all = building + look + todo + handout

    if (
        "performance task" in building
        or ("summative" in building and "formative" not in building)
        or "end-of-unit" in building
        or "cheerleading headgear assessment" in combined_all
        or "cheerleading assessment" in combined_all
        or re.search(r"part [12][:\s].*assessment", combined_all)
    ):
        return "summative"
    if "pre-assessment" in look or "pre-assessment" in building or "pre assessment" in look:
        return "pre-assessment"
    if (
        "looking back" in handout
        or "looking back" in building
        or "lesson reflection" in building
        or ("reflect on" in look and any(w in look for w in ("learning", "unit", "lesson")))
    ):
        return "lesson-reflection"
    if (
        "peer feedback" in combined_all
        or "stakeholder feedback" in combined_all
        or "provide and receive critiques" in combined_bl
        or "receive critiques about" in combined_bl
        or "critiques about claims" in combined_bl
        or "jigsaw feedback" in combined_all
        or "feedback form" in handout
        or ("stakeholder" in title_l and "feedback" in title_l)
    ):
        return "peer-feedback"
    return "formative"


def classify_opportunity(
    building_towards: str,
    look_listen: str,
    what_to_do: str,
    handout_path: Optional[str],
) -> str:
    """Internal packaging taxonomy only — not shown in UI."""
    blob = f"{building_towards} {look_listen} {what_to_do}".lower()
    if handout_path:
        if any(
            k in blob
            for k in ("design a solution", "define a problem", "criteria and constraints", "protection device")
        ):
            return "engineering-design"
        if any(k in blob for k in ("investigation", "graph", "data", "variable", "control")):
            return "investigation-data"
        return "handout-written"
    if any(k in blob for k in ("discussion", "jigsaw", "critique", "argument")):
        return "discussion-argument"
    if any(k in blob for k in ("investigation", "graph", "data", "variable")):
        return "investigation-data"
    if any(k in blob for k in ("design", "problem", "criteria", "device")):
        return "engineering-design"
    return "observation"


def library_output_for_type(opportunity_type: str, has_handout: bool) -> str:
    if opportunity_type == "named-package":
        return "full-package"
    if opportunity_type in ("observation", "discussion-argument"):
        return "guidance-pdf"
    if opportunity_type == "handout-written":
        return "handout-form-planned"
    if has_handout:
        return "handout-guidance"
    return "guidance-pdf"


def is_te_section_boundary(text: str) -> bool:
    """Stop collecting AO body when the TE returns to lesson activities."""
    if re.match(r"^\d+\s*·\s*", text):
        return True
    if re.match(r"^End of day\b", text, re.I):
        return True
    if re.match(r"^MATERIALS:\s", text, re.I):
        return True
    if re.match(r"^(ADDITIONAL GUIDANCE|KEY IDEAS|ALTERNATE ACTIVITY)\b", text, re.I):
        return True
    if text.startswith("✱") and len(text) > 40:
        return True
    return False


def is_continuation_header(text: str) -> bool:
    return bool(re.match(r"^continued from previous page", text.strip(), re.I))


def infer_continuation_section(previous: Optional[Dict[str, Any]]) -> str:
    if not previous:
        return "narrative"
    if previous.get("whatToDo"):
        return "do"
    if previous.get("lookListenFor"):
        return "do"
    return "narrative"


def append_field(current: str, addition: str) -> str:
    if not addition:
        return current
    if not current:
        return addition
    return current + "\n" + addition


def match_handout_from_blob(blob: str, handouts: List[Dict[str, str]]) -> Optional[str]:
    if not blob.strip():
        return None
    return match_handout(blob, "", handouts)


def trim_ao_field(text: str, max_len: int = 4000) -> str:
    text = text.strip()
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def match_handout(building_towards: str, look_listen: str, handouts: List[Dict[str, str]]) -> Optional[str]:
    blob = f"{building_towards} {look_listen}".lower()
    keywords = []
    for phrase in (
        "initial model",
        "driving",
        "graph",
        "deformation",
        "protection",
        "design",
        "feedback",
        "modeling",
        "collision",
        "stakeholder",
        "final design proposal",
        "reviewing our driving",
    ):
        if phrase in blob:
            keywords.append(phrase)
    if not keywords:
        return None
    best: Optional[str] = None
    best_score = 0
    for h in handouts:
        name = h["name"].lower()
        score = sum(1 for k in keywords if k in name)
        if score > best_score:
            best_score = score
            best = h["path"]
    return best if best_score > 0 else None


def parse_opportunities(
    texts: List[str],
    handouts: List[Dict[str, str]],
    lesson_num: int,
) -> List[Dict[str, Any]]:
    opportunities: List[Dict[str, Any]] = []
    i = 0
    ao_index = 0
    while i < len(texts):
        if not re.match(r"^ASSESSMENT OPPORTUNITY\s*$", texts[i], re.I):
            i += 1
            continue
        ao_index += 1
        building = ""
        look_listen = ""
        what_to_do = ""
        j = i + 1
        section = None
        started_as_continuation = False
        previous = opportunities[-1] if opportunities else None
        if j < len(texts) and is_continuation_header(texts[j]):
            started_as_continuation = True
            section = infer_continuation_section(previous)
            if previous and previous.get("buildingTowards"):
                building = previous["buildingTowards"]
            j += 1
        while j < len(texts):
            t = texts[j]
            if re.match(r"^ASSESSMENT OPPORTUNITY\s*$", t, re.I):
                break
            if t.lower().startswith("building towards:"):
                building = t
                section = None
            elif re.match(r"^What to (look|listen)", t, re.I):
                section = "look"
                look_listen = t
            elif t.lower().startswith("what to do:"):
                section = "do"
                what_to_do = t
            elif section == "look":
                if is_te_section_boundary(t):
                    break
                elif not t.startswith("✱"):
                    look_listen = append_field(look_listen, t)
            elif section == "do":
                if is_te_section_boundary(t):
                    break
                elif not t.startswith("✱"):
                    what_to_do = append_field(what_to_do, t)
            elif section == "narrative":
                if is_te_section_boundary(t):
                    break
                elif not t.startswith("✱"):
                    if re.search(r"\b(listen|circulate)\b", t, re.I) and not look_listen:
                        look_listen = append_field(look_listen, t)
                    else:
                        what_to_do = append_field(what_to_do, t)
            elif is_te_section_boundary(t) and (building or look_listen or what_to_do):
                break
            elif section is None and not is_te_section_boundary(t) and not t.startswith("✱"):
                section = "narrative"
                if re.search(r"\b(listen|circulate)\b", t, re.I):
                    look_listen = append_field(look_listen, t)
                else:
                    what_to_do = append_field(what_to_do, t)
            j += 1

        building = trim_ao_field(building)
        look_listen = trim_ao_field(look_listen)
        what_to_do = trim_ao_field(what_to_do)

        if previous and started_as_continuation:
            previous["lookListenFor"] = trim_ao_field(
                append_field(previous.get("lookListenFor") or "", look_listen)
            )
            previous["whatToDo"] = trim_ao_field(
                append_field(previous.get("whatToDo") or "", what_to_do)
            )

        handout_path = match_handout(building, look_listen, handouts)
        if not handout_path:
            handout_path = match_handout_from_blob(what_to_do, handouts)
        opp_type = classify_opportunity(building, look_listen, what_to_do, handout_path)
        lib_out = library_output_for_type(opp_type, bool(handout_path))
        pe_code = extract_pe_code(building)
        short = compose_short_title(handout_path, look_listen, building, lesson_num, ao_index)
        a_type = ose_assessment_type(building, look_listen, what_to_do, handout_path, short)

        opportunities.append(
            {
                "index": ao_index,
                "shortTitle": short,
                "peCode": pe_code,
                "assessmentType": a_type,
                "opportunityType": opp_type,
                "libraryOutput": lib_out,
                "buildingTowards": building,
                "lookListenFor": look_listen,
                "whatToDo": what_to_do,
                "studentHandout": handout_path,
            }
        )
        i = j
    return opportunities


def guidance_html(
    unit_id: str,
    lesson_num: int,
    lesson_title: str,
    opportunity: Dict[str, Any],
) -> str:
    ao = opportunity["index"]
    title = escape(opportunity.get("shortTitle") or "Assessment opportunity")
    building = escape(opportunity.get("buildingTowards") or "")
    look = escape(opportunity.get("lookListenFor") or "")
    todo = escape(opportunity.get("whatToDo") or "")
    pe = opportunity.get("peCode")
    pe_meta = f" · {escape(pe)}" if pe else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Unit {unit_id} Lesson {lesson_num:02d} — {title}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1.5rem; color: #1a2e35; line-height: 1.5; }}
    h1 {{ font-size: 1.125rem; color: #0d5c4b; margin-bottom: 0.25rem; }}
    .meta {{ font-size: 0.75rem; color: #5a6b72; margin-bottom: 1.5rem; }}
    h2 {{ font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.04em; color: #0d5c4b; margin-top: 1.25rem; }}
    p {{ font-size: 0.9375rem; white-space: pre-wrap; }}
    @media print {{ body {{ margin: 0.75in; }} }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <p class="meta">OpenSciEd Unit {unit_id} · Lesson {lesson_num:02d} · {escape(lesson_title)}{pe_meta}</p>
  <h2>Building towards</h2>
  <p>{building or "—"}</p>
  <h2>What to look / listen for</h2>
  <p>{look or "—"}</p>
  {"<h2>What to do</h2><p>" + todo + "</p>" if todo else ""}
  <p class="meta" style="margin-top:2rem">From OpenSciEd Teacher Edition. See full TE for facilitation context.</p>
</body>
</html>
"""


def write_guidance_files(
    repo_root: Path,
    unit_id: str,
    lesson_num: int,
    lesson_title: str,
    opportunities: List[Dict[str, Any]],
) -> None:
    out_dir = repo_root / "public" / "guidance" / unit_id.replace(".", "-")
    out_dir.mkdir(parents=True, exist_ok=True)
    for opp in opportunities:
        ao = opp["index"]
        filename = f"L{lesson_num:02d}-AO{ao}.html"
        path = out_dir / filename
        path.write_text(
            guidance_html(unit_id, lesson_num, lesson_title, opp),
            encoding="utf-8",
        )
        opp["guidancePath"] = f"/guidance/{unit_id.replace('.', '-')}/{filename}"


def extract_lesson(
    repo_root: Path,
    unit_id: str,
    lesson_num: int,
    lesson_title: str,
    te_path: Path,
    handout_files: List[Path],
) -> List[Dict[str, Any]]:
    handouts = [{"name": f.name, "path": str(f)} for f in handout_files]
    texts = docx_paragraphs(str(te_path))
    opportunities = parse_opportunities(texts, handouts, lesson_num)
    write_guidance_files(repo_root, unit_id, lesson_num, lesson_title, opportunities)
    return opportunities


def main() -> None:
    if len(sys.argv) < 4:
        print(
            json.dumps({"error": "Usage: extract-te-assessment-opportunities.py <repo-root> <unit-id> <lessons-json>"}),
            file=sys.stderr,
        )
        sys.exit(1)
    repo_root = Path(sys.argv[1])
    unit_id = sys.argv[2]
    lessons_payload = json.loads(sys.argv[3])
    all_opps: List[Dict[str, Any]] = []
    for row in lessons_payload:
        lesson_num = row["lessonNum"]
        te_path = Path(row["teacherEditionAbs"])
        if not te_path.exists():
            continue
        handouts = [Path(p) for p in row.get("handoutAbsPaths", [])]
        opps = extract_lesson(
            repo_root,
            unit_id,
            lesson_num,
            row.get("shortTitle") or f"Lesson {lesson_num}",
            te_path,
            handouts,
        )
        for opp in opps:
            opp["lessonNum"] = lesson_num
            opp["lesson"] = f"Lesson {lesson_num:02d}"
            opp["id"] = f"{unit_id.replace('.', '')}-{lesson_num}-ao-{opp['index']}"
            all_opps.append(opp)
    print(json.dumps(all_opps))


if __name__ == "__main__":
    main()
