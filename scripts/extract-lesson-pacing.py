#!/usr/bin/env python3
"""Extract suggested lesson pacing from OpenSciEd Unit Overview Materials docx."""
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from typing import Any, Dict, Optional

NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def paragraph_texts(docx_path: str) -> list[str]:
    with zipfile.ZipFile(docx_path) as zf:
        root = ET.fromstring(zf.read("word/document.xml"))
    texts: list[str] = []
    for para in root.iter(f"{NS}p"):
        parts = [node.text for node in para.iter(f"{NS}t") if node.text]
        text = "".join(parts).strip()
        if text:
            texts.append(text)
    return texts


def extract_lesson_pacing(docx_path: str) -> Dict[str, Any]:
    texts = paragraph_texts(docx_path)
    lessons: Dict[int, int] = {}
    total_days: Optional[int] = None

    i = 0
    while i < len(texts):
        text = texts[i]
        lesson_match = re.match(r"^LESSON\s+(\d+)\s*$", text, re.IGNORECASE)
        if lesson_match:
            lesson_num = int(lesson_match.group(1))
            if i + 1 < len(texts):
                day_match = re.match(r"^(\d+)\s+days?\s*$", texts[i + 1], re.IGNORECASE)
                if day_match:
                    lessons[lesson_num] = int(day_match.group(1))
                    i += 2
                    continue

        total_match = re.search(r"^(\d+)\s+days?\s+total\s*$", text, re.IGNORECASE)
        if total_match:
            total_days = int(total_match.group(1))

        i += 1

    return {"lessons": lessons, "totalDays": total_days}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(1)
    print(json.dumps(extract_lesson_pacing(sys.argv[1])))
