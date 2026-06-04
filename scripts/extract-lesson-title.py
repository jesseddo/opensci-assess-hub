#!/usr/bin/env python3
"""Extract the driving-question lesson title from an OpenSciEd Teacher Edition docx."""
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from typing import Optional

NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def first_lesson_title(docx_path: str) -> Optional[str]:
    with zipfile.ZipFile(docx_path) as zf:
        root = ET.fromstring(zf.read("word/document.xml"))
    for para in root.iter(f"{NS}p"):
        parts = [node.text for node in para.iter(f"{NS}t") if node.text]
        text = "".join(parts).strip()
        match = re.match(r"Lesson\s+\d+:\s*(.+)", text)
        if match:
            return match.group(1).strip()
    return None


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(1)
    title = first_lesson_title(sys.argv[1])
    if title:
        print(title)
