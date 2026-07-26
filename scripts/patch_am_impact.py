# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "src" / "i18n" / "am.ts"
text = p.read_text(encoding="utf-8")
if "summaryBest:" in text:
    print("already patched")
    raise SystemExit(0)

m = re.search(r"(usdAvoided: '[^']*')(\s*\n\s*\},)", text)
if not m:
    raise SystemExit("usdAvoided not found")

extra_esc = (
    ",\n    summaryBest: '"
    "\u12c8\u1233\u129d \u1218\u1296 \u12a5\u122d\u121d\u1333 \u1260\u1240\u1295 {day} ~{saved} "
    "\u132d\u1295\u1245\u120b\u1275 \u120a\u12eb\u12f5\u1295 \u12ed\u127d\u120b\u120d "
    "(\u12a8\u121d\u1295\u121d \u12a0\u1295\u12f5 \u12eb\u1208\u1218\u12f5\u1228\u130d)\u1362 "
    "\u1260\u1240\u1295 15 \u12a8\u1240\u1295 60 \u12ed\u120d\u1245 \u121b\u12f5\u1228\u130d ~{extra} "
    "\u1270\u1328\u121b\u122a \u12a5\u1295\u1235\u1233\u1275\u1295 \u12ed\u1320\u1265\u1243\u120d\u1362',"
    "\n    summaryLimited: '"
    "\u12e8\u1270\u1270\u1290\u1260\u12e8 \u12e8\u1233\u122d \u132d\u1295\u1240\u1275 \u12a0\u1295\u1235\u1270\u129b \u1290\u12cd\u1364 "
    "\u12c8\u1233\u129d \u1218\u1296 \u12a5\u122d\u121d\u1333 \u1260\u12da\u1205 \u12a0\u12f5\u121b\u1235 "
    "\u12a0\u1295\u1235\u1270\u129b \u12e8\u12a8\u1265\u1276\u127d \u121b\u12f5\u1295 \u12eb\u1218\u1323\u120d\u1362'"
)
new = text[: m.end(1)] + extra_esc + text[m.start(2) :]
p.write_text(new, encoding="utf-8")
print("patched", "summaryBest" in new)
