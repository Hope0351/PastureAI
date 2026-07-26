# -*- coding: utf-8 -*-
from pathlib import Path

ROOT = Path(r"C:\Users\Dell\Projects\PastureAI")

pairs = [
    ("\ufffd", ""),
    ("\u12a5\u122d\u121d\u1333", "\u12a5\u122d\u121d\u1303"),  # እርምጳ -> እርምጃ
    ("\u12a5\u12e8\u121b\u123d\u122b\u120d", "\u12a5\u12e8\u1270\u123b\u123b\u1208"),  # Improving
]

for rel in ["src/i18n/am.ts", "backend/services/aiAnalyzer.ts"]:
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    for a, b in pairs:
        text = text.replace(a, b)
    # also replace remaining wrong syllable if present as composed
    text = text.replace("እርምጳ", "እርምጃ")
    text = text.replace("እየማሽራል", "እየተሻሻለ")
    p.write_text(text, encoding="utf-8")
    print(rel, "fffd=", text.count("\ufffd"))
