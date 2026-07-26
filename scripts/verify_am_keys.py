# -*- coding: utf-8 -*-
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
am = (root / "src/i18n/am.ts").read_text(encoding="utf-8")
en = (root / "src/i18n/en.ts").read_text(encoding="utf-8")
ai = (root / "backend/services/aiAnalyzer.ts").read_text(encoding="utf-8")

def leaf_keys(text: str):
    # rough: keys at 4-space indent ending with :
    return set(re.findall(r"(?m)^    ([A-Za-z'][A-Za-z0-9']*):", text))

missing = sorted(leaf_keys(en) - leaf_keys(am))
print("missing in am:", missing)
print("fffd am", am.count("\ufffd"), "ai", ai.count("\ufffd"))
print("localizeImpact", ai.count("private localizeImpact"))
print("v4", "v4-am-reports" in ai)
for k in ["Rapid Decline", "reportId", "narrativeByDay", "narrativeIntro", "Improving"]:
    print(k, k in am)
